import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  items: defineTable({
    title: v.string(),
    description: v.string(),
    imageStorageIds: v.array(v.string()), // Convex Storage IDs
    price: v.number(),                    // Rental price
    deposit: v.number(),                  // Caution per item
    stock: v.number(),                    // Max stock in inventory
  }),

  bookings: defineTable({
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    phone: v.string(),
    startDate: v.string(), // YYYY-MM-DD
    endDate: v.string(),   // YYYY-MM-DD
    delivery: v.boolean(),
    items: v.array(
      v.object({
        itemId: v.id("items"),
        quantity: v.number(),
      })
    ),
    totalPrice: v.number(),
    totalDeposit: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("rejected")
    ),
    createdAt: v.number(), // timestamp
  }).index("by_status", ["status"]),

  settings: defineTable({
    deliveryFee: v.number(),
  }),

  sessions: defineTable({
    token: v.string(),
    expiresAt: v.number(), // timestamp
  }).index("by_token", ["token"]),
});
