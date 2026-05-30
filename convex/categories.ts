import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { checkAuth } from "./admin";

// List all categories
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("categories").collect();
  },
});

// Create a new category (Admin only)
export const create = mutation({
  args: { token: v.string(), name: v.string() },
  handler: async (ctx, args) => {
    await checkAuth(ctx.db, args.token);
    const name = args.name.trim();

    if (!name) {
      throw new Error("Le nom de la catégorie ne peut pas être vide.");
    }
    if (/[\/\?%]/.test(name)) {
      throw new Error("Le nom contient des caractères invalides.");
    }

    const existing = await ctx.db
      .query("categories")
      .withIndex("by_name", (q) => q.eq("name", name))
      .first();

    if (existing) {
      throw new Error("Cette catégorie existe déjà.");
    }

    return await ctx.db.insert("categories", { name });
  },
});

// Update a category (Admin only)
export const update = mutation({
  args: { token: v.string(), id: v.id("categories"), name: v.string() },
  handler: async (ctx, args) => {
    await checkAuth(ctx.db, args.token);
    const name = args.name.trim();

    if (!name) {
      throw new Error("Le nom de la catégorie ne peut pas être vide.");
    }
    if (/[\/\?%]/.test(name)) {
      throw new Error("Le nom contient des caractères invalides.");
    }

    const existing = await ctx.db
      .query("categories")
      .withIndex("by_name", (q) => q.eq("name", name))
      .first();

    if (existing && existing._id !== args.id) {
      throw new Error("Une catégorie portant ce nom existe déjà.");
    }

    await ctx.db.patch(args.id, { name });
  },
});

// Delete a category (Admin only)
export const remove = mutation({
  args: { token: v.string(), id: v.id("categories") },
  handler: async (ctx, args) => {
    await checkAuth(ctx.db, args.token);

    // Unlink category from all items referencing it
    const items = await ctx.db
      .query("items")
      .filter((q) => q.eq(q.field("categoryId"), args.id))
      .collect();

    for (const item of items) {
      await ctx.db.patch(item._id, { categoryId: undefined });
    }

    await ctx.db.delete(args.id);
  },
});
