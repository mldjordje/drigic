import { and, eq, gte, inArray, isNull, lte, or } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";
import { getClinicSettings, getDefaultEmployee, toMinutes } from "@/lib/booking/config";

const BELGRADE_DATE_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Belgrade",
});

const MAX_BOOKING_DURATION_MIN = 60;

export function addMinutes(dateValue, minutes) {
  return new Date(dateValue.getTime() + minutes * 60 * 1000);
}

export function isWithinBookingWindow(dateValue, bookingWindowDays) {
  const now = new Date();
  const max = addMinutes(now, bookingWindowDays * 24 * 60);
  return dateValue >= now && dateValue <= max;
}

export function hasCancelWindow(startAt) {
  const diffMs = new Date(startAt).getTime() - Date.now();
  return diffMs >= 2 * 60 * 60 * 1000;
}

export function isWithinWorkHours(startAt, durationMin, settings) {
  const start = new Date(startAt);
  if (Number.isNaN(start.getTime())) {
    return false;
  }
  const end = addMinutes(start, durationMin);
  const startMin = start.getHours() * 60 + start.getMinutes();
  const endMin = end.getHours() * 60 + end.getMinutes();
  const dayStartMinutes = toMinutes(settings.workdayStart);
  const dayEndMinutes = toMinutes(settings.workdayEnd);

  return startMin >= dayStartMinutes && endMin <= dayEndMinutes;
}

function parseDateAtTime(dateStr, timeStr) {
  return new Date(`${dateStr}T${timeStr}:00+01:00`);
}

function isOverlapping(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && aEnd > bStart;
}

function toBelgradeDateKey(value) {
  return BELGRADE_DATE_FORMATTER.format(new Date(value));
}

function normalizeDate(value) {
  if (value instanceof Date) {
    return value;
  }
  return new Date(value);
}

function getPgCode(error) {
  return String(error?.code || error?.cause?.code || "");
}

function buildDaySlots({ date, totalDurationMin, settings, existingBookings }) {
  const slots = [];
  const dayStartMinutes = toMinutes(settings.workdayStart);
  const dayEndMinutes = toMinutes(settings.workdayEnd);

  for (
    let cursor = dayStartMinutes;
    cursor + totalDurationMin <= dayEndMinutes;
    cursor += settings.slotMinutes
  ) {
    const hh = String(Math.floor(cursor / 60)).padStart(2, "0");
    const mm = String(cursor % 60).padStart(2, "0");
    const slotStart = parseDateAtTime(date, `${hh}:${mm}`);
    const slotEnd = addMinutes(slotStart, totalDurationMin);

    const conflict = existingBookings.some((booking) =>
      isOverlapping(
        slotStart,
        slotEnd,
        new Date(booking.startsAt),
        new Date(booking.endsAt)
      )
    );
    const isPast = slotStart.getTime() <= Date.now();

    slots.push({
      startAt: slotStart.toISOString(),
      endAt: slotEnd.toISOString(),
      available: !conflict && !isPast,
    });
  }

  return slots;
}

function toSafeQuantity(rawQuantity) {
  const parsed = Number(rawQuantity);
  if (!Number.isFinite(parsed)) {
    return 1;
  }
  return Math.max(1, Math.floor(parsed));
}

export function normalizeServiceSelections(serviceSelections = [], serviceIds = []) {
  const source =
    Array.isArray(serviceSelections) && serviceSelections.length
      ? serviceSelections
      : Array.isArray(serviceIds)
        ? serviceIds.map((serviceId) => ({ serviceId, quantity: 1 }))
        : [];

  const map = new Map();
  source.forEach((item) => {
    if (!item) {
      return;
    }

    const serviceId =
      typeof item === "string" ? item.trim() : String(item.serviceId || "").trim();
    if (!serviceId) {
      return;
    }

    const quantity = toSafeQuantity(
      typeof item === "string" ? 1 : item.quantity
    );

    if (!map.has(serviceId)) {
      map.set(serviceId, quantity);
      return;
    }

    map.set(serviceId, map.get(serviceId) + quantity);
  });

  return Array.from(map.entries()).map(([serviceId, quantity]) => ({
    serviceId,
    quantity,
  }));
}

