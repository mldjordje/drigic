import { asc, count, eq } from "drizzle-orm";
import { z } from "zod";
import { created, fail, ok, readJson } from "@/lib/api/http";
import { requireAdmin } from "@/lib/auth/guards";
import { revalidatePublicServicesCatalog } from "@/lib/cache/public-services";
import { getDb, schema } from "@/lib/db/client";

export const runtime = "nodejs";

const entityTypeSchema = z.enum(["category", "bodyArea"]);

const createMetadataSchema = z.object({
  entityType: entityTypeSchema,
  name: z.string().min(2).max(120),
  sortOrder: z.number().int().min(0).max(999).optional(),
  isActive: z.boolean().optional(),
});

const updateMetadataSchema = z.object({
  id: z.string().uuid(),
  entityType: entityTypeSchema,
  name: z.string().min(2).max(120).optional(),
  sortOrder: z.number().int().min(0).max(999).optional(),
  isActive: z.boolean().optional(),
});

function normalizeName(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

async function ensureUniqueName(db, entityType, name, currentId = null) {
  const normalizedName = normalizeName(name).toLowerCase();
  const rows =
    entityType === "category"
      ? await db
          .select({
            id: schema.serviceCategories.id,
            name: schema.serviceCategories.name,
          })
          .from(schema.serviceCategories)
      : await db
          .select({
            id: schema.bodyAreas.id,
            name: schema.bodyAreas.name,
          })
          .from(schema.bodyAreas);

  const hasConflict = rows.some(
    (row) => row.id !== currentId && normalizeName(row.name).toLowerCase() === normalizedName
  );

  if (hasConflict) {
    throw new Error(
      entityType === "category"
        ? "Kategorija sa tim nazivom vec postoji."
        : "Deo tela sa tim nazivom vec postoji."
    );
  }
}

async function getMetadataPayload(db, entityType, input, currentId = null) {
  const name = input.name !== undefined ? normalizeName(input.name) : undefined;

  if (name !== undefined && !name) {
    throw new Error("Naziv je obavezan.");
  }

  if (name) {
    await ensureUniqueName(db, entityType, name, currentId);
  }

  if (entityType === "category") {
    return {
      ...(name !== undefined ? { name } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: Number(input.sortOrder || 0) } : {}),
      ...(input.isActive !== undefined ? { isActive: Boolean(input.isActive) } : {}),
    };
  }

  return {
    ...(name !== undefined ? { name } : {}),
    ...(input.sortOrder !== undefined ? { sortOrder: Number(input.sortOrder || 0) } : {}),
  };
}

export async function GET(request) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return auth.error;
  }

  const db = getDb();
  const [categories, bodyAreas, services] = await Promise.all([
    db
      .select()
      .from(schema.serviceCategories)
      .orderBy(asc(schema.serviceCategories.sortOrder), asc(schema.serviceCategories.name)),
    db
      .select()
      .from(schema.bodyAreas)
      .orderBy(asc(schema.bodyAreas.sortOrder), asc(schema.bodyAreas.name)),
    db
      .select({
        id: schema.services.id,
        name: schema.services.name,
        slug: schema.services.slug,
        categoryId: schema.services.categoryId,
        bodyAreaId: schema.services.bodyAreaId,
        kind: schema.services.kind,
        isActive: schema.services.isActive,
      })
      .from(schema.services)
      .orderBy(asc(schema.services.name)),
  ]);

  const categoryCounts = new Map();
  const bodyAreaCounts = new Map();

  services.forEach((service) => {
    if (service.categoryId) {
      categoryCounts.set(service.categoryId, (categoryCounts.get(service.categoryId) || 0) + 1);
    }
    if (service.bodyAreaId) {
      bodyAreaCounts.set(service.bodyAreaId, (bodyAreaCounts.get(service.bodyAreaId) || 0) + 1);
    }
  });

  return ok({
    ok: true,
    categories: categories.map((item) => ({
      ...item,
      serviceCount: categoryCounts.get(item.id) || 0,
    })),
    bodyAreas: bodyAreas.map((item) => ({
      ...item,
      serviceCount: bodyAreaCounts.get(item.id) || 0,
    })),
    services,
  });
}

