import { NextResponse } from "next/server";
import {
  buildGoogleAuthUrl,
  createGoogleOauthState,
  getGoogleOauthCookieOptions,
  GOOGLE_OAUTH_NEXT_COOKIE,
  GOOGLE_OAUTH_STATE_COOKIE,
  hasGoogleConfig,
  sanitizeNextPath,
} from "@/lib/auth/google";
import { hasSessionSecret } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const nextPath = sanitizeNextPath(searchParams.get("next") || "/");

  if (!hasGoogleConfig() || !hasSessionSecret()) {
    const redirectUrl = new URL("/prijava", request.url);
    redirectUrl.searchParams.set(
      "reason",
      hasGoogleConfig() ? "session-config-missing" : "google-config-missing"
    );
    redirectUrl.searchParams.set("next", nextPath);
    return NextResponse.redirect(redirectUrl);
  }

  const state = createGoogleOauthState();
  const authUrl = buildGoogleAuthUrl(request, state);
  const cookieOptions = getGoogleOauthCookieOptions();

  const response = NextResponse.redirect(authUrl);
  response.cookies.set({
    name: GOOGLE_OAUTH_STATE_COOKIE,
    value: state,
    ...cookieOptions,
    maxAge: 60 * 10,
  });
  response.cookies.set({
    name: GOOGLE_OAUTH_NEXT_COOKIE,
    value: nextPath,
    ...cookieOptions,
    maxAge: 60 * 10,
  });

  return response;
}
