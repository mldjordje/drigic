import { and, asc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { created, fail, ok, readJson } from "@/lib/api/http";
import { requireAdmin } from "@/lib/auth/guards";
import { getDb, schema } from "@/lib/db/client";

export const runtime = "nodejs";

const packageItemSchema = z.object({
  serviceId: z.string().uuid(),
  quantity: z.number().int().min(1).max(20).optional(),
  sortOrder: z.number().int().min(0).max(999).optional(),
});

const baseSchema = z.object({
  categoryId: z.string().uuid(),
  bodyAreaId: z.string().uuid().nullable().optional(),
  kind: z.enum(["single", "package"]).optional(),
  name: z.string().min(2).max(255),
  description: z.string().max(3000).optional(),
  colorHex: z.string().regex(/^#([A-Fa-f0-9]{6})$/).optional(),
  supportsMl: z.boolean().optional(),
  maxMl: z.number().int().min(1).max(20).optional(),
  extraMlDiscountPercent: z.number().int().min(0).max(40).optional(),
  priceRsd: z.number().int().min(0),
  durationMin: z.number().int().min(5).max(60),
  isActive: z.boolean().optional(),
  isVip: z.boolean().optional(),
  packageItems: z.array(packageItemSchema).optional(),
});

const updateSchema = baseSchema.partial().extend({ id: z.string().uuid() });

function normalizePackageItems(items = []) {
  const map = new Map();
  items.forEach((item, index) => {
    const serviceId = item.serviceId;
    const quantity = Math.max(1, Number(item.quantity || 1));
    const sortOrder = Number.isFinite(Number(item.sortOrder))
      ? Math.max(0, Number(item.sortOrder))
      : index;

    if (!map.has(serviceId)) {
      map.set(serviceId, { serviceId, quantity, sortOrder });
      return;
    }
    const existing = map.get(serviceId);
    existing.quantity += quantity;
    existing.sortOrder = Math.min(existing.sortOrder, sortOrder);
  });

  return Array.from(map.values()).sort((a, b) => a.sortOrder - b.sortOrder);
}

async function validatePackageItems(db, packageItems, currentServiceId = null) {
  if (!packageItems.length) {
    throw new Error("Package must include at least one single service.");
  }

  if (currentServiceId && packageItems.some((item) => item.serviceId === currentServiceId)) {
    throw new Error("Package cannot include itself.");
  }

  const serviceIds = packageItems.map((item) => item.serviceId);
  const rows = await db
    .select({
      id: schema.services.id,
      kind: schema.services.kind,
    })
    .from(schema.services)
    .where(and(inArray(schema.services.id, serviceIds)));

  if (rows.length !== serviceIds.length) {
    throw new Error("Some package items reference missing services.");
  }

  if (rows.some((row) => row.kind !== "single")) {
    throw new Error("Package can include only single services.");
  }

  return rows;
}

function calculatePackageTotals(packageItems, singleRows) {
  const byId = new Map(singleRows.map((row) => [row.id, row]));

  let totalDurationMin = 0;
  let totalPriceRsd = 0;

  packageItems.forEach((item) => {
    const service = byId.get(item.serviceId);
    if (!service) {
      return;
    }
    const quantity = Math.max(1, Number(item.quantity || 1));
    totalDurationMin += Number(service.durationMin || 0) * quantity;
    totalPriceRsd += Number(service.priceRsd || 0) * quantity;
  });

  if (totalDurationMin > 60) {
    throw new Error("Package total duration cannot exceed 60 minutes.");
  }

  return {
    totalDurationMin,
    totalPriceRsd,
  };
}

function normalizeServicePayload(payload, fallback = null) {
  const kind = payload.kind || fallback?.kind || "single";
  const supportsMlRaw =
    payload.supportsMl !== undefined
      ? Boolean(payload.supportsMl)
      : Boolean(fallback?.supportsMl);
  const supportsMl = kind === "single" ? supportsMlRaw : false;

  const maxMl = supportsMl
    ? Math.max(1, Number(payload.maxMl ?? fallback?.maxMl ?? 1))
    : 1;
  const extraMlDiscountPercent = supportsMl
    ? Math.min(40, Math.max(0, Number(payload.extraMlDiscountPercent ?? fallback?.extraMlDiscountPercent ?? 0)))
    : 0;

  return {
    categoryId: payload.categoryId ?? fallback?.categoryId,
    bodyAreaId:
      payload.bodyAreaId !== undefined ? payload.bodyAreaId : fallback?.bodyAreaId || null,
    kind,
    name: payload.name ?? fallback?.name,
    description: payload.description ?? fallback?.description ?? "",
    colorHex: payload.colorHex ?? fallback?.colorHex ?? "#8e939b",
    supportsMl,
    maxMl,
    extraMlDiscountPercent,
    priceRsd: Number(payload.priceRsd ?? fallback?.priceRsd ?? 0),
    durationMin: Number(payload.durationMin ?? fallback?.durationMin ?? 30),
    isActive: payload.isActive !== undefined ? Boolean(payload.isActive) : Boolean(fallback?.isActive ?? true),
    isVip: payload.isVip !== undefined ? Boolean(payload.isVip) : Boolean(fallback?.isVip ?? false),
  };
}

async function enrichWithPackageItems(db, services) {
  if (!services.length) {
    return [];
  }

  const packageIds = services.filter((item) => item.kind === "package").map((item) => item.id);
  if (!packageIds.length) {
    return services.map((service) => ({ ...service, packageItems: [] }));
  }

  const packageRows = await db
    .select({
      packageServiceId: schema.servicePackageItems.packageServiceId,
      serviceId: schema.servicePackageItems.serviceId,
      quantity: schema.servicePackageItems.quantity,
      sortOrder: schema.servicePackageItems.sortOrder,
      serviceName: schema.services.name,
    })
    .from(schema.servicePackageItems)
    .innerJoin(schema.services, eq(schema.services.id, schema.servicePackageItems.serviceId))
    .where(inArray(schema.servicePackageItems.packageServiceId, packageIds))
    .orderBy(asc(schema.servicePackageItems.sortOrder), asc(schema.servicePackageItems.createdAt));

  const byPackageId = packageRows.reduce((acc, row) => {
    if (!acc[row.packageServiceId]) {
      acc[row.packageServiceId] = [];
    }
    acc[row.packageServiceId].push({
      serviceId: row.serviceId,
      serviceName: row.serviceName,
      quantity: Number(row.quantity || 1),
      sortOrder: Number(row.sortOrder || 0),
    });
    return acc;
  }, {});

  return services.map((service) => ({
    ...service,
    packageItems: byPackageId[service.id] || [],
  }));
}

export async function GET(request) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return auth.error;
  }

  const db = getDb();
  const rows = await db.select().from(schema.services).orderBy(asc(schema.services.name));
  const data = await enrichWithPackageItems(db, rows);
  return ok({ ok: true, data });
}

