import { eq } from "drizzle-orm";
import { z } from "zod";
import { created, fail, ok } from "@/lib/api/http";
import { requireAdmin } from "@/lib/auth/guards";
import { getDb, schema } from "@/lib/db/client";
import { uploadOptionalFile } from "@/lib/storage/upload";

export const runtime = "nodejs";

const OPTIONAL_COLUMN_KEY_MAP = {
  service_category: "serviceCategory",
  collage_image_url: "collageImageUrl",
};

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
  collageImageUrl: z.string().min(1).optional(),
  isPublished: z.boolean().optional(),
});

function getMissingOptionalColumnKey(error) {
  const message = String(error?.message || error?.cause?.message || "").toLowerCase();
  if (!message.includes("does not exist") && !message.includes("column")) {
    return null;
  }

  const missingEntry = Object.entries(OPTIONAL_COLUMN_KEY_MAP).find(([columnName]) =>
    message.includes(columnName)
  );
  return missingEntry ? missingEntry[1] : null;
}

function removeMissingColumnFromPayload(payload, error) {
  const missingKey = getMissingOptionalColumnKey(error);
  if (!missingKey || !Object.prototype.hasOwnProperty.call(payload, missingKey)) {
    return false;
  }
  delete payload[missingKey];
  return true;
}

async function insertBeforeAfterWithFallback(db, values) {
  const payload = { ...values };

  for (;;) {
    try {
      const [record] = await db.insert(schema.beforeAfterCases).values(payload).returning();

      return {
        record: {
          ...record,
          ...(Object.prototype.hasOwnProperty.call(payload, "serviceCategory")
            ? {}
            : { serviceCategory: null }),
          ...(Object.prototype.hasOwnProperty.call(payload, "collageImageUrl")
            ? {}
            : { collageImageUrl: null }),
        },
      };
    } catch (error) {
      if (!removeMissingColumnFromPayload(payload, error)) {
        throw error;
      }
    }
  }
}

async function updateBeforeAfterWithFallback(db, id, values) {
  const payload = { ...values };

  for (;;) {
    try {
      const [record] = await db
        .update(schema.beforeAfterCases)
        .set(payload)
        .where(eq(schema.beforeAfterCases.id, id))
        .returning();

      return {
        record: {
          ...record,
          ...(Object.prototype.hasOwnProperty.call(payload, "serviceCategory")
            ? {}
            : { serviceCategory: null }),
          ...(Object.prototype.hasOwnProperty.call(payload, "collageImageUrl")
            ? {}
            : { collageImageUrl: null }),
        },
      };
    } catch (error) {
      if (!removeMissingColumnFromPayload(payload, error)) {
        throw error;
      }
    }
  }
}

async function getExistingBeforeAfterCase(db, id) {
  try {
    const [row] = await db
      .select({
        id: schema.beforeAfterCases.id,
        beforeImageUrl: schema.beforeAfterCases.beforeImageUrl,
        afterImageUrl: schema.beforeAfterCases.afterImageUrl,
        collageImageUrl: schema.beforeAfterCases.collageImageUrl,
      })
      .from(schema.beforeAfterCases)
      .where(eq(schema.beforeAfterCases.id, id))
      .limit(1);

    return row || null;
  } catch (error) {
    if (!getMissingOptionalColumnKey(error)) {
      throw error;
    }

    const [fallbackRow] = await db
      .select({
        id: schema.beforeAfterCases.id,
        beforeImageUrl: schema.beforeAfterCases.beforeImageUrl,
        afterImageUrl: schema.beforeAfterCases.afterImageUrl,
      })
      .from(schema.beforeAfterCases)
      .where(eq(schema.beforeAfterCases.id, id))
      .limit(1);

    return fallbackRow ? { ...fallbackRow, collageImageUrl: null } : null;
  }
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
  const collageUrlInput = String(formData.get("collageImageUrl") || "").trim();
  const isPublished =
    formData.get("isPublished") === null
      ? true
      : String(formData.get("isPublished")) === "true";

  if (!treatmentType) {
    return fail(400, "treatmentType is required.");
  }

  const beforeFile = formData.get("beforeImage");
  const afterFile = formData.get("afterImage");
  const collageFile = formData.get("collageImage");

  let beforeUploadedUrl;
  let afterUploadedUrl;
  let collageUploadedUrl;
  try {
    beforeUploadedUrl = await uploadOptionalFile(beforeFile, "before-after");
    afterUploadedUrl = await uploadOptionalFile(afterFile, "before-after");
    collageUploadedUrl = await uploadOptionalFile(collageFile, "before-after");
  } catch (error) {
    return fail(400, String(error?.message || "Upload nije uspeo."));
  }

  const collageImageUrl = collageUploadedUrl || collageUrlInput || null;
  const beforeImageUrl = beforeUploadedUrl || beforeUrlInput || collageImageUrl;
  const afterImageUrl = afterUploadedUrl || afterUrlInput || collageImageUrl;

  if (!beforeImageUrl || !afterImageUrl) {
    return fail(
      400,
      "Potrebne su slike pre/posle ili jedna kolaz slika."
    );
  }

  const db = getDb();
  const { record } = await insertBeforeAfterWithFallback(db, {
    treatmentType,
    serviceCategory: serviceCategory || null,
    productUsed: productUsed || null,
    beforeImageUrl,
    afterImageUrl,
    collageImageUrl,
    isPublished,
  });

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
  const collageUrlInput = String(formData.get("collageImageUrl") || "").trim();

  const parsed = updateSchema.safeParse({
    id,
    ...(treatmentType ? { treatmentType } : {}),
    ...(serviceCategory ? { serviceCategory } : {}),
    ...(productUsed ? { productUsed } : {}),
    ...(beforeUrlInput ? { beforeImageUrl: beforeUrlInput } : {}),
    ...(afterUrlInput ? { afterImageUrl: afterUrlInput } : {}),
    ...(collageUrlInput ? { collageImageUrl: collageUrlInput } : {}),
    ...(formData.get("isPublished") !== null
      ? { isPublished: String(formData.get("isPublished")) === "true" }
      : {}),
  });

  if (!parsed.success) {
    return fail(400, "Invalid payload", parsed.error.flatten());
  }

  const beforeFile = formData.get("beforeImage");
  const afterFile = formData.get("afterImage");
  const collageFile = formData.get("collageImage");

  let beforeUploadedUrl;
  let afterUploadedUrl;
  let collageUploadedUrl;
  try {
    beforeUploadedUrl = await uploadOptionalFile(beforeFile, "before-after");
    afterUploadedUrl = await uploadOptionalFile(afterFile, "before-after");
    collageUploadedUrl = await uploadOptionalFile(collageFile, "before-after");
  } catch (error) {
    return fail(400, String(error?.message || "Upload nije uspeo."));
  }

  const db = getDb();
  const existing = await getExistingBeforeAfterCase(db, parsed.data.id);
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
    beforeImageUrl: beforeUploadedUrl || parsed.data.beforeImageUrl || existing.beforeImageUrl,
    afterImageUrl: afterUploadedUrl || parsed.data.afterImageUrl || existing.afterImageUrl,
    collageImageUrl:
      collageUploadedUrl || parsed.data.collageImageUrl || existing.collageImageUrl || null,
  };

  if (parsed.data.serviceCategory !== undefined) {
    updates.serviceCategory = parsed.data.serviceCategory || null;
  }

  const { record } = await updateBeforeAfterWithFallback(db, parsed.data.id, updates);
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