function calculateMlTotal(basePriceRsd, quantity, discountPercent) {
  let total = 0;
  for (let index = 1; index <= quantity; index += 1) {
    const rawFactor = 1 - ((index - 1) * discountPercent) / 100;
    const factor = Math.max(0.1, rawFactor);
    total += Math.round(basePriceRsd * factor);
  }
  return total;
}

function getActivePromoBase(service, now) {
  const hasPromo =
    service.promoActive &&
    service.promoPriceRsd !== null &&
    service.promoPriceRsd !== undefined &&
    (!service.promoStartsAt || service.promoStartsAt <= now) &&
    (!service.promoEndsAt || service.promoEndsAt >= now);

  return {
    hasPromo: Boolean(hasPromo),
    promoBase: hasPromo ? Number(service.promoPriceRsd) : Number(service.priceRsd),
    regularBase: Number(service.priceRsd),
  };
}

export async function resolveQuote(input = []) {
  const normalizedRootSelections = normalizeServiceSelections(
    Array.isArray(input) && input.length && typeof input[0] === "object"
      ? input
      : [],
    Array.isArray(input) && input.length && typeof input[0] === "string" ? input : []
  );

  if (!normalizedRootSelections.length) {
    throw new Error("At least one service is required.");
  }

  const db = getDb();
  const now = new Date();
  const rootIds = normalizedRootSelections.map((item) => item.serviceId);

  const rootRows = await db
    .select({
      id: schema.services.id,
      kind: schema.services.kind,
      name: schema.services.name,
      priceRsd: schema.services.priceRsd,
      durationMin: schema.services.durationMin,
      colorHex: schema.services.colorHex,
      supportsMl: schema.services.supportsMl,
      maxMl: schema.services.maxMl,
      extraMlDiscountPercent: schema.services.extraMlDiscountPercent,
      isActive: schema.services.isActive,
      promoPriceRsd: schema.servicePromotions.promoPriceRsd,
      promoStartsAt: schema.servicePromotions.startsAt,
      promoEndsAt: schema.servicePromotions.endsAt,
      promoActive: schema.servicePromotions.isActive,
    })
    .from(schema.services)
    .leftJoin(
      schema.servicePromotions,
      and(
        eq(schema.servicePromotions.serviceId, schema.services.id),
        eq(schema.servicePromotions.isActive, true),
        or(isNull(schema.servicePromotions.startsAt), lte(schema.servicePromotions.startsAt, now)),
        or(isNull(schema.servicePromotions.endsAt), gte(schema.servicePromotions.endsAt, now))
      )
    )
    .where(inArray(schema.services.id, rootIds));

  const uniqueRootRows = Array.from(new Map(rootRows.map((row) => [row.id, row])).values());

  if (uniqueRootRows.length !== rootIds.length) {
    throw new Error("Some services are invalid or inactive.");
  }

  const rootById = new Map(uniqueRootRows.map((row) => [row.id, row]));
  const packageIds = uniqueRootRows
    .filter((row) => row.kind === "package")
    .map((row) => row.id);

  const packageItemsRows = packageIds.length
    ? await db
        .select({
          packageServiceId: schema.servicePackageItems.packageServiceId,
          serviceId: schema.servicePackageItems.serviceId,
          quantity: schema.servicePackageItems.quantity,
          sortOrder: schema.servicePackageItems.sortOrder,
        })
        .from(schema.servicePackageItems)
        .where(inArray(schema.servicePackageItems.packageServiceId, packageIds))
    : [];

  const packageItemsByPackageId = packageItemsRows.reduce((acc, row) => {
    if (!acc[row.packageServiceId]) {
      acc[row.packageServiceId] = [];
    }
    acc[row.packageServiceId].push(row);
    return acc;
  }, {});

  const expandedByServiceId = new Map();
  normalizedRootSelections.forEach((selection) => {
    const rootService = rootById.get(selection.serviceId);
    if (!rootService || !rootService.isActive) {
      throw new Error("Some services are invalid or inactive.");
    }

    if (rootService.kind === "package") {
      const packageItems = packageItemsByPackageId[rootService.id] || [];
      if (!packageItems.length) {
        throw new Error(`Package '${rootService.name}' has no configured items.`);
      }

      packageItems.forEach((item) => {
        const quantity = Math.max(1, Number(item.quantity || 1)) * selection.quantity;
        if (!expandedByServiceId.has(item.serviceId)) {
          expandedByServiceId.set(item.serviceId, {
            quantity: 0,
            sourcePackages: new Set(),
          });
        }
        const existing = expandedByServiceId.get(item.serviceId);
        existing.quantity += quantity;
        existing.sourcePackages.add(rootService.id);
      });
      return;
    }

    if (!expandedByServiceId.has(rootService.id)) {
      expandedByServiceId.set(rootService.id, {
        quantity: 0,
        sourcePackages: new Set(),
      });
    }
    const existing = expandedByServiceId.get(rootService.id);
    existing.quantity += selection.quantity;
  });

  const expandedIds = Array.from(expandedByServiceId.keys());
  const expandedRows = await db
    .select({
      id: schema.services.id,
      kind: schema.services.kind,
      name: schema.services.name,
      priceRsd: schema.services.priceRsd,
      durationMin: schema.services.durationMin,
      colorHex: schema.services.colorHex,
      supportsMl: schema.services.supportsMl,
      maxMl: schema.services.maxMl,
      extraMlDiscountPercent: schema.services.extraMlDiscountPercent,
      isActive: schema.services.isActive,
      promoPriceRsd: schema.servicePromotions.promoPriceRsd,
      promoStartsAt: schema.servicePromotions.startsAt,
      promoEndsAt: schema.servicePromotions.endsAt,
      promoActive: schema.servicePromotions.isActive,
    })
    .from(schema.services)
    .leftJoin(
      schema.servicePromotions,
      and(
        eq(schema.servicePromotions.serviceId, schema.services.id),
        eq(schema.servicePromotions.isActive, true),
        or(isNull(schema.servicePromotions.startsAt), lte(schema.servicePromotions.startsAt, now)),
        or(isNull(schema.servicePromotions.endsAt), gte(schema.servicePromotions.endsAt, now))
      )
    )
    .where(inArray(schema.services.id, expandedIds));

  const uniqueExpandedRows = Array.from(
    new Map(expandedRows.map((row) => [row.id, row])).values()
  );

  if (uniqueExpandedRows.length !== expandedIds.length) {
    throw new Error("Some package items reference missing services.");
  }

  const items = uniqueExpandedRows.map((row) => {
    if (!row.isActive) {
      throw new Error(`Service '${row.name}' is inactive.`);
    }
    if (row.kind !== "single") {
      throw new Error("Only single services can be booked directly.");
    }

    const selection = expandedByServiceId.get(row.id);
    const quantity = toSafeQuantity(selection?.quantity || 1);
    const sourcePackages = selection?.sourcePackages || new Set();

    const { hasPromo, promoBase, regularBase } = getActivePromoBase(row, now);
    const discountPercent = Math.max(0, Math.min(40, Number(row.extraMlDiscountPercent || 0)));
    const supportsMl = Boolean(row.supportsMl);

    if (supportsMl && quantity > Number(row.maxMl || 1)) {
      throw new Error(
        `Service '${row.name}' supports up to ${Number(row.maxMl || 1)} ml.`
      );
    }

    const finalPriceRsd = supportsMl
      ? calculateMlTotal(promoBase, quantity, discountPercent)
      : promoBase * quantity;
    const regularPriceRsd = supportsMl
      ? calculateMlTotal(regularBase, quantity, discountPercent)
      : regularBase * quantity;
    const durationMin = supportsMl ? Number(row.durationMin) : Number(row.durationMin) * quantity;

    let sourcePackageServiceId = null;
    if (sourcePackages.size === 1) {
      sourcePackageServiceId = Array.from(sourcePackages)[0];
    }

    return {
      serviceId: row.id,
      name: row.name,
      quantity,
      unitLabel: supportsMl ? "ml" : "kom",
      durationMin,
      finalPriceRsd,
      regularPriceRsd,
      usedPromotion: hasPromo,
      serviceColor: row.colorHex || "#8e939b",
      sourcePackageServiceId,
      supportsMl,
      maxMl: Number(row.maxMl || 1),
      extraMlDiscountPercent: discountPercent,
    };
  });

  const totalDurationMin = items.reduce((sum, item) => sum + item.durationMin, 0);
  if (totalDurationMin > MAX_BOOKING_DURATION_MIN) {
    throw new Error(`Booking duration cannot exceed ${MAX_BOOKING_DURATION_MIN} minutes.`);
  }

  const totalPriceRsd = items.reduce((sum, item) => sum + item.finalPriceRsd, 0);
  const primaryServiceColor = items[0]?.serviceColor || "#8e939b";

  return {
    items,
    totalDurationMin,
    totalPriceRsd,
    primaryServiceColor,
    currency: "RSD",
    normalizedSelections: normalizedRootSelections,
  };
}

