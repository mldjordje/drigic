import { eq } from "drizzle-orm";
import { created, fail } from "@/lib/api/http";
import { requireUser } from "@/lib/auth/guards";
import { getDb, schema } from "@/lib/db/client";
import { getDefaultEmployee } from "@/lib/booking/config";
import { uploadOptionalFile } from "@/lib/storage/upload";

export const runtime = "nodejs";

export async function POST(request) {
  const auth = await requireUser(request);
  if (auth.error) {
    return auth.error;
  }

  const formData = await request.formData();

  const treatmentDate = String(formData.get("treatmentDate") || "").trim();
  const notes = String(formData.get("notes") || "").trim() || null;
  const productIdRaw = String(formData.get("productId") || "").trim();
  const productId = productIdRaw && productIdRaw !== "null" ? productIdRaw : null;
  const file = formData.get("file");
  const imageFile = file && typeof file !== "string" ? file : null;

  if (!treatmentDate || treatmentDate.length !== 10) {
    return fail(400, "Datum tretmana je obavezan (YYYY-MM-DD).");
  }

  const recordDate = new Date(`${treatmentDate}T12:00:00+01:00`);
  if (Number.isNaN(recordDate.getTime())) {
    return fail(400, "Nevažeći datum.");
  }

  const db = getDb();

  if (productId) {
    const [product] = await db
      .select({ id: schema.treatmentProducts.id, isActive: schema.treatmentProducts.isActive })
      .from(schema.treatmentProducts)
      .where(eq(schema.treatmentProducts.id, productId))
      .limit(1);

    if (!product || !product.isActive) {
      return fail(400, "Izabrani preparat nije dostupan.");
    }
  }

  const employee = await getDefaultEmployee();

  const [record] = await db
    .insert(schema.treatmentRecords)
    .values({
      userId: auth.user.id,
      bookingId: null,
      productId: productId || null,
      employeeId: employee.id,
      treatmentDate: recordDate,
      notes: notes,
    })
    .returning();

  // Upload sticker image if provided
  if (imageFile) {
    const mediaUrl = await uploadOptionalFile(imageFile, "beauty-pass-stickers");
    if (mediaUrl) {
      await db.insert(schema.treatmentRecordMedia).values({
        treatmentRecordId: record.id,
        mediaUrl,
        mediaType: "image",
      });
    }
  }

  return created({ ok: true, data: record });
}
