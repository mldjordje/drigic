import { randomBytes } from "crypto";

export const GOOGLE_OAUTH_STATE_COOKIE = "drigic_google_oauth_state";
export const GOOGLE_OAUTH_NEXT_COOKIE = "drigic_google_oauth_next";
const PRODUCTION_FALLBACK_BASE_URL = "https://drigic.rs";

export function getGoogleOauthCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
}

export function sanitizeNextPath(nextPath) {
  if (!nextPath || typeof nextPath !== "string") {
    return "/";
  }
  if (!nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return "/";
  }
  return nextPath;
}

function normalizeUrlValue(value) {
  const normalized = String(value || "").trim().replace(/\/+$/, "");
  if (!normalized) {
    return "";
  }

  try {
    return new URL(normalized).toString().replace(/\/+$/, "");
  } catch {
    return "";
  }
}

function isLocalhostUrl(value) {
  try {
    const url = new URL(value);
    return ["localhost", "127.0.0.1", "0.0.0.0"].includes(url.hostname);
  } catch {
    return false;
  }
}

function getConfiguredBaseUrl() {
  const candidates = [
    process.env.APP_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeUrlValue(candidate);
    if (!normalized) {
      continue;
    }
    if (process.env.NODE_ENV === "production" && isLocalhostUrl(normalized)) {
      continue;
    }
    return normalized;
  }

  if (process.env.NODE_ENV === "production") {
    return PRODUCTION_FALLBACK_BASE_URL;
  }

  return "";
}

function getRequestBaseUrl(request) {
  try {
    return new URL(request.url).origin.replace(/\/+$/, "");
  } catch {
    // Fall through to forwarded headers when request.url is unavailable.
  }

  const proto =
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
    (process.env.NODE_ENV === "production" ? "https" : "http");
  const host =
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    request.headers.get("host");
  if (!host) {
    return `${proto}://localhost:3000`;
  }
  return `${proto}://${host}`;
}

export function getBaseUrl(request) {
  const requestBaseUrl = getRequestBaseUrl(request);
  if (requestBaseUrl) {
    return requestBaseUrl;
  }

  const configuredBaseUrl = getConfiguredBaseUrl();
  if (configuredBaseUrl) {
    return configuredBaseUrl;
  }
  return PRODUCTION_FALLBACK_BASE_URL;
}

export function getGoogleRedirectUri(request) {
  const configuredRedirectUri = normalizeUrlValue(process.env.GOOGLE_REDIRECT_URI);
  const requestBaseUrl = getRequestBaseUrl(request);
  const requestHost = requestBaseUrl ? new URL(requestBaseUrl).hostname : "";

  if (configuredRedirectUri && requestHost && !requestHost.endsWith(".vercel.app")) {
    return configuredRedirectUri;
  }
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