export async function findConflicts({ employeeId, startsAt, endsAt, tx }) {
  const db = tx || getDb();
  const startsAtDate = normalizeDate(startsAt);
  const endsAtDate = normalizeDate(endsAt);

  if (Number.isNaN(startsAtDate.getTime()) || Number.isNaN(endsAtDate.getTime())) {
    throw new Error("Invalid date range for conflict check.");
  }

  const bookingRows = await db
    .select({
      id: schema.bookings.id,
      startsAt: schema.bookings.startsAt,
      endsAt: schema.bookings.endsAt,
    })
    .from(schema.bookings)
    .where(
      and(
        eq(schema.bookings.employeeId, employeeId),
        inArray(schema.bookings.status, ["pending", "confirmed"]),
        lte(schema.bookings.startsAt, endsAtDate),
        gte(schema.bookings.endsAt, startsAtDate)
      )
    )
    .limit(20);
  let blockRows = [];
  try {
    blockRows = await db
      .select({
        id: schema.bookingBlocks.id,
        startsAt: schema.bookingBlocks.startsAt,
        endsAt: schema.bookingBlocks.endsAt,
      })
      .from(schema.bookingBlocks)
      .where(
        and(
          eq(schema.bookingBlocks.employeeId, employeeId),
          lte(schema.bookingBlocks.startsAt, endsAtDate),
          gte(schema.bookingBlocks.endsAt, startsAtDate)
        )
      )
      .limit(20);
  } catch (error) {
    if (getPgCode(error) !== "42P01") {
      throw error;
    }
  }

  const requestedStart = startsAtDate;
  const requestedEnd = endsAtDate;

  const bookingConflicts = bookingRows.filter((booking) =>
    isOverlapping(
      requestedStart,
      requestedEnd,
      new Date(booking.startsAt),
      new Date(booking.endsAt)
    )
  );
  const blockConflicts = blockRows.filter((block) =>
    isOverlapping(
      requestedStart,
      requestedEnd,
      new Date(block.startsAt),
      new Date(block.endsAt)
    )
  );

  return [...bookingConflicts, ...blockConflicts];
}