export async function POST(request) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return auth.error;
  }

  const body = await readJson(request);
  const parsed = createMetadataSchema.safeParse(body);
  if (!parsed.success) {
    return fail(400, "Invalid payload", parsed.error.flatten());
  }

  const db = getDb();

  try {
    const payload = await getMetadataPayload(db, parsed.data.entityType, parsed.data);

    if (parsed.data.entityType === "category") {
      const [record] = await db
        .insert(schema.serviceCategories)
        .values({
          name: payload.name,
          sortOrder: payload.sortOrder ?? 0,
          isActive: payload.isActive ?? true,
        })
        .returning();

      revalidatePublicServicesCatalog();
      return created({
        ok: true,
        data: { ...record, serviceCount: 0 },
      });
    }

    const [record] = await db
      .insert(schema.bodyAreas)
      .values({
        name: payload.name,
        sortOrder: payload.sortOrder ?? 0,
      })
      .returning();

    revalidatePublicServicesCatalog();
    return created({
      ok: true,
      data: { ...record, serviceCount: 0 },
    });
  } catch (error) {
    return fail(400, error.message || "Neuspesno cuvanje metadata.");
  }
}

export async function PATCH(request) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return auth.error;
  }

  const body = await readJson(request);
  const parsed = updateMetadataSchema.safeParse(body);
  if (!parsed.success) {
    return fail(400, "Invalid payload", parsed.error.flatten());
  }

  const db = getDb();

  try {
    const { id, entityType, ...input } = parsed.data;
    const payload = await getMetadataPayload(db, entityType, input, id);

    if (!Object.keys(payload).length) {
      return fail(400, "Nema izmena za cuvanje.");
    }

    if (entityType === "category") {
      const [record] = await db
        .update(schema.serviceCategories)
        .set({
          ...payload,
          updatedAt: new Date(),
        })
        .where(eq(schema.serviceCategories.id, id))
        .returning();

      if (!record) {
        return fail(404, "Kategorija nije pronadjena.");
      }

      const linkedServices = await db
        .select({ id: schema.services.id })
        .from(schema.services)
        .where(eq(schema.services.categoryId, id));

      revalidatePublicServicesCatalog();
      return ok({
        ok: true,
        data: { ...record, serviceCount: linkedServices.length },
      });
    }

    const [record] = await db
      .update(schema.bodyAreas)
      .set({
        ...payload,
        updatedAt: new Date(),
      })
      .where(eq(schema.bodyAreas.id, id))
      .returning();

    if (!record) {
      return fail(404, "Deo tela nije pronadjen.");
    }

    const linkedServices = await db
      .select({ id: schema.services.id })
      .from(schema.services)
      .where(eq(schema.services.bodyAreaId, id));

    revalidatePublicServicesCatalog();
    return ok({
      ok: true,
      data: { ...record, serviceCount: linkedServices.length },
    });
  } catch (error) {
    return fail(400, error.message || "Neuspesno azuriranje metadata.");
  }
}

export async function DELETE(request) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return auth.error;
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const entityType = url.searchParams.get("entityType");

  if (entityType !== "bodyArea" || !id) {
    return fail(400, "Query parametri: entityType=bodyArea i id su obavezni.");
  }

  const db = getDb();

  const [existing] = await db
    .select({ id: schema.bodyAreas.id })
    .from(schema.bodyAreas)
    .where(eq(schema.bodyAreas.id, id))
    .limit(1);

  if (!existing) {
    return fail(404, "Deo tela nije pronadjen.");
  }

  const [usageRow] = await db
    .select({ n: count() })
    .from(schema.services)
    .where(eq(schema.services.bodyAreaId, id));

  if (Number(usageRow?.n || 0) > 0) {
    return fail(
      409,
      "Ne mozete obrisati deo tela dok postoje usluge koje su na njega vezane. Prvo uklonite mapiranje na uslugama."
    );
  }

  await db.delete(schema.bodyAreas).where(eq(schema.bodyAreas.id, id));
  revalidatePublicServicesCatalog();

  return ok({ ok: true });
}
