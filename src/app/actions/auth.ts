"use server";

import { cookies } from "next/headers";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "http://127.0.0.1:3210";
const convex = new ConvexHttpClient(convexUrl);

export async function adminLoginAction(password: string) {
  try {
    // Call Convex action to log in
    const result = await convex.action(api.admin.login, { password });
    
    // Set HTTP-only secure cookie
    const cookieStore = await cookies();
    cookieStore.set("admin_session_token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Mot de passe incorrect" };
  }
}

export async function adminLogoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("admin_session_token");
  return { success: true };
}

export async function getAdminToken() {
  const cookieStore = await cookies();
  return cookieStore.get("admin_session_token")?.value;
}
