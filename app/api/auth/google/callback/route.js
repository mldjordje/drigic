import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb, schema } from "@/lib/db/client";
import {
  getBaseUrl,
  getGoogleRedirectUri,
  GOOGLE_OAUTH_NEXT_COOKIE,
  GOOGLE_OAUTH_STATE_COOKIE,
  hasGoogleConfig,
  sanitizeNextPath,
} from "@/lib/auth/google";
import { setSessionCookie, signSessionToken } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function loginRedirect(request, reason, nextPath = "/") {
  const url = new URL("/prijava", request.url);
  url.searchParams.set("reason", reason);
  url.searchParams.set("next", sanitizeNextPath(nextPath));
  return url;
}

function clearGoogleOauthCookies(response) {
  response.cookies.set({
    name: GOOGLE_OAUTH_STATE_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  response.cookies.set({
    name: GOOGLE_OAUTH_NEXT_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function GET(request) {
  const db = getDb();
  const url = new URL(request.url);

  const nextPathFromCookie = sanitizeNextPath(
    request.cookies.get(GOOGLE_OAUTH_NEXT_COOKIE)?.value || "/"
  );

  if (!hasGoogleConfig()) {
    return NextResponse.redirect(
      loginRedirect(request, "google-config-missing", nextPathFromCookie)
    );
  }

  const error = url.searchParams.get("error");
  if (error) {
    return NextResponse.redirect(
      loginRedirect(request, "google-denied", nextPathFromCookie)
    );
  }

  const code = url.searchParams.get("code");
  const returnedState = url.searchParams.get("state");
  const expectedState = request.cookies.get(GOOGLE_OAUTH_STATE_COOKIE)?.value;

  if (!code || !returnedState || !expectedState || returnedState !== expectedState) {
    return NextResponse.redirect(
      loginRedirect(request, "google-state-invalid", nextPathFromCookie)
    );
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
      return NextResponse.redirect(
        loginRedirect(request, "google-token-failed", nextPathFromCookie)
      );
    }

    const tokenData = await tokenResponse.json();
    if (!tokenData?.access_token) {
      return NextResponse.redirect(
        loginRedirect(request, "google-token-failed", nextPathFromCookie)
      );
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
      return NextResponse.redirect(
        loginRedirect(request, "google-userinfo-failed", nextPathFromCookie)
      );
    }

    const userInfo = await userInfoResponse.json();
    const email = String(userInfo?.email || "").trim().toLowerCase();
    if (!email) {
      return NextResponse.redirect(
        loginRedirect(request, "google-email-missing", nextPathFromCookie)
      );
    }

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
          role: "client",
        })
        .returning();
    }

    const now = new Date();
    await db
      .update(schema.users)
      .set({
        lastLoginAt: now,
        updatedAt: now,
      })
      .where(eq(schema.users.id, user.id));

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
    return NextResponse.redirect(
      loginRedirect(request, "google-auth-failed", nextPathFromCookie)
    );
  }
}

