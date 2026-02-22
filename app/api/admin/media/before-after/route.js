import { created, fail } from "@/lib/api/http";
import { requireAdmin } from "@/lib/auth/guards";
import { getDb, schema } from "@/lib/db/client";
import { uploadOptionalFile } from "@/lib/storage/upload";

export const runtime = "nodejs";

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

  const beforeUploadedUrl = await uploadOptionalFile(beforeFile, "before-after");
  const afterUploadedUrl = await uploadOptionalFile(afterFile, "before-after");

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
