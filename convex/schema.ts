import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  items: defineTable({
    title: v.string(),
    description: v.string(),
    imageStorageIds: v.array(v.id("_storage")), // Convex Storage IDs
    price: v.number(),                    // Rental price
    deposit: v.number(),                  // Caution per item
    stock: v.number(),                    // Max stock in inventory
    categoryId: v.optional(v.id("categories")),
    visible: v.optional(v.boolean()),
  }),

  bookings: defineTable({
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    phone: v.string(),
    startDate: v.string(), // YYYY-MM-DD
    endDate: v.string(),   // YYYY-MM-DD
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
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("rejected")
    ),
    createdAt: v.number(), // timestamp
    contractSignedAt: v.optional(v.number()),
    contractSignedName: v.optional(v.string()),
    contractSignedIp: v.optional(v.string()),
    contractFileId: v.optional(v.id("_storage")),
  }).index("by_status", ["status"]),

  categories: defineTable({
    name: v.string(),
  }).index("by_name", ["name"]),

  settings: defineTable({
    deliveryFee: v.number(),
    terms: v.optional(v.string()),
  }),

  sessions: defineTable({
    token: v.string(),
    expiresAt: v.number(), // timestamp
  }).index("by_token", ["token"]),
});
