import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "http://127.0.0.1:3210";
const convex = new ConvexHttpClient(convexUrl);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /admin routes, but not the login page itself
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = request.cookies.get("admin_session_token")?.value;

    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    try {
      // Check session validity with Convex
      const isValid = await convex.query(api.admin.checkSession, { token });
      if (!isValid) {
        // Clear invalid token cookie and redirect
        const response = NextResponse.redirect(new URL("/admin/login", request.url));
        response.cookies.delete("admin_session_token");
        return response;
      }
    } catch (error) {
      console.error("Middleware session verification failed:", error);
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  // Redirect /admin/login to /admin if already logged in
  if (pathname === "/admin/login") {
    const token = request.cookies.get("admin_session_token")?.value;
    if (token) {
      try {
        const isValid = await convex.query(api.admin.checkSession, { token });
        if (isValid) {
          return NextResponse.redirect(new URL("/admin/dashboard", request.url));
        }
      } catch (e) {
        // Ignore check error on login redirect
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
