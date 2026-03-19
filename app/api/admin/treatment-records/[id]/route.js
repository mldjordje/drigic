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
  productId: z.string().uuid().optional().nullable(),
  serviceId: z.string().uuid().optional().nullable(),
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

  const { treatmentDate, notes, correctionDueDate, productId, serviceId } = parsed.data;
  if (
    treatmentDate === undefined &&
    notes === undefined &&
    correctionDueDate === undefined &&
    productId === undefined &&
    serviceId === undefined
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

  if (productId) {
    const [product] = await db
      .select({ id: schema.treatmentProducts.id })
      .from(schema.treatmentProducts)
      .where(eq(schema.treatmentProducts.id, productId))
      .limit(1);
    if (!product) {
      return fail(400, "Preparat nije pronadjen.");
    }
  }

  let resolvedService = null;
  if (serviceId) {
    const [service] = await db
      .select({
        id: schema.services.id,
        reminderEnabled: schema.services.reminderEnabled,
        reminderDelayDays: schema.services.reminderDelayDays,
      })
      .from(schema.services)
      .where(eq(schema.services.id, serviceId))
      .limit(1);
    if (!service) {
      return fail(400, "Usluga nije pronadjena.");
    }
    resolvedService = service;
  }

  const nextTreatmentDate =
    treatmentDate !== undefined ? new Date(treatmentDate) : new Date(existing.treatmentDate);
  const nextCorrectionDueDate =
    serviceId === null
      ? correctionDueDate || null
      : resolvedService?.reminderEnabled
        ? new Date(
            Date.UTC(
              nextTreatmentDate.getUTCFullYear(),
              nextTreatmentDate.getUTCMonth(),
              nextTreatmentDate.getUTCDate() + Number(resolvedService.reminderDelayDays || 90)
            )
          )
            .toISOString()
            .slice(0, 10)
        : correctionDueDate !== undefined
          ? correctionDueDate || null
          : existing.correctionDueDate;

  const [updated] = await db
    .update(schema.treatmentRecords)
    .set({
      ...(treatmentDate !== undefined ? { treatmentDate: nextTreatmentDate } : {}),
      ...(notes !== undefined ? { notes: notes || null } : {}),
      ...(serviceId !== undefined ? { serviceId: serviceId || null } : {}),
      ...(correctionDueDate !== undefined || serviceId !== undefined || treatmentDate !== undefined
        ? { correctionDueDate: nextCorrectionDueDate }
        : {}),
      ...(productId !== undefined ? { productId: productId || null } : {}),
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