export async function getAvailabilityByDay({
  date,
  serviceIds = [],
  serviceSelections = [],
}) {
  const { totalDurationMin } =
    serviceSelections.length || serviceIds.length
      ? await resolveQuote(
          serviceSelections.length ? serviceSelections : serviceIds
        )
      : { totalDurationMin: 15 };

  const settings = await getClinicSettings();
  const employee = await getDefaultEmployee();
  const db = getDb();

  const startOfDay = new Date(`${date}T00:00:00+01:00`);
  const endOfDay = new Date(`${date}T23:59:59+01:00`);

  const existingBookings = await db
    .select({
      startsAt: schema.bookings.startsAt,
      endsAt: schema.bookings.endsAt,
    })
    .from(schema.bookings)
    .where(
      and(
        eq(schema.bookings.employeeId, employee.id),
        inArray(schema.bookings.status, ["pending", "confirmed"]),
        gte(schema.bookings.startsAt, startOfDay),
        lte(schema.bookings.startsAt, endOfDay)
      )
    );

  let existingBlocks = [];
  try {
    existingBlocks = await db
      .select({
        startsAt: schema.bookingBlocks.startsAt,
        endsAt: schema.bookingBlocks.endsAt,
      })
      .from(schema.bookingBlocks)
      .where(
        and(
          eq(schema.bookingBlocks.employeeId, employee.id),
          gte(schema.bookingBlocks.startsAt, startOfDay),
          lte(schema.bookingBlocks.startsAt, endOfDay)
        )
      );
  } catch (error) {
    if (getPgCode(error) !== "42P01") {
      throw error;
    }
  }

  const slots = buildDaySlots({
    date,
    totalDurationMin,
    settings,
    existingBookings: [...existingBookings, ...existingBlocks],
  });

  return {
    date,
    totalDurationMin,
    slotMinutes: settings.slotMinutes,
    slots,
  };
}

