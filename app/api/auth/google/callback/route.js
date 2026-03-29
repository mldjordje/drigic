import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb, schema } from "@/lib/db/client";
import {
  getBaseUrl,
  getGoogleOauthCookieOptions,
  getGoogleRedirectUri,
  GOOGLE_OAUTH_NEXT_COOKIE,
  GOOGLE_OAUTH_STATE_COOKIE,
  hasGoogleConfig,
  sanitizeNextPath,
} from "@/lib/auth/google";
import {
  hasSessionSecret,
  setSessionCookie,
  signSessionToken,
} from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const ADMIN_EMAILS = new Set([
  "web.wise018@gmail.com",
  "igic.nikola8397@gmail.com",
]);

function loginRedirect(request, reason, nextPath = "/") {
  const url = new URL("/prijava", request.url);
  url.searchParams.set("reason", reason);
  url.searchParams.set("next", sanitizeNextPath(nextPath));
  return url;
}

function clearGoogleOauthCookies(response) {
  const cookieOptions = getGoogleOauthCookieOptions();

  response.cookies.set({
    name: GOOGLE_OAUTH_STATE_COOKIE,
    value: "",
    ...cookieOptions,
    maxAge: 0,
  });
  response.cookies.set({
    name: GOOGLE_OAUTH_NEXT_COOKIE,
    value: "",
    ...cookieOptions,
    maxAge: 0,
  });
}

function redirectToLogin(request, reason, nextPath) {
  const response = NextResponse.redirect(loginRedirect(request, reason, nextPath));
  clearGoogleOauthCookies(response);
  return response;
}

export async function GET(request) {
  const db = getDb();
  const url = new URL(request.url);

  const nextPathFromCookie = sanitizeNextPath(
    request.cookies.get(GOOGLE_OAUTH_NEXT_COOKIE)?.value || "/"
  );

  if (!hasGoogleConfig() || !hasSessionSecret()) {
    return redirectToLogin(
      request,
      hasGoogleConfig() ? "session-config-missing" : "google-config-missing",
      nextPathFromCookie
    );
  }

  const error = url.searchParams.get("error");
  if (error) {
    return redirectToLogin(request, "google-denied", nextPathFromCookie);
  }

  const code = url.searchParams.get("code");
  const returnedState = url.searchParams.get("state");
  const expectedState = request.cookies.get(GOOGLE_OAUTH_STATE_COOKIE)?.value;

  if (!code || !returnedState || !expectedState || returnedState !== expectedState) {
    return redirectToLogin(request, "google-state-invalid", nextPathFromCookie);
  }

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: getGoogleRedirectUri(request),
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      return redirectToLogin(request, "google-token-failed", nextPathFromCookie);
    }

    const tokenData = await tokenResponse.json();
    if (!tokenData?.access_token) {
      return redirectToLogin(request, "google-token-failed", nextPathFromCookie);
    }

    const userInfoResponse = await fetch(
      "https://openidconnect.googleapis.com/v1/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    );

    if (!userInfoResponse.ok) {
      return redirectToLogin(request, "google-userinfo-failed", nextPathFromCookie);
    }

    const userInfo = await userInfoResponse.json();
    const email = String(userInfo?.email || "").trim().toLowerCase();
    if (!email) {
      return redirectToLogin(request, "google-email-missing", nextPathFromCookie);
    }

    const targetRole = ADMIN_EMAILS.has(email) ? "admin" : "client";

    const [existingUser] = await db
      .select()
      .from(schema.users)
      .where(and(eq(schema.users.email, email)))
      .limit(1);

    let user = existingUser;
    if (!user) {
      [user] = await db
        .insert(schema.users)
        .values({
          email,
          role: targetRole,
        })
        .returning();
    }

    const now = new Date();
    const [updatedUser] = await db
      .update(schema.users)
      .set({
        role: targetRole,
        lastLoginAt: now,
        updatedAt: now,
      })
      .where(eq(schema.users.id, user.id))
      .returning();
    user = updatedUser || user;

    const token = await signSessionToken({
      sub: user.id,
      role: user.role,
      email: user.email,
      phone: user.phone,
    });

    const successRedirect = new URL(
      sanitizeNextPath(nextPathFromCookie),
      getBaseUrl(request)
    );
    const response = NextResponse.redirect(successRedirect);
    setSessionCookie(response, token);
    clearGoogleOauthCookies(response);
    return response;
  } catch {
    return redirectToLogin(request, "google-auth-failed", nextPathFromCookie);
  }
}