export async function POST(request) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return auth.error;
  }

  const body = await readJson(request);
  const parsed = baseSchema.safeParse(body);
  if (!parsed.success) {
    return fail(400, "Invalid payload", parsed.error.flatten());
  }

  const db = getDb();

  try {
    const normalized = normalizeServicePayload(parsed.data);
    const packageItems = normalizePackageItems(parsed.data.packageItems || []);

    if (normalized.kind === "package") {
      const singleRows = await validatePackageItems(db, packageItems);
      const totals = calculatePackageTotals(packageItems, singleRows);
      normalized.durationMin = totals.totalDurationMin;
      normalized.priceRsd = totals.totalPriceRsd;
    }

    const [record] = await db.insert(schema.services).values(normalized).returning();

    if (normalized.kind === "package") {
      await db.insert(schema.servicePackageItems).values(
        packageItems.map((item) => ({
          packageServiceId: record.id,
          serviceId: item.serviceId,
          quantity: item.quantity,
          sortOrder: item.sortOrder,
        }))
      );
    }

    const [serviceWithItems] = await enrichWithPackageItems(db, [record]);
    return created({ ok: true, data: serviceWithItems });
  } catch (error) {
    return fail(400, error.message || "Failed to create service.");
  }
}

export async function PATCH(request) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return auth.error;
  }

  const body = await readJson(request);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return fail(400, "Invalid payload", parsed.error.flatten());
  }

  const { id, packageItems: incomingPackageItems, ...updates } = parsed.data;
  const db = getDb();

  const [existing] = await db
    .select()
    .from(schema.services)
    .where(eq(schema.services.id, id))
    .limit(1);

  if (!existing) {
    return fail(404, "Service not found.");
  }

  try {
    const normalized = normalizeServicePayload(updates, existing);
    const shouldReplacePackageItems = incomingPackageItems !== undefined;
    const normalizedItems = normalizePackageItems(incomingPackageItems || []);
    const switchedToPackage = existing.kind !== "package" && normalized.kind === "package";

    if (normalized.kind === "package" && shouldReplacePackageItems) {
      const singleRows = await validatePackageItems(db, normalizedItems, id);
      const totals = calculatePackageTotals(normalizedItems, singleRows);
      normalized.durationMin = totals.totalDurationMin;
      normalized.priceRsd = totals.totalPriceRsd;
    }

    if (normalized.kind === "package" && switchedToPackage && !shouldReplacePackageItems) {
      throw new Error("Package items are required when converting single service to package.");
    }

    const [record] = await db
      .update(schema.services)
      .set({ ...normalized, updatedAt: new Date() })
      .where(eq(schema.services.id, id))
      .returning();

    if (normalized.kind !== "package") {
      await db
        .delete(schema.servicePackageItems)
        .where(eq(schema.servicePackageItems.packageServiceId, id));
    } else if (shouldReplacePackageItems) {
      await db
        .delete(schema.servicePackageItems)
        .where(eq(schema.servicePackageItems.packageServiceId, id));

      if (normalizedItems.length) {
        await db.insert(schema.servicePackageItems).values(
          normalizedItems.map((item) => ({
            packageServiceId: id,
            serviceId: item.serviceId,
            quantity: item.quantity,
            sortOrder: item.sortOrder,
          }))
        );
      }
    }

    const [serviceWithItems] = await enrichWithPackageItems(db, [record]);
    return ok({ ok: true, data: serviceWithItems });
  } catch (error) {
    return fail(400, error.message || "Failed to update service.");
  }
}
