import { eq } from "drizzle-orm";
import { z } from "zod";
import { created, fail, ok } from "@/lib/api/http";
import { requireAdmin } from "@/lib/auth/guards";
import { getDb, schema } from "@/lib/db/client";
import { uploadOptionalFile } from "@/lib/storage/upload";

export const runtime = "nodejs";

const deleteSchema = z.object({
  id: z.string().uuid(),
});

const updateSchema = z.object({
  id: z.string().uuid(),
  treatmentType: z.string().min(1).max(255).optional(),
  serviceCategory: z.string().max(120).optional(),
  productUsed: z.string().max(255).optional(),
  beforeImageUrl: z.string().min(1).optional(),
  afterImageUrl: z.string().min(1).optional(),
  isPublished: z.boolean().optional(),
});

function isMissingServiceCategoryColumn(error) {
  const message = String(error?.message || error?.cause?.message || "").toLowerCase();
  return (
    message.includes("service_category") &&
    (message.includes("does not exist") || message.includes("column"))
  );
}

export async function POST(request) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return auth.error;
  }

  const formData = await request.formData();
  const treatmentType = String(formData.get("treatmentType") || "").trim();
  const serviceCategory = String(formData.get("serviceCategory") || "").trim();
  const productUsed = String(formData.get("productUsed") || "").trim();
  const beforeUrlInput = String(formData.get("beforeImageUrl") || "").trim();
  const afterUrlInput = String(formData.get("afterImageUrl") || "").trim();

  if (!treatmentType) {
    return fail(400, "treatmentType is required.");
  }

  const beforeFile = formData.get("beforeImage");
  const afterFile = formData.get("afterImage");

  let beforeUploadedUrl;
  let afterUploadedUrl;
  try {
    beforeUploadedUrl = await uploadOptionalFile(beforeFile, "before-after");
    afterUploadedUrl = await uploadOptionalFile(afterFile, "before-after");
  } catch (error) {
    return fail(400, String(error?.message || "Upload nije uspeo."));
  }

  const beforeImageUrl = beforeUploadedUrl || beforeUrlInput;
  const afterImageUrl = afterUploadedUrl || afterUrlInput;

  if (!beforeImageUrl || !afterImageUrl) {
    return fail(
      400,
      "Exactly two images are required: provide beforeImage and afterImage files or URLs."
    );
  }

  const db = getDb();
  let record;
  try {
    [record] = await db
      .insert(schema.beforeAfterCases)
      .values({
        treatmentType,
        serviceCategory: serviceCategory || null,
        productUsed: productUsed || null,
        beforeImageUrl,
        afterImageUrl,
        isPublished: true,
      })
      .returning();
  } catch (error) {
    if (!isMissingServiceCategoryColumn(error)) {
      throw error;
    }

    [record] = await db
      .insert(schema.beforeAfterCases)
      .values({
        treatmentType,
        productUsed: productUsed || null,
        beforeImageUrl,
        afterImageUrl,
        isPublished: true,
      })
      .returning();

    record = { ...record, serviceCategory: null };
  }

  return created({ ok: true, data: record });
}

export async function PATCH(request) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return auth.error;
  }

  const formData = await request.formData();
  const id = String(formData.get("id") || "").trim();
  const treatmentType = String(formData.get("treatmentType") || "").trim();
  const serviceCategory = String(formData.get("serviceCategory") || "").trim();
  const productUsed = String(formData.get("productUsed") || "").trim();
  const beforeUrlInput = String(formData.get("beforeImageUrl") || "").trim();
  const afterUrlInput = String(formData.get("afterImageUrl") || "").trim();

  const parsed = updateSchema.safeParse({
    id,
    ...(treatmentType ? { treatmentType } : {}),
    ...(serviceCategory ? { serviceCategory } : {}),
    ...(productUsed ? { productUsed } : {}),
    ...(beforeUrlInput ? { beforeImageUrl: beforeUrlInput } : {}),
    ...(afterUrlInput ? { afterImageUrl: afterUrlInput } : {}),
    ...(formData.get("isPublished") !== null
      ? { isPublished: String(formData.get("isPublished")) === "true" }
      : {}),
  });

  if (!parsed.success) {
    return fail(400, "Invalid payload", parsed.error.flatten());
  }

  const beforeFile = formData.get("beforeImage");
  const afterFile = formData.get("afterImage");

  let beforeUploadedUrl;
  let afterUploadedUrl;
  try {
    beforeUploadedUrl = await uploadOptionalFile(beforeFile, "before-after");
    afterUploadedUrl = await uploadOptionalFile(afterFile, "before-after");
  } catch (error) {
    return fail(400, String(error?.message || "Upload nije uspeo."));
  }

  const db = getDb();
  const [existing] = await db
    .select({
      id: schema.beforeAfterCases.id,
      beforeImageUrl: schema.beforeAfterCases.beforeImageUrl,
      afterImageUrl: schema.beforeAfterCases.afterImageUrl,
    })
    .from(schema.beforeAfterCases)
    .where(eq(schema.beforeAfterCases.id, parsed.data.id))
    .limit(1);

  if (!existing) {
    return fail(404, "Pre/posle unos nije pronadjen.");
  }

  const updates = {
    updatedAt: new Date(),
    ...(parsed.data.treatmentType !== undefined
      ? { treatmentType: parsed.data.treatmentType }
      : {}),
    ...(parsed.data.productUsed !== undefined ? { productUsed: parsed.data.productUsed } : {}),
    ...(parsed.data.isPublished !== undefined ? { isPublished: parsed.data.isPublished } : {}),
    beforeImageUrl:
      beforeUploadedUrl || parsed.data.beforeImageUrl || existing.beforeImageUrl,
    afterImageUrl: afterUploadedUrl || parsed.data.afterImageUrl || existing.afterImageUrl,
  };

  if (parsed.data.serviceCategory !== undefined) {
    updates.serviceCategory = parsed.data.serviceCategory || null;
  }

  let record;
  try {
    [record] = await db
      .update(schema.beforeAfterCases)
      .set(updates)
      .where(eq(schema.beforeAfterCases.id, parsed.data.id))
      .returning();
  } catch (error) {
    if (!isMissingServiceCategoryColumn(error)) {
      throw error;
    }

    const fallbackUpdates = { ...updates };
    delete fallbackUpdates.serviceCategory;

    [record] = await db
      .update(schema.beforeAfterCases)
      .set(fallbackUpdates)
      .where(eq(schema.beforeAfterCases.id, parsed.data.id))
      .returning();

    record = { ...record, serviceCategory: null };
  }

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
    .delete(schema.beforeAfterCases)
    .where(eq(schema.beforeAfterCases.id, parsed.data.id))
    .returning({ id: schema.beforeAfterCases.id });

  if (!deleted.length) {
    return fail(404, "Pre/posle unos nije pronadjen.");
  }

  return ok({ ok: true });
}
