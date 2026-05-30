import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { checkAuth } from "./admin";

// List all items
export const list = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("items").collect();
    // Resolve image URLs and category name
    const resolvedItems = await Promise.all(
      items.map(async (item) => {
        const imageUrls = await Promise.all(
          item.imageStorageIds.map((id) => ctx.storage.getUrl(id))
        );
        const category = item.categoryId ? await ctx.db.get(item.categoryId) : null;
        return {
          ...item,
          imageUrls: imageUrls.filter((url): url is string => url !== null),
          categoryName: category ? category.name : undefined,
        };
      })
    );
    return resolvedItems;
  },
});

// Get a single item
export const get = query({
  args: { id: v.id("items") },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.id);
    if (!item) return null;
    const imageUrls = await Promise.all(
      item.imageStorageIds.map((id) => ctx.storage.getUrl(id))
    );
    const category = item.categoryId ? await ctx.db.get(item.categoryId) : null;
    return {
      ...item,
      imageUrls: imageUrls.filter((url): url is string => url !== null),
      categoryName: category ? category.name : undefined,
    };
  },
});

// Generate an upload URL for images (Admin only)
export const generateUploadUrl = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    await checkAuth(ctx.db, args.token);
    return await ctx.storage.generateUploadUrl();
  },
});

// Create a new item (Admin only)
export const create = mutation({
  args: {
    token: v.string(),
    title: v.string(),
    description: v.string(),
    imageStorageIds: v.array(v.id("_storage")),
    price: v.number(),
    deposit: v.number(),
    stock: v.number(),
    categoryId: v.optional(v.id("categories")),
  },
  handler: async (ctx, args) => {
    await checkAuth(ctx.db, args.token);
    const { token, ...itemData } = args;
    return await ctx.db.insert("items", itemData);
  },
});

// Update an item (Admin only)
export const update = mutation({
  args: {
    token: v.string(),
    id: v.id("items"),
    title: v.string(),
    description: v.string(),
    imageStorageIds: v.array(v.id("_storage")),
    price: v.number(),
    deposit: v.number(),
    stock: v.number(),
    categoryId: v.optional(v.id("categories")),
  },
  handler: async (ctx, args) => {
    await checkAuth(ctx.db, args.token);
    const { token, id, ...itemData } = args;
    await ctx.db.patch(id, itemData);
  },
});

// Delete an item (Admin only)
export const remove = mutation({
  args: { token: v.string(), id: v.id("items") },
  handler: async (ctx, args) => {
    await checkAuth(ctx.db, args.token);
    const item = await ctx.db.get(args.id);
    if (!item) throw new Error("Matériel introuvable.");

    // Clean up images in storage
    for (const imageId of item.imageStorageIds) {
      try {
        await ctx.storage.delete(imageId);
      } catch (e) {
        console.error("Failed to delete storage file", imageId, e);
      }
    }

    await ctx.db.delete(args.id);
  },
});

// Delete storage files (Admin only)
export const deleteStorageFiles = mutation({
  args: {
    token: v.string(),
    storageIds: v.array(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    await checkAuth(ctx.db, args.token);
    for (const storageId of args.storageIds) {
      try {
        await ctx.storage.delete(storageId);
      } catch (e) {
        console.error("Failed to delete storage file from Convex:", storageId, e);
      }
    }
  },
});
