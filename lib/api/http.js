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

/**
 * 400 for a body that failed zod validation, with a message the patient can act on.
 *
 * `labels` maps a field path ("notes", "guest.email", "serviceSelections") to a
 * readable name; the longest matching prefix wins. The failing paths are logged
 * so a support report of "Invalid payload" can be traced — issue codes only,
 * never the submitted values.
 */
export function invalidPayload(error, { route = "api", labels = {} } = {}) {
  const issues = (error?.issues || []).map((issue) => ({
    path: (issue.path || []).join("."),
    code: issue.code,
    message: issue.message,
  }));
  console.warn(`[${route}] invalid payload`, issues);

  const names = [];
  for (const { path } of issues) {
    if (!path) {
      // Whole body missing or not JSON — nothing the patient typed is to blame.
      continue;
    }
    const key = Object.keys(labels)
      .filter((candidate) => path === candidate || path.startsWith(`${candidate}.`))
      .sort((a, b) => b.length - a.length)[0];
    const name = key ? labels[key] : path;
    if (!names.includes(name)) {
      names.push(name);
    }
  }

  const message = names.length
    ? `Neispravni podaci: ${names.join(", ")}. Proverite unos i pokušajte ponovo.`
    : "Neispravni podaci. Osvežite stranicu i pokušajte ponovo.";

  return fail(400, message, error?.flatten ? error.flatten() : undefined);
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
