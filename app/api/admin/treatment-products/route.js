import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { created, fail, ok, readJson } from "@/lib/api/http";
import { requireAdmin } from "@/lib/auth/guards";
import { getDb, schema } from "@/lib/db/client";
import { uploadOptionalFile } from "@/lib/storage/upload";

export const runtime = "nodejs";

const createSchema = z.object({
  name: z.string().min(2).max(120),
  logoUrl: z.string().url(),
  sortOrder: z.coerce.number().int().min(0).max(9999).optional(),
  isActive: z.boolean().optional(),
});

const updateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(120).optional(),
  logoUrl: z.string().url().optional(),
  sortOrder: z.coerce.number().int().min(0).max(9999).optional(),
  isActive: z.boolean().optional(),
});

function isMultipartRequest(request) {
  const contentType = String(request.headers.get("content-type") || "").toLowerCase();
  return contentType.includes("multipart/form-data");
}

function toOptionalString(value) {
  if (value === undefined || value === null) {
    return undefined;
  }
  const normalized = String(value).trim();
  return normalized ? normalized : undefined;
}

function toOptionalNumber(value) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return undefined;
  }
  return numeric;
}

function toOptionalBoolean(value) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  if (typeof value === "boolean") {
    return value;
  }
  const normalized = String(value).toLowerCase().trim();
  if (normalized === "true" || normalized === "1" || normalized === "on") {
    return true;
  }
  if (normalized === "false" || normalized === "0" || normalized === "off") {
    return false;
  }
  return undefined;
}

async function parseCreatePayload(request) {
  if (!isMultipartRequest(request)) {
    return readJson(request);
  }

  const formData = await request.formData();
  const uploadedLogoUrl = await uploadOptionalFile(formData.get("logoFile"), "treatment-products");

  return {
    name: toOptionalString(formData.get("name")) || "",
    logoUrl: uploadedLogoUrl || toOptionalString(formData.get("logoUrl")) || "",
    sortOrder: toOptionalNumber(formData.get("sortOrder")) ?? 0,
    isActive: toOptionalBoolean(formData.get("isActive")) ?? true,
  };
}

async function parseUpdatePayload(request) {
  if (!isMultipartRequest(request)) {
    return readJson(request);
  }

  const formData = await request.formData();
  const uploadedLogoUrl = await uploadOptionalFile(formData.get("logoFile"), "treatment-products");

  return {
    id: toOptionalString(formData.get("id")) || "",
    name: toOptionalString(formData.get("name")),
    logoUrl: uploadedLogoUrl || toOptionalString(formData.get("logoUrl")),
    sortOrder: toOptionalNumber(formData.get("sortOrder")),
    isActive: toOptionalBoolean(formData.get("isActive")),
  };
}

export async function GET(request) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return auth.error;
  }

  const db = getDb();
  const data = await db
    .select()
    .from(schema.treatmentProducts)
    .orderBy(asc(schema.treatmentProducts.sortOrder), asc(schema.treatmentProducts.name));

  return ok({ ok: true, data });
}

export async function POST(request) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return auth.error;
  }

  const body = await parseCreatePayload(request);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return fail(400, "Invalid payload", parsed.error.flatten());
  }

  const db = getDb();

  try {
    const [row] = await db
      .insert(schema.treatmentProducts)
      .values({
        name: parsed.data.name.trim(),
        logoUrl: parsed.data.logoUrl.trim(),
        sortOrder: Number(parsed.data.sortOrder || 0),
        isActive: parsed.data.isActive ?? true,
      })
      .returning();

    return created({ ok: true, data: row });
  } catch (error) {
    const pgCode = String(error?.code || error?.cause?.code || "");
    if (pgCode === "23505") {
      return fail(409, "Preparat sa ovim nazivom vec postoji.");
    }
    throw error;
  }
}

export async function PATCH(request) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return auth.error;
  }

  const body = await parseUpdatePayload(request);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return fail(400, "Invalid payload", parsed.error.flatten());
  }

  const payload = parsed.data;
  const updates = { updatedAt: new Date() };

  if (payload.name !== undefined) {
    updates.name = payload.name.trim();
  }
  if (payload.logoUrl !== undefined) {
    updates.logoUrl = payload.logoUrl.trim();
  }
  if (payload.sortOrder !== undefined) {
    updates.sortOrder = Number(payload.sortOrder);
  }
  if (payload.isActive !== undefined) {
    updates.isActive = Boolean(payload.isActive);
  }

  if (Object.keys(updates).length === 1) {
    return fail(400, "No update fields provided.");
  }

  const db = getDb();
  const [existing] = await db
    .select({ id: schema.treatmentProducts.id })
    .from(schema.treatmentProducts)
    .where(eq(schema.treatmentProducts.id, payload.id))
    .limit(1);
  if (!existing) {
    return fail(404, "Preparat nije pronadjen.");
  }

  try {
    const [updated] = await db
      .update(schema.treatmentProducts)
      .set(updates)
      .where(eq(schema.treatmentProducts.id, payload.id))
      .returning();

    return ok({ ok: true, data: updated });
  } catch (error) {
    const pgCode = String(error?.code || error?.cause?.code || "");
    if (pgCode === "23505") {
      return fail(409, "Preparat sa ovim nazivom vec postoji.");
    }
    throw error;
  }
}
