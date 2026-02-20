import { eq } from "drizzle-orm";
import { fail, ok } from "@/lib/api/http";
import { requireAdmin } from "@/lib/auth/guards";
import { getDb, schema } from "@/lib/db/client";

export const runtime = "nodejs";

export async function DELETE(request, { params }) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return auth.error;
  }

  const { id } = params || {};
  if (!id) {
    return fail(400, "Missing block id.");
  }

  const db = getDb();
  const [existing] = await db
    .select()
    .from(schema.bookingBlocks)
    .where(eq(schema.bookingBlocks.id, id))
    .limit(1);

  if (!existing) {
    return fail(404, "Block not found.");
  }

  await db.delete(schema.bookingBlocks).where(eq(schema.bookingBlocks.id, id));
  return ok({ ok: true, deletedId: id });
}
