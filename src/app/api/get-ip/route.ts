import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  // If behind a proxy, x-forwarded-for contains a list of IPs. We want the first one (the client).
  const ip = forwarded ? forwarded.split(",")[0].trim() : (request.headers.get("x-real-ip") || "127.0.0.1");
  return NextResponse.json({ ip });
}
