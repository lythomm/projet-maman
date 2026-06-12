import { redirect } from "next/navigation";
import { getAdminToken } from "@/app/actions/auth";
import ClientLogin from "./ClientLogin";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

export const dynamic = "force-dynamic";

export default async function AdminLogin() {
  const token = await getAdminToken();
  if (token) {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "http://127.0.0.1:3210";
    const convex = new ConvexHttpClient(convexUrl);
    try {
      const isValid = await convex.query(api.admin.checkSession, { token });
      if (isValid) {
        redirect("/admin/dashboard");
      }
    } catch (e) {
      // Ignore validation errors, just render login
    }
  }

  return <ClientLogin />;
}
