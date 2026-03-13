import { and, desc, eq, gte, lte } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { created, fail, ok, readJson } from "@/lib/api/http";
import { requireAdmin } from "@/lib/auth/guards";
import { getDb, schema } from "@/lib/db/client";
import { addMinutes, findConflicts, isWithinWorkHours } from "@/lib/booking/engine";
import { getClinicSettings, getDefaultEmployee } from "@/lib/booking/config";

export const runtime = "nodejs";
const SLOT_CONFLICT_ERROR = "Block overlaps with existing booking/block.";

async function lockEmployeeSchedule(tx, employeeId) {
  await tx.execute(
    sql`SELECT pg_advisory_xact_lock(hashtextextended(${employeeId}, 0))`
  );
}

const createSchema = z.object({
  startsAt: z.string().datetime(),
  durationMin: z.number().int().min(5).max(12 * 60),
  note: z.string().max(1000).optional(),
});

export async function GET(request) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return auth.error;
  }

  const db = getDb();
  const employee = await getDefaultEmployee();
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  let rows = [];
  if (from && to) {
    rows = await db
      .select()
      .from(schema.bookingBlocks)
      .where(
        and(
          eq(schema.bookingBlocks.employeeId, employee.id),
          gte(schema.bookingBlocks.startsAt, new Date(from)),
          lte(schema.bookingBlocks.startsAt, new Date(to))
        )
      )
      .orderBy(schema.bookingBlocks.startsAt);
  } else {
    rows = await db
      .select()
      .from(schema.bookingBlocks)
      .where(eq(schema.bookingBlocks.employeeId, employee.id))
      .orderBy(desc(schema.bookingBlocks.startsAt))
      .limit(200);
  }

  return ok({ ok: true, data: rows });
}

export async function POST(request) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return auth.error;
  }

  const body = await readJson(request);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return fail(400, "Invalid payload", parsed.error.flatten());
  }

  try {
    const employee = await getDefaultEmployee();
    const settings = await getClinicSettings();
    const startsAt = new Date(parsed.data.startsAt);
    const endsAt = addMinutes(startsAt, parsed.data.durationMin);
    const db = getDb();
    if (!isWithinWorkHours(startsAt, parsed.data.durationMin, settings)) {
      return fail(
        400,
        `Clinic working hours are ${settings.workdayStart}-${settings.workdayEnd}.`
      );
    }

    let record = null;
    await db.transaction(async (tx) => {
      await lockEmployeeSchedule(tx, employee.id);

      const conflicts = await findConflicts({
        employeeId: employee.id,
        startsAt: startsAt,
        endsAt: endsAt,
        tx,
      });

      if (conflicts.length) {
        throw new Error(SLOT_CONFLICT_ERROR);
      }

      [record] = await tx
        .insert(schema.bookingBlocks)
        .values({
          employeeId: employee.id,
          startsAt,
          endsAt,
          durationMin: parsed.data.durationMin,
          note: parsed.data.note || null,
          createdByUserId: auth.user.id,
        })
        .returning();
    });

    return created({ ok: true, data: record });
  } catch (error) {
    if (String(error?.message || "").includes(SLOT_CONFLICT_ERROR)) {
      return fail(409, SLOT_CONFLICT_ERROR);
    }
    return fail(500, error?.message || "Failed to create block.");
  }
}
