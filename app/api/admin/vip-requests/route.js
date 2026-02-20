import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { fail, ok, readJson } from "@/lib/api/http";
import { requireAdmin } from "@/lib/auth/guards";
import { getDb, schema } from "@/lib/db/client";

export const runtime = "nodejs";

const updateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "approved", "rejected"]),
  note: z.string().max(1000).optional(),
});

export async function GET(request) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return auth.error;
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(schema.vipRequests)
    .orderBy(desc(schema.vipRequests.createdAt));

  return ok({ ok: true, data: rows });
}

export async function PATCH(request) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return auth.error;
  }

  const body = await readJson(request);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return fail(400, "Invalid payload", parsed.error.flatten());
  }

  const db = getDb();
  const [updated] = await db
    .update(schema.vipRequests)
    .set({
      status: parsed.data.status,
      reviewedByUserId: auth.user.id,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(schema.vipRequests.id, parsed.data.id))
    .returning();

  if (!updated) {
    return fail(404, "VIP request not found.");
  }

  return ok({ ok: true, data: updated });
}

