import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";

function unauthorizedResponse(request) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json(
      { ok: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = "/";
  redirectUrl.searchParams.set("adminAuth", "required");
  return NextResponse.redirect(redirectUrl);
}

function forbiddenResponse(request) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json(
      { ok: false, message: "Admin access required" },
      { status: 403 }
    );
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = "/";
  redirectUrl.searchParams.set("adminAuth", "forbidden");
  return NextResponse.redirect(redirectUrl);
}

export async function middleware(request) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return unauthorizedResponse(request);
  }

  const session = await verifySessionToken(token);
  if (!session) {
    return unauthorizedResponse(request);
  }

  if (session.role !== "admin") {
    return forbiddenResponse(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

