import { and, eq } from "drizzle-orm";
import { created, fail, ok } from "@/lib/api/http";
import { requireUser } from "@/lib/auth/guards";
import { getDb, schema } from "@/lib/db/client";
import { uploadOptionalFile } from "@/lib/storage/upload";

export const runtime = "nodejs";

export async function POST(request, { params }) {
  const auth = await requireUser(request);
  if (auth.error) {
    return auth.error;
  }

  const { id } = params || {};
  if (!id) {
    return fail(400, "Missing record id.");
  }

  const db = getDb();

  // Verify the record belongs to the authenticated user
  const [record] = await db
    .select({ id: schema.treatmentRecords.id })
    .from(schema.treatmentRecords)
    .where(
      and(
        eq(schema.treatmentRecords.id, id),
        eq(schema.treatmentRecords.userId, auth.user.id)
      )
    )
    .limit(1);

  if (!record) {
    return fail(404, "Unos nije pronađen.");
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || typeof file === "string") {
    return fail(400, "Fajl nije priložen.");
  }

  const mediaUrl = await uploadOptionalFile(file, "beauty-pass-stickers");
  if (!mediaUrl) {
    return fail(500, "Upload slike nije uspeo.");
  }

  const [media] = await db
    .insert(schema.treatmentRecordMedia)
    .values({
      treatmentRecordId: id,
      mediaUrl,
      mediaType: "image",
    })
    .returning();

  return created({ ok: true, data: media });
}

export async function DELETE(request, { params }) {
  const auth = await requireUser(request);
  if (auth.error) {
    return auth.error;
  }

  const { id } = params || {};
  if (!id) {
    return fail(400, "Missing record id.");
  }

  const { searchParams } = new URL(request.url);
  const mediaId = searchParams.get("mediaId");
  if (!mediaId) {
    return fail(400, "Missing mediaId query param.");
  }

  const db = getDb();

  // Verify the treatment record belongs to this user
  const [record] = await db
    .select({ id: schema.treatmentRecords.id })
    .from(schema.treatmentRecords)
    .where(
      and(
        eq(schema.treatmentRecords.id, id),
        eq(schema.treatmentRecords.userId, auth.user.id)
      )
    )
    .limit(1);

  if (!record) {
    return fail(404, "Unos nije pronađen.");
  }

  const [existing] = await db
    .select({ id: schema.treatmentRecordMedia.id })
    .from(schema.treatmentRecordMedia)
    .where(
      and(
        eq(schema.treatmentRecordMedia.id, mediaId),
        eq(schema.treatmentRecordMedia.treatmentRecordId, id)
      )
    )
    .limit(1);

  if (!existing) {
    return fail(404, "Slika nije pronađena.");
  }

  await db
    .delete(schema.treatmentRecordMedia)
    .where(eq(schema.treatmentRecordMedia.id, mediaId));

  return ok({ ok: true, deletedId: mediaId });
}
