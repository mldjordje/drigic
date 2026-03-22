import { NextResponse } from "next/server";

export function ok(data = {}, init = {}) {
  return NextResponse.json(data, { status: 200, ...init });
}

export function buildPublicCacheHeaders({
  sMaxAge = 300,
  staleWhileRevalidate = 1800,
} = {}) {
  const value = `public, s-maxage=${sMaxAge}, stale-while-revalidate=${staleWhileRevalidate}`;

  return {
    "Cache-Control": value,
    "CDN-Cache-Control": value,
    "Vercel-CDN-Cache-Control": value,
  };
}

export function publicOk(data = {}, cacheOptions = {}, init = {}) {
  const headers = new Headers(init.headers || {});
  const cacheHeaders = buildPublicCacheHeaders(cacheOptions);

  Object.entries(cacheHeaders).forEach(([key, value]) => {
    headers.set(key, value);
  });

  return ok(data, {
    ...init,
    headers,
  });
}

export function created(data = {}) {
  return NextResponse.json(data, { status: 201 });
}

export function fail(status, message, details) {
  return NextResponse.json(
    {
      ok: false,
      message,
      ...(details ? { details } : {}),
    },
    { status }
  );
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function normalizeBoolean(value) {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }
  return false;
}
