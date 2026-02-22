import { eq } from "drizzle-orm";
import { z } from "zod";
import { created, fail, ok } from "@/lib/api/http";
import { requireAdmin } from "@/lib/auth/guards";
import { getDb, schema } from "@/lib/db/client";
import { uploadOptionalFile } from "@/lib/storage/upload";

export const runtime = "nodejs";

const createSchema = z.object({
  caption: z.string().max(300).optional(),
  mediaType: z.enum(["image", "video"]).default("image"),
  mediaUrl: z.string().optional(),
});

const updateSchema = z.object({
  id: z.string().uuid(),
  caption: z.string().max(300).optional(),
  mediaType: z.enum(["image", "video"]).optional(),
  mediaUrl: z.string().optional(),
});

const deleteSchema = z.object({
  id: z.string().uuid(),
});

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

  const parsed = createSchema.safeParse({
    caption: caption || undefined,
    mediaType,
    mediaUrl: mediaUrlInput || undefined,
  });
  if (!parsed.success) {
    return fail(400, "Invalid payload", parsed.error.flatten());
  }

  let uploadedUrl;
  try {
    uploadedUrl = await uploadOptionalFile(mediaFile, "gallery");
  } catch (error) {
    return fail(400, String(error?.message || "Upload nije uspeo."));
  }

  const mediaUrl = uploadedUrl || mediaUrlInput;

  if (!mediaUrl) {
    return fail(400, "Gallery media requires uploaded file or mediaUrl.");
  }

  const db = getDb();
  const [record] = await db
    .insert(schema.galleryMedia)
    .values({
      mediaUrl,
      mediaType: parsed.data.mediaType,
      caption: parsed.data.caption || null,
    })
    .returning();

  return created({ ok: true, data: record });
}

export async function PATCH(request) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return auth.error;
  }

  const formData = await request.formData();
  const id = String(formData.get("id") || "").trim();
  const caption = String(formData.get("caption") || "").trim();
  const mediaType = String(formData.get("mediaType") || "").trim();
  const mediaUrlInput = String(formData.get("mediaUrl") || "").trim();
  const mediaFile = formData.get("file");

  const parsed = updateSchema.safeParse({
    id,
    ...(caption ? { caption } : {}),
    ...(mediaType ? { mediaType } : {}),
    ...(mediaUrlInput ? { mediaUrl: mediaUrlInput } : {}),
  });
  if (!parsed.success) {
    return fail(400, "Invalid payload", parsed.error.flatten());
  }

  const db = getDb();
  const [existing] = await db
    .select({
      id: schema.galleryMedia.id,
      mediaUrl: schema.galleryMedia.mediaUrl,
    })
    .from(schema.galleryMedia)
    .where(eq(schema.galleryMedia.id, parsed.data.id))
    .limit(1);

  if (!existing) {
    return fail(404, "Galerija unos nije pronadjen.");
  }

  let uploadedUrl;
  try {
    uploadedUrl = await uploadOptionalFile(mediaFile, "gallery");
  } catch (error) {
    return fail(400, String(error?.message || "Upload nije uspeo."));
  }

  const updates = {
    updatedAt: new Date(),
    ...(parsed.data.caption !== undefined ? { caption: parsed.data.caption || null } : {}),
    ...(parsed.data.mediaType !== undefined ? { mediaType: parsed.data.mediaType } : {}),
    mediaUrl: uploadedUrl || parsed.data.mediaUrl || existing.mediaUrl,
  };

  const [record] = await db
    .update(schema.galleryMedia)
    .set(updates)
    .where(eq(schema.galleryMedia.id, parsed.data.id))
    .returning();

  return ok({ ok: true, data: record });
}

export async function DELETE(request) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return auth.error;
  }

  const body = await request.json().catch(() => null);
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return fail(400, "Invalid payload", parsed.error.flatten());
  }

  const db = getDb();
  const deleted = await db
    .delete(schema.galleryMedia)
    .where(eq(schema.galleryMedia.id, parsed.data.id))
    .returning({ id: schema.galleryMedia.id });

  if (!deleted.length) {
    return fail(404, "Galerija unos nije pronadjen.");
  }

  return ok({ ok: true });
}
