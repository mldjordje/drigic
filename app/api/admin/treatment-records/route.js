import { eq } from "drizzle-orm";
import { z } from "zod";
import { created, fail, readJson } from "@/lib/api/http";
import { requireAdmin } from "@/lib/auth/guards";
import { getDb, schema } from "@/lib/db/client";
import { getDefaultEmployee } from "@/lib/booking/config";

export const runtime = "nodejs";

const payloadSchema = z.object({
  userId: z.string().uuid(),
  bookingId: z.string().uuid().optional().nullable(),
  productId: z.string().uuid().optional().nullable(),
  treatmentDate: z.string().datetime().optional(),
  notes: z.string().max(3000).optional(),
  correctionDueDate: z.string().optional(),
  media: z
    .array(
      z.object({
        mediaUrl: z.string().url(),
        mediaType: z.string().optional(),
      })
    )
    .optional(),
});

export async function POST(request) {
  const auth = await requireAdmin(request);
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
  const now = new Date();
  if (parsed.data.productId) {
    const [product] = await db
      .select({ id: schema.treatmentProducts.id })
      .from(schema.treatmentProducts)
      .where(eq(schema.treatmentProducts.id, parsed.data.productId))
      .limit(1);
    if (!product) {
      return fail(400, "Preparat nije pronadjen.");
    }
  }

  const [record] = await db
    .insert(schema.treatmentRecords)
    .values({
      userId: parsed.data.userId,
      bookingId: parsed.data.bookingId || null,
      productId: parsed.data.productId || null,
      employeeId: employee.id,
      treatmentDate: parsed.data.treatmentDate ? new Date(parsed.data.treatmentDate) : now,
      notes: parsed.data.notes || null,
      correctionDueDate: parsed.data.correctionDueDate || null,
    })
    .returning();

  if (parsed.data.media?.length) {
    await db.insert(schema.treatmentRecordMedia).values(
      parsed.data.media.map((item) => ({
        treatmentRecordId: record.id,
        mediaUrl: item.mediaUrl,
        mediaType: item.mediaType || "image",
      }))
    );
  }

  return created({ ok: true, data: record });
}
