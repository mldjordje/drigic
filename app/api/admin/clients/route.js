import { and, count, desc, eq, exists, ilike, inArray, or } from "drizzle-orm";
import { ok } from "@/lib/api/http";
import { requireAdmin } from "@/lib/auth/guards";
import { getDb, schema } from "@/lib/db/client";

export const runtime = "nodejs";

const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 100;

function clampLimit(rawLimit) {
  const parsed = Number.parseInt(String(rawLimit || DEFAULT_LIMIT), 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return DEFAULT_LIMIT;
  }
  return Math.min(parsed, MAX_LIMIT);
}

function clampPage(rawPage) {
  const parsed = Number.parseInt(String(rawPage || 1), 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return 1;
  }
  return parsed;
}

function normalizeSearch(value) {
  return String(value || "").trim();
}

export async function GET(request) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return auth.error;
  }

  const db = getDb();
  const { searchParams } = new URL(request.url);
  const search = normalizeSearch(searchParams.get("search"));
  const limit = clampLimit(searchParams.get("limit"));
  const page = clampPage(searchParams.get("page"));
  const offset = (page - 1) * limit;

  const hasBookingsSubquery = db
    .select({ id: schema.bookings.id })
    .from(schema.bookings)
    .where(eq(schema.bookings.userId, schema.users.id))
    .limit(1);

  const hasTreatmentsSubquery = db
    .select({ id: schema.treatmentRecords.id })
    .from(schema.treatmentRecords)
    .where(eq(schema.treatmentRecords.userId, schema.users.id))
    .limit(1);

  const filters = [
    or(
      eq(schema.users.role, "client"),
      exists(hasBookingsSubquery),
      exists(hasTreatmentsSubquery)
    ),
  ];
  if (search) {
    const like = `%${search}%`;
    filters.push(
      or(
        ilike(schema.users.email, like),
        ilike(schema.users.phone, like),
        ilike(schema.profiles.fullName, like)
      )
    );
  }

  const whereClause = and(...filters);

  const [totalRow] = await db
    .select({ value: count() })
    .from(schema.users)
    .leftJoin(schema.profiles, eq(schema.profiles.userId, schema.users.id))
    .where(whereClause);

  const rows = await db
    .select({
      id: schema.users.id,
      email: schema.users.email,
      phone: schema.users.phone,
      role: schema.users.role,
      createdAt: schema.users.createdAt,
      lastLoginAt: schema.users.lastLoginAt,
      profileId: schema.profiles.id,
      fullName: schema.profiles.fullName,
      gender: schema.profiles.gender,
      birthDate: schema.profiles.birthDate,
      avatarUrl: schema.profiles.avatarUrl,
    })
    .from(schema.users)
    .leftJoin(schema.profiles, eq(schema.profiles.userId, schema.users.id))
    .where(whereClause)
    .orderBy(desc(schema.users.createdAt))
    .limit(limit)
    .offset(offset);

  if (!rows.length) {
    return ok({
      ok: true,
      data: [],
      pagination: {
        total: Number(totalRow?.value || 0),
        page,
        limit,
      },
    });
  }

  const userIds = rows.map((row) => row.id);
  const now = new Date();

  const [bookingRows, penaltyRows, treatmentRows] = await Promise.all([
    db
      .select({
        userId: schema.bookings.userId,
        startsAt: schema.bookings.startsAt,
        status: schema.bookings.status,
      })
      .from(schema.bookings)
      .where(inArray(schema.bookings.userId, userIds)),
    db
      .select({
        userId: schema.penalties.userId,
        amountRsd: schema.penalties.amountRsd,
        status: schema.penalties.status,
      })
      .from(schema.penalties)
      .where(inArray(schema.penalties.userId, userIds)),
    db
      .select({
        userId: schema.treatmentRecords.userId,
      })
      .from(schema.treatmentRecords)
      .where(inArray(schema.treatmentRecords.userId, userIds)),
  ]);

  const bookingStatsByUser = new Map();
  for (const booking of bookingRows) {
    const current =
      bookingStatsByUser.get(booking.userId) ||
      {
        totalBookings: 0,
        upcomingBookings: 0,
        lastBookingAt: null,
      };
    current.totalBookings += 1;
    if (
      (booking.status === "pending" || booking.status === "confirmed") &&
      new Date(booking.startsAt) >= now
    ) {
      current.upcomingBookings += 1;
    }
    if (!current.lastBookingAt || new Date(booking.startsAt) > new Date(current.lastBookingAt)) {
      current.lastBookingAt = booking.startsAt;
    }
    bookingStatsByUser.set(booking.userId, current);
  }

  const debtByUser = new Map();
  for (const penalty of penaltyRows) {
    const current = debtByUser.get(penalty.userId) || 0;
    debtByUser.set(
      penalty.userId,
      current + (penalty.status === "unpaid" ? Number(penalty.amountRsd || 0) : 0)
    );
  }

  const treatmentCountByUser = new Map();
  for (const record of treatmentRows) {
    treatmentCountByUser.set(record.userId, (treatmentCountByUser.get(record.userId) || 0) + 1);
  }

  const data = rows.map((row) => {
    const bookingStats = bookingStatsByUser.get(row.id) || {
      totalBookings: 0,
      upcomingBookings: 0,
      lastBookingAt: null,
    };
    return {
      id: row.id,
      email: row.email,
      phone: row.phone,
      role: row.role,
      createdAt: row.createdAt,
      lastLoginAt: row.lastLoginAt,
      profile: {
        id: row.profileId,
        fullName: row.fullName,
        gender: row.gender,
        birthDate: row.birthDate,
        avatarUrl: row.avatarUrl,
      },
      stats: {
        ...bookingStats,
        treatmentRecords: treatmentCountByUser.get(row.id) || 0,
        debtRsd: debtByUser.get(row.id) || 0,
      },
    };
  });

  return ok({
    ok: true,
    data,
    pagination: {
      total: Number(totalRow?.value || 0),
      page,
      limit,
    },
  });
}
