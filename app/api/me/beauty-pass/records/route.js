import { z } from "zod";
import { eq } from "drizzle-orm";
import { created, fail, readJson } from "@/lib/api/http";
import { requireUser } from "@/lib/auth/guards";
import { getDb, schema } from "@/lib/db/client";
import { getDefaultEmployee } from "@/lib/booking/config";

export const runtime = "nodejs";

const payloadSchema = z.object({
  treatmentDate: z.string().min(10).max(10),
  notes: z.string().min(3).max(2000),
  productId: z.string().uuid().nullable().optional(),
});

export async function POST(request) {
  const auth = await requireUser(request);
  if (auth.error) {
    return auth.error;
  }

  const body = await readJson(request);
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return fail(400, "Invalid payload", parsed.error.flatten());
  }

  const db = getDb();
  const employee = await getDefaultEmployee();
  const recordDate = new Date(`${parsed.data.treatmentDate}T12:00:00+01:00`);

  if (Number.isNaN(recordDate.getTime())) {
    return fail(400, "Invalid date.");
  }

  if (parsed.data.productId) {
    const [product] = await db
      .select({ id: schema.treatmentProducts.id, isActive: schema.treatmentProducts.isActive })
      .from(schema.treatmentProducts)
      .where(eq(schema.treatmentProducts.id, parsed.data.productId))
      .limit(1);

    if (!product || !product.isActive) {
      return fail(400, "Izabrani preparat nije dostupan.");
    }
  }

  const [record] = await db
    .insert(schema.treatmentRecords)
    .values({
      userId: auth.user.id,
      bookingId: null,
      productId: parsed.data.productId || null,
      employeeId: employee.id,
      treatmentDate: recordDate,
      notes: parsed.data.notes,
    })
    .returning();

  return created({ ok: true, data: record });
}
