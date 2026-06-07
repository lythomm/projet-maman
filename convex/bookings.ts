import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { checkAuth } from "./admin";

// Helper function to check if two date ranges overlap
function dateOverlaps(startA: string, endA: string, startB: string, endB: string) {
  const maxStart = startA > startB ? startA : startB;
  const minEnd = endA < endB ? endA : endB;
  return maxStart <= minEnd;
}

// Get available stock for all items during a specific date range
export const getAvailableStock = query({
  args: { startDate: v.string(), endDate: v.string() },
  handler: async (ctx, args) => {
    // 1. Get all items
    const items = await ctx.db.query("items").collect();
    const visibleItems = items.filter((item) => item.visible !== false);

    // 2. Get all accepted bookings
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_status", (q) => q.eq("status", "accepted"))
      .collect();

    // 3. Filter overlapping bookings
    const overlappingBookings = bookings.filter((b) =>
      dateOverlaps(args.startDate, args.endDate, b.startDate, b.endDate)
    );

    // 4. Calculate allocated quantities
    const allocated: Record<string, number> = {};
    for (const booking of overlappingBookings) {
      for (const item of booking.items) {
        allocated[item.itemId] = (allocated[item.itemId] || 0) + item.quantity;
      }
    }

    // 5. Build available stock list
    return visibleItems.map((item) => {
      const reserved = allocated[item._id] || 0;
      return {
        itemId: item._id,
        title: item.title,
        totalStock: item.stock,
        availableStock: Math.max(0, item.stock - reserved),
      };
    });
  },
});

// Create a new booking request
export const create = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    phone: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    delivery: v.boolean(),
    deliveryAddress: v.optional(v.string()),
    items: v.array(
      v.object({
        itemId: v.id("items"),
        quantity: v.number(),
      })
    ),
    totalPrice: v.number(),
    totalDeposit: v.number(),
  },
  handler: async (ctx, args) => {
    // 1. Validate dates are valid format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(args.startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(args.endDate)) {
      throw new Error("Format de date invalide. Attendu : AAAA-MM-JJ.");
    }
    if (args.startDate > args.endDate) {
      throw new Error("La date de début doit être antérieure ou égale à la date de fin.");
    }

    // 2. Double-check stock (optimistic checking)
    // Get all accepted bookings for this range
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_status", (q) => q.eq("status", "accepted"))
      .collect();

    const overlappingBookings = bookings.filter((b) =>
      dateOverlaps(args.startDate, args.endDate, b.startDate, b.endDate)
    );

    const allocated: Record<string, number> = {};
    for (const booking of overlappingBookings) {
      for (const item of booking.items) {
        allocated[item.itemId] = (allocated[item.itemId] || 0) + item.quantity;
      }
    }

    // Check each requested item
    for (const reqItem of args.items) {
      const item = await ctx.db.get(reqItem.itemId);
      if (!item || item.visible === false) throw new Error("Matériel introuvable ou indisponible.");
      const reserved = allocated[reqItem.itemId] || 0;
      const available = item.stock - reserved;
      if (reqItem.quantity > available) {
        throw new Error(`Stock insuffisant pour ${item.title}. Demandé : ${reqItem.quantity}, Disponible : ${available}.`);
      }
    }

    // 3. Create booking
    const bookingId = await ctx.db.insert("bookings", {
      ...args,
      status: "pending",
      createdAt: Date.now(),
    });

    // Mock Email sending (just console log on backend)
    console.log(`[EMAIL MOCK] Nouvelle demande de location reçue !`);
    console.log(`Client : ${args.firstName} ${args.lastName} (${args.email}, ${args.phone})`);
    console.log(`Période : ${args.startDate} au ${args.endDate}`);
    console.log(`Total : ${args.totalPrice}€, Caution : ${args.totalDeposit}€`);
    console.log(`Livraison : ${args.delivery ? "Oui" : "Non"}${args.delivery && args.deliveryAddress ? ` — Adresse : ${args.deliveryAddress}` : ""}`);
    console.log(`ID Réservation : ${bookingId}`);

    return bookingId;
  },
});

// List all bookings (Admin only)
export const list = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    await checkAuth(ctx.db, args.token);
    const bookings = await ctx.db.query("bookings").collect();
    
    // Sort bookings by creation date descending
    const sorted = bookings.sort((a, b) => b.createdAt - a.createdAt);

    // Resolve items details
    return await Promise.all(
      sorted.map(async (booking) => {
        const itemsWithDetails = await Promise.all(
          booking.items.map(async (item) => {
            const detail = await ctx.db.get(item.itemId);
            return {
              ...item,
              title: detail?.title || "Matériel supprimé",
            };
          })
        );
        const contractFileUrl = booking.contractFileId
          ? await ctx.storage.getUrl(booking.contractFileId)
          : undefined;
        return {
          ...booking,
          items: itemsWithDetails,
          contractFileUrl,
        };
      })
    );
  },
});

