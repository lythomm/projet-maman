import { action, mutation, query, internalMutation, DatabaseReader } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// Action to verify password and create a session
export const login = action({
  args: { password: v.string() },
  handler: async (ctx, args) => {
    const adminPassword = process.env.ADMIN_PASSWORD || "password";
    if (args.password !== adminPassword) {
      throw new Error("Invalid password");
    }

    // Generate secure session token
    const token = 
      Math.random().toString(36).substring(2) + 
      Math.random().toString(36).substring(2) + 
      Date.now().toString(36);

    // Call mutation to save session
    await ctx.runMutation(internal.admin.createSession, {
      token,
      expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
    });

    return { token };
  },
});

// Internal mutation to save the session
export const createSession = internalMutation({
  args: { token: v.string(), expiresAt: v.number() },
  handler: async (ctx, args) => {
    await ctx.db.insert("sessions", {
      token: args.token,
      expiresAt: args.expiresAt,
    });
  },
});

// Query to check if a session token is valid
export const checkSession = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();
    if (!session || session.expiresAt < Date.now()) {
      return false;
    }
    return true;
  },
});

// Helper to check auth inside queries/mutations
export async function checkAuth(db: DatabaseReader, token: string) {
  const session = await db
    .query("sessions")
    .withIndex("by_token", (q) => q.eq("token", token))
    .unique();
  if (!session || session.expiresAt < Date.now()) {
    throw new Error("Unauthorized");
  }
  return true;
}
