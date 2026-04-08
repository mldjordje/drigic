import { and, asc, eq, gte, lte, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";

export const DEFAULT_WEEKDAY_INTERVALS = [{ start: "16:00", end: "21:00" }];
export const DEFAULT_SATURDAY_INTERVALS = [{ start: "10:00", end: "16:00" }];
export const WORKING_HOURS_SUMMARY =
  "Radni dani 16:00-21:00, subota 10:00-16:00; nedelja zatvorena osim kada je uključena u Admin → Nedelja.";

const BELGRADE_DATE_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Belgrade",
});

function parseDateKey(value) {
  const [year, month, day] = String(value || "")
    .split("-")
    .map((part) => Number(part));

  if (!year || !month || !day) {
    return null;
  }

  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

function addDateDays(dateValue, amount) {
  const copy = new Date(dateValue);
  copy.setUTCDate(copy.getUTCDate() + amount);
  return copy;
}

function getPgCode(error) {
  return String(error?.code || error?.cause?.code || "");
}

export function toMinutes(timeValue) {
  const [hours, minutes] = String(timeValue || "")
    .split(":")
    .map(Number);
  return hours * 60 + minutes;
}

export function toBelgradeDateKey(value) {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  return BELGRADE_DATE_FORMATTER.format(new Date(value));
}

export function toDateColumnKey(value) {
  if (typeof value === "string") {
    return value.slice(0, 10);
  }
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  return value?.toISOString?.().slice(0, 10) || String(value || "").slice(0, 10);
}

export function isSundayDateKey(dateKey) {
  const parsed = parseDateKey(dateKey);
  if (!parsed) {
    return false;
  }
  return parsed.getUTCDay() === 0;
}

export function getBaseWorkingIntervals(dateKey) {
  const parsed = parseDateKey(dateKey);
  if (!parsed) {
    return [];
  }

  const weekday = parsed.getUTCDay();
  if (weekday === 0) {
    return [];
  }
  if (weekday === 6) {
    return DEFAULT_SATURDAY_INTERVALS.map((item) => ({ ...item }));
  }
  return DEFAULT_WEEKDAY_INTERVALS.map((item) => ({ ...item }));
}

export function normalizeWorkingIntervals(intervals = []) {
  const sorted = intervals
    .filter(
      (item) =>
        item &&
        /^\d{2}:\d{2}$/.test(String(item.start || "")) &&
        /^\d{2}:\d{2}$/.test(String(item.end || "")) &&
        toMinutes(item.start) < toMinutes(item.end)
    )
    .map((item) => ({ start: item.start, end: item.end }))
    .sort((a, b) => toMinutes(a.start) - toMinutes(b.start));

  const merged = [];
  for (const interval of sorted) {
    const previous = merged[merged.length - 1];
    if (!previous) {
      merged.push({ ...interval });
      continue;
    }

    if (toMinutes(interval.start) <= toMinutes(previous.end)) {
      if (toMinutes(interval.end) > toMinutes(previous.end)) {
        previous.end = interval.end;
      }
      continue;
    }

    merged.push({ ...interval });
  }

  return merged;
}

export function getWorkingIntervalsForDate(
  dateKey,
  activationRows = [],
  sundayRow = null
) {
  if (isSundayDateKey(dateKey)) {
    if (
      sundayRow &&
      sundayRow.isActive !== false &&
      sundayRow.startTime &&
      sundayRow.endTime
    ) {
      return normalizeWorkingIntervals([
        { start: sundayRow.startTime, end: sundayRow.endTime },
      ]);
    }
    return [];
  }

  const baseIntervals = getBaseWorkingIntervals(dateKey);
  const activationIntervals = activationRows.map((row) => ({
    start: row.startTime,
    end: row.endTime,
  }));

  return normalizeWorkingIntervals([...baseIntervals, ...activationIntervals]);
}

export function iterateDateKeysBetween(startDate, endDate) {
  const start = parseDateKey(startDate);
  const end = parseDateKey(endDate);
  if (!start || !end || start.getTime() > end.getTime()) {
    return [];
  }

  const keys = [];
  let cursor = start;
  while (cursor.getTime() <= end.getTime()) {
    keys.push(cursor.toISOString().slice(0, 10));
    cursor = addDateDays(cursor, 1);
  }

  return keys;
}

export async function loadMorningShiftActivations({
  startDate,
  endDate,
  includeInactive = false,
  db: injectedDb,
} = {}) {
  if (!startDate || !endDate) {
    return [];
  }

  const db = injectedDb || getDb();

  try {
    const filters = [
      lte(schema.morningShiftActivations.startDate, endDate),
      gte(schema.morningShiftActivations.endDate, startDate),
    ];

    if (!includeInactive) {
      filters.unshift(eq(schema.morningShiftActivations.isActive, true));
    }

    return await db
      .select()
      .from(schema.morningShiftActivations)
      .where(and(...filters))
      .orderBy(
        asc(schema.morningShiftActivations.startDate),
        asc(schema.morningShiftActivations.startTime)
      );
  } catch (error) {
    if (getPgCode(error) === "42P01") {
      return [];
    }
    throw error;
  }
}

export function mapMorningShiftActivationsByDate(
  activationRows = [],
  startDate,
  endDate
) {
  const mapped = {};

  for (const row of activationRows) {
    const overlapStart = row.startDate > startDate ? row.startDate : startDate;
    const overlapEnd = row.endDate < endDate ? row.endDate : endDate;
    const dateKeys = iterateDateKeysBetween(overlapStart, overlapEnd);

    for (const dateKey of dateKeys) {
      if (isSundayDateKey(dateKey)) {
        continue;
      }
      if (!mapped[dateKey]) {
        mapped[dateKey] = [];
      }
      mapped[dateKey].push(row);
    }
  }

  return mapped;
}

export async function loadSundayAvailability({
  startDate,
  endDate,
  includeInactive = false,
  db: injectedDb,
} = {}) {
  if (!startDate || !endDate) {
    return [];
  }

  const db = injectedDb || getDb();

  try {
    const startKey = String(startDate).slice(0, 10);
    const endKey = String(endDate).slice(0, 10);

    const filters = [
      // Stabilno filtriranje: poredi kao tekst 'YYYY-MM-DD' direktno u Postgres-u
      sql`to_char(${schema.sundayAvailability.sundayDate}, 'YYYY-MM-DD') >= ${startKey}`,
      sql`to_char(${schema.sundayAvailability.sundayDate}, 'YYYY-MM-DD') <= ${endKey}`,
    ];

    if (!includeInactive) {
      filters.unshift(eq(schema.sundayAvailability.isActive, true));
    }

    return await db
      .select()
      .from(schema.sundayAvailability)
      .where(and(...filters))
      .orderBy(asc(schema.sundayAvailability.sundayDate));
  } catch (error) {
    if (getPgCode(error) === "42P01") {
      return [];
    }
    throw error;
  }
}

/** Next N Sunday date keys (YYYY-MM-DD) starting from startDateKey inclusive, Europe/Belgrade calendar day semantics via parseDateKey. */
export function nextSundayDateKeysFrom(startDateKey, count = 3) {
  const start = parseDateKey(startDateKey);
  if (!start || !Number.isFinite(count) || count < 1) {
    return [];
  }

  const cursor = new Date(start.getTime());
  while (cursor.getUTCDay() !== 0) {
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  const keys = [];
  for (let i = 0; i < count; i += 1) {
    keys.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 7);
  }
  return keys;
}

export function mapSundayAvailabilityByDate(rows = [], startDate, endDate) {
  const mapped = {};
  for (const row of rows) {
    // pg "date" is a calendar value; do not timezone-shift it through Belgrade formatting.
    const key = toDateColumnKey(row.sundayDate);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) {
      continue;
    }
    if (key < startDate || key > endDate) {
      continue;
    }
    mapped[key] = row;
  }
  return mapped;
}