// Update booking status (Admin only)
export const updateStatus = mutation({
  args: {
    token: v.string(),
    id: v.id("bookings"),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("rejected")),
  },
  handler: async (ctx, args) => {
    await checkAuth(ctx.db, args.token);
    
    const booking = await ctx.db.get(args.id);
    if (!booking) throw new Error("Réservation introuvable.");

    // If accepting, double-check stock conflicts and signature
    if (args.status === "accepted") {
      if (!booking.contractSignedAt) {
        throw new Error("Le contrat doit être signé par le client avant d'accepter la réservation.");
      }
      const bookings = await ctx.db
        .query("bookings")
        .withIndex("by_status", (q) => q.eq("status", "accepted"))
        .collect();

      const overlappingBookings = bookings.filter((b) =>
        b._id !== args.id && dateOverlaps(booking.startDate, booking.endDate, b.startDate, b.endDate)
      );

      const allocated: Record<string, number> = {};
      for (const b of overlappingBookings) {
        for (const item of b.items) {
          allocated[item.itemId] = (allocated[item.itemId] || 0) + item.quantity;
        }
      }

      for (const reqItem of booking.items) {
        const item = await ctx.db.get(reqItem.itemId);
        if (!item) throw new Error("Matériel introuvable.");
        const reserved = allocated[reqItem.itemId] || 0;
        const available = item.stock - reserved;
        if (reqItem.quantity > available) {
          throw new Error(`Conflit de stock pour ${item.title}. Disponible : ${available}, Demandé : ${reqItem.quantity}`);
        }
      }
    }

    await ctx.db.patch(args.id, { status: args.status });
  },
});

// Delete a booking (Admin only)
export const remove = mutation({
  args: { token: v.string(), id: v.id("bookings") },
  handler: async (ctx, args) => {
    await checkAuth(ctx.db, args.token);
    await ctx.db.delete(args.id);
  },
});

// Get public contract details (Public access via unique booking ID)
export const getPublicBooking = query({
  args: { id: v.id("bookings") },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.id);
    if (!booking) return null;

    // Resolve items details with price and title
    const itemsWithDetails = await Promise.all(
      booking.items.map(async (item) => {
        const detail = await ctx.db.get(item.itemId);
        return {
          ...item,
          title: detail?.title || "Matériel supprimé",
          price: detail?.price || 0,
        };
      })
    );

    const contractFileUrl = booking.contractFileId
      ? await ctx.storage.getUrl(booking.contractFileId)
      : undefined;

    return {
      ...booking,
      items: itemsWithDetails,
      contractFileUrl,
    };
  },
});

// Sign contract (Public access, checked to ensure status is pending)
export const signContract = mutation({
  args: {
    id: v.id("bookings"),
    signedName: v.string(),
    ip: v.string(),
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.id);
    if (!booking) throw new Error("Réservation introuvable.");
    if (booking.status !== "pending") {
      throw new Error("Le contrat ne peut être signé que pour une réservation en attente.");
    }
    if (booking.contractSignedAt) {
      throw new Error("Le contrat a déjà été signé.");
    }
    if (!args.signedName.trim()) {
      throw new Error("Le nom de signature ne peut pas être vide.");
    }

    // Double-check stock conflicts before accepting
    const acceptedBookings = await ctx.db
      .query("bookings")
      .withIndex("by_status", (q) => q.eq("status", "accepted"))
      .collect();

    const overlappingBookings = acceptedBookings.filter((b) =>
      b._id !== args.id && dateOverlaps(booking.startDate, booking.endDate, b.startDate, b.endDate)
    );

    const allocated: Record<string, number> = {};
    for (const b of overlappingBookings) {
      for (const item of b.items) {
        allocated[item.itemId] = (allocated[item.itemId] || 0) + item.quantity;
      }
    }

    for (const reqItem of booking.items) {
      const item = await ctx.db.get(reqItem.itemId);
      if (!item) throw new Error("Matériel introuvable.");
      const reserved = allocated[reqItem.itemId] || 0;
      const available = item.stock - reserved;
      if (reqItem.quantity > available) {
        throw new Error(`Conflit de stock pour ${item.title}. Disponible : ${available}, Demandé : ${reqItem.quantity}`);
      }
    }

    await ctx.db.patch(args.id, {
      status: "accepted",
      contractSignedAt: Date.now(),
      contractSignedName: args.signedName,
      contractSignedIp: args.ip,
    });

    console.log(`[EMAIL MOCK] Contrat signé par le client ${booking.firstName} ${booking.lastName} (IP: ${args.ip})`);
    return args.id;
  },
});

// Save contract file storage ID
export const saveContractFileId = mutation({
  args: {
    id: v.id("bookings"),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.id);
    if (!booking) throw new Error("Réservation introuvable.");
    if (!booking.contractSignedAt) {
      throw new Error("Le contrat doit être signé avant de sauvegarder le fichier.");
    }
    await ctx.db.patch(args.id, {
      contractFileId: args.storageId,
    });
  },
});

// Generate upload URL for public contract signing
export const generateContractUploadUrl = mutation({
  args: {
    bookingId: v.id("bookings"),
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) throw new Error("Réservation introuvable.");
    if (booking.status !== "pending" && (booking.status !== "accepted" || booking.contractFileId)) {
      throw new Error("Le contrat ne peut être signé que pour une réservation en attente ou nouvellement signée.");
    }
    return await ctx.storage.generateUploadUrl();
  },
});

