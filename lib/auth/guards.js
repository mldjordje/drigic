import { and, eq } from "drizzle-orm";
import { fail } from "@/lib/api/http";
import { getDb, schema } from "@/lib/db/client";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";

export async function getSessionFromRequest(request) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const payload = await verifySessionToken(token);
  if (!payload?.sub) {
    return null;
  }

  const db = getDb();
  const [user] = await db
    .select({
      id: schema.users.id,
      email: schema.users.email,
      phone: schema.users.phone,
      role: schema.users.role,
    })
    .from(schema.users)
    .where(and(eq(schema.users.id, String(payload.sub))));

  if (!user) {
    return null;
  }

  return user;
}

export async function requireUser(request) {
  const user = await getSessionFromRequest(request);
  if (!user) {
    return { user: null, error: fail(401, "Unauthorized") };
  }
  return { user, error: null };
}

export async function requireAdmin(request) {
  const session = await requireUser(request);
  if (session.error) {
    return session;
  }
  if (session.user.role !== "admin") {
    return { user: null, error: fail(403, "Admin access required") };
  }

  return session;
}

