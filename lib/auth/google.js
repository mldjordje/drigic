import { randomBytes } from "crypto";

export const GOOGLE_OAUTH_STATE_COOKIE = "drigic_google_oauth_state";
export const GOOGLE_OAUTH_NEXT_COOKIE = "drigic_google_oauth_next";

export function sanitizeNextPath(nextPath) {
  if (!nextPath || typeof nextPath !== "string") {
    return "/";
  }
  if (!nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return "/";
  }
  return nextPath;
}

export function getBaseUrl(request) {
  const explicitBase =
    process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "";
  if (explicitBase) {
    return explicitBase.replace(/\/+$/, "");
  }

  const proto =
    request.headers.get("x-forwarded-proto") ||
    (process.env.NODE_ENV === "production" ? "https" : "http");
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  if (!host) {
    return "http://localhost:3000";
  }
  return `${proto}://${host}`;
}

export function getGoogleRedirectUri(request) {
  return `${getBaseUrl(request)}/api/auth/google/callback`;
}

export function createGoogleOauthState() {
  return randomBytes(24).toString("hex");
}

export function hasGoogleConfig() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function buildGoogleAuthUrl(request, state) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID is missing.");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getGoogleRedirectUri(request),
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

