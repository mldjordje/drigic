import { eq } from "drizzle-orm";
import { created, fail, ok } from "@/lib/api/http";
import { requireAdmin } from "@/lib/auth/guards";
import { getDb, schema } from "@/lib/db/client";
import { uploadOptionalFile } from "@/lib/storage/upload";

export const runtime = "nodejs";

export async function POST(request, { params }) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return auth.error;
  }

  const { id } = params || {};
  if (!id) {
    return fail(400, "Missing treatment record id.");
  }

  const db = getDb();
  const [record] = await db
    .select({ id: schema.treatmentRecords.id })
    .from(schema.treatmentRecords)
    .where(eq(schema.treatmentRecords.id, id))
    .limit(1);
  if (!record) {
    return fail(404, "Treatment record not found.");
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const mediaTypeRaw = String(formData.get("mediaType") || "").trim();
  const mediaType = mediaTypeRaw || "image";
  const mediaUrlInput = String(formData.get("mediaUrl") || "").trim();

  let mediaUrl = mediaUrlInput || null;
  if (!mediaUrl && file && typeof file !== "string") {
    mediaUrl = await uploadOptionalFile(file, "treatment-records");
  }

  if (!mediaUrl) {
    return fail(400, "Provide media file or mediaUrl.");
  }

  const [createdMedia] = await db
    .insert(schema.treatmentRecordMedia)
    .values({
      treatmentRecordId: id,
      mediaUrl,
      mediaType,
    })
    .returning();

  return created({ ok: true, data: createdMedia });
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

  const { searchParams } = new URL(request.url);
  const mediaId = searchParams.get("mediaId");
  if (!mediaId) {
    return fail(400, "Missing mediaId query param.");
  }

  const db = getDb();
  const [existing] = await db
    .select({ id: schema.treatmentRecordMedia.id })
    .from(schema.treatmentRecordMedia)
    .where(eq(schema.treatmentRecordMedia.id, mediaId))
    .limit(1);

  if (!existing) {
    return fail(404, "Media item not found.");
  }

  await db.delete(schema.treatmentRecordMedia).where(eq(schema.treatmentRecordMedia.id, mediaId));
  return ok({ ok: true, deletedId: mediaId, treatmentRecordId: id });
}