export async function getAvailabilityByMonth({
  month,
  serviceIds = [],
  serviceSelections = [],
}) {
  const { totalDurationMin } =
    serviceSelections.length || serviceIds.length
      ? await resolveQuote(
          serviceSelections.length ? serviceSelections : serviceIds
        )
      : { totalDurationMin: 15 };

  const settings = await getClinicSettings();
  const employee = await getDefaultEmployee();
  const db = getDb();

  const [year, monthPart] = month.split("-").map(Number);
  const lastDay = new Date(year, monthPart, 0).getDate();
  const startOfMonth = new Date(`${month}-01T00:00:00+01:00`);
  const endOfMonth = new Date(
    `${month}-${String(lastDay).padStart(2, "0")}T23:59:59+01:00`
  );

  const monthBookings = await db
    .select({
      startsAt: schema.bookings.startsAt,
      endsAt: schema.bookings.endsAt,
    })
    .from(schema.bookings)
    .where(
      and(
        eq(schema.bookings.employeeId, employee.id),
        inArray(schema.bookings.status, ["pending", "confirmed"]),
        gte(schema.bookings.startsAt, startOfMonth),
        lte(schema.bookings.startsAt, endOfMonth)
      )
    );

  let monthBlocks = [];
  try {
    monthBlocks = await db
      .select({
        startsAt: schema.bookingBlocks.startsAt,
        endsAt: schema.bookingBlocks.endsAt,
      })
      .from(schema.bookingBlocks)
      .where(
        and(
          eq(schema.bookingBlocks.employeeId, employee.id),
          gte(schema.bookingBlocks.startsAt, startOfMonth),
          lte(schema.bookingBlocks.startsAt, endOfMonth)
        )
      );
  } catch (error) {
    if (getPgCode(error) !== "42P01") {
      throw error;
    }
  }

  const bookingsByDate = monthBookings.reduce((acc, booking) => {
    const key = toBelgradeDateKey(booking.startsAt);
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(booking);
    return acc;
  }, {});

  const blocksByDate = monthBlocks.reduce((acc, block) => {
    const key = toBelgradeDateKey(block.startsAt);
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(block);
    return acc;
  }, {});

  const days = [];
  for (let day = 1; day <= lastDay; day += 1) {
    const dayStr = `${month}-${String(day).padStart(2, "0")}`;
    const slots = buildDaySlots({
      date: dayStr,
      totalDurationMin,
      settings,
      existingBookings: [
        ...(bookingsByDate[dayStr] || []),
        ...(blocksByDate[dayStr] || []),
      ],
    });

    days.push({
      date: dayStr,
      availableSlots: slots.filter((slot) => slot.available).length,
    });
  }

  return { month, days };
}
