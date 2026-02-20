import { and, eq, inArray, isNull, lte, gte, or, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";
import { getClinicSettings, getDefaultEmployee, toMinutes } from "@/lib/booking/config";

const BELGRADE_DATE_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Belgrade",
});

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

function parseDateAtTime(dateStr, timeStr) {
  return new Date(`${dateStr}T${timeStr}:00+01:00`);
}

function isOverlapping(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && aEnd > bStart;
}

function toBelgradeDateKey(value) {
  return BELGRADE_DATE_FORMATTER.format(new Date(value));
}

function getPgCode(error) {
  return String(error?.code || error?.cause?.code || "");
}

function buildDaySlots({
  date,
  totalDurationMin,
  settings,
  existingBookings,
}) {
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

    slots.push({
      startAt: slotStart.toISOString(),
      endAt: slotEnd.toISOString(),
      available: !conflict,
    });
  }

  return slots;
}

export async function resolveQuote(serviceIds = []) {
  if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
    throw new Error("At least one service is required.");
  }

  const db = getDb();
  const now = new Date();
  const rows = await db
    .select({
      id: schema.services.id,
      name: schema.services.name,
      priceRsd: schema.services.priceRsd,
      durationMin: schema.services.durationMin,
      promoPriceRsd: schema.servicePromotions.promoPriceRsd,
      promoStartsAt: schema.servicePromotions.startsAt,
      promoEndsAt: schema.servicePromotions.endsAt,
      promoActive: schema.servicePromotions.isActive,
    })
    .from(schema.services)
    .leftJoin(
      schema.servicePromotions,
      eq(schema.servicePromotions.serviceId, schema.services.id)
    )
    .where(and(inArray(schema.services.id, serviceIds), eq(schema.services.isActive, true)));

  if (rows.length !== serviceIds.length) {
    throw new Error("Some services are invalid or inactive.");
  }

  const items = rows.map((row) => {
    const hasPromo =
      row.promoActive &&
      row.promoPriceRsd &&
      (!row.promoStartsAt || row.promoStartsAt <= now) &&
      (!row.promoEndsAt || row.promoEndsAt >= now);

    const finalPrice = hasPromo ? row.promoPriceRsd : row.priceRsd;
    return {
      serviceId: row.id,
      name: row.name,
      durationMin: row.durationMin,
      finalPriceRsd: finalPrice,
      regularPriceRsd: row.priceRsd,
      usedPromotion: Boolean(hasPromo),
    };
  });

  const totalDurationMin = items.reduce((sum, item) => sum + item.durationMin, 0);
  const totalPriceRsd = items.reduce((sum, item) => sum + item.finalPriceRsd, 0);

  return { items, totalDurationMin, totalPriceRsd };
}

export async function findConflicts({ employeeId, startsAt, endsAt, tx }) {
  const db = tx || getDb();
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
        lte(schema.bookings.startsAt, endsAt),
        gte(schema.bookings.endsAt, startsAt)
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
          lte(schema.bookingBlocks.startsAt, endsAt),
          gte(schema.bookingBlocks.endsAt, startsAt)
        )
      )
      .limit(20);
  } catch (error) {
    // Backward compatibility when production DB has not received booking_blocks migration yet.
    if (getPgCode(error) !== "42P01") {
      throw error;
    }
  }

  const requestedStart = new Date(startsAt);
  const requestedEnd = new Date(endsAt);

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

export async function getAvailabilityByDay({ date, serviceIds = [] }) {
  const { totalDurationMin } = serviceIds.length
    ? await resolveQuote(serviceIds)
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

export async function getAvailabilityByMonth({ month, serviceIds = [] }) {
  const { totalDurationMin } = serviceIds.length
    ? await resolveQuote(serviceIds)
    : { totalDurationMin: 15 };

  const settings = await getClinicSettings();
  const employee = await getDefaultEmployee();
  const db = getDb();

  const [year, monthPart] = month.split("-").map(Number);
  const lastDay = new Date(year, monthPart, 0).getDate();
  const startOfMonth = new Date(`${month}-01T00:00:00+01:00`);
  const endOfMonth = new Date(`${month}-${String(lastDay).padStart(2, "0")}T23:59:59+01:00`);

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
      existingBookings: [...(bookingsByDate[dayStr] || []), ...(blocksByDate[dayStr] || [])],
    });

    days.push({
      date: dayStr,
      availableSlots: slots.filter((slot) => slot.available).length,
    });
  }

  return { month, days };
}
