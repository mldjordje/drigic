import { z } from "zod";
import { created, fail, readJson } from "@/lib/api/http";
import { requireUser } from "@/lib/auth/guards";
import { getDb, schema } from "@/lib/db/client";

export const runtime = "nodejs";

const payloadSchema = z.object({
  requestedDate: z.string().datetime().optional(),
  message: z.string().max(3000).optional(),
});

export async function POST(request) {
  const auth = await requireUser(request);
  if (auth.error) {
    return auth.error;
  }

  const body = await readJson(request);
  const parsed = payloadSchema.safeParse(body || {});
  if (!parsed.success) {
    return fail(400, "Invalid payload", parsed.error.flatten());
  }

  const db = getDb();
  const [record] = await db
    .insert(schema.vipRequests)
    .values({
      userId: auth.user.id,
      requestedDate: parsed.data.requestedDate
        ? new Date(parsed.data.requestedDate)
        : null,
      message: parsed.data.message || null,
      status: "pending",
    })
    .returning();

  return created({ ok: true, data: record });
}

