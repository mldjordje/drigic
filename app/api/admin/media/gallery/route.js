import { created, fail } from "@/lib/api/http";
import { requireAdmin } from "@/lib/auth/guards";
import { getDb, schema } from "@/lib/db/client";
import { uploadOptionalFile } from "@/lib/storage/upload";

export const runtime = "nodejs";

export async function POST(request) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return auth.error;
  }

  const formData = await request.formData();
  const caption = String(formData.get("caption") || "").trim();
  const mediaType = String(formData.get("mediaType") || "image").trim();
  const mediaUrlInput = String(formData.get("mediaUrl") || "").trim();
  const mediaFile = formData.get("file");

  const uploadedUrl = await uploadOptionalFile(mediaFile, "gallery");
  const mediaUrl = uploadedUrl || mediaUrlInput;

  if (!mediaUrl) {
    return fail(400, "Gallery media requires uploaded file or mediaUrl.");
  }

  const db = getDb();
  const [record] = await db
    .insert(schema.galleryMedia)
    .values({
      mediaUrl,
      mediaType,
      caption: caption || null,
    })
    .returning();

  return created({ ok: true, data: record });
}

