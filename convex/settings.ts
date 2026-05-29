import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { checkAuth } from "./admin";

// Get settings (public)
export const get = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("settings").first();
    if (!settings) {
      return { deliveryFee: 20 }; // Default fallback
    }
    return settings;
  },
});

// Update settings (Admin only)
export const update = mutation({
  args: {
    token: v.string(),
    deliveryFee: v.number(),
  },
  handler: async (ctx, args) => {
    await checkAuth(ctx.db, args.token);
    const settings = await ctx.db.query("settings").first();
    if (settings) {
      await ctx.db.patch(settings._id, { deliveryFee: args.deliveryFee });
    } else {
      await ctx.db.insert("settings", { deliveryFee: args.deliveryFee });
    }
  },
});
