import { eq } from "drizzle-orm";
import { z } from "zod";
import { fail, ok, readJson } from "@/lib/api/http";
import { requireAdmin } from "@/lib/auth/guards";
import { getDb, schema } from "@/lib/db/client";

export const runtime = "nodejs";

const updateSchema = z.object({
  treatmentDate: z.string().datetime().optional(),
  notes: z.string().max(3000).optional().nullable(),
  correctionDueDate: z.string().optional().nullable(),
});

export async function PATCH(request, { params }) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return auth.error;
  }

  const { id } = params || {};
  if (!id) {
    return fail(400, "Missing treatment record id.");
  }

  const body = await readJson(request);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return fail(400, "Invalid payload", parsed.error.flatten());
  }

  const { treatmentDate, notes, correctionDueDate } = parsed.data;
  if (
    treatmentDate === undefined &&
    notes === undefined &&
    correctionDueDate === undefined
  ) {
    return fail(400, "No update fields provided.");
  }

  const db = getDb();
  const [existing] = await db
    .select()
    .from(schema.treatmentRecords)
    .where(eq(schema.treatmentRecords.id, id))
    .limit(1);
  if (!existing) {
    return fail(404, "Treatment record not found.");
  }

  const [updated] = await db
    .update(schema.treatmentRecords)
    .set({
      ...(treatmentDate !== undefined ? { treatmentDate: new Date(treatmentDate) } : {}),
      ...(notes !== undefined ? { notes: notes || null } : {}),
      ...(correctionDueDate !== undefined
        ? { correctionDueDate: correctionDueDate || null }
        : {}),
      updatedAt: new Date(),
    })
    .where(eq(schema.treatmentRecords.id, id))
    .returning();

  return ok({ ok: true, data: updated });
}

export async function DELETE(request, { params }) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return auth.error;
  }

  const { id } = params || {};
  if (!id) {
    return fail(400, "Missing treatment record id.");
  }

  const db = getDb();
  const [existing] = await db
    .select({ id: schema.treatmentRecords.id })
    .from(schema.treatmentRecords)
    .where(eq(schema.treatmentRecords.id, id))
    .limit(1);

  if (!existing) {
    return fail(404, "Treatment record not found.");
  }

  await db.delete(schema.treatmentRecords).where(eq(schema.treatmentRecords.id, id));
  return ok({ ok: true, deletedId: id });
}
