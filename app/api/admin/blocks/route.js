import { and, desc, eq, gte, lte } from "drizzle-orm";
import { z } from "zod";
import { created, fail, ok, readJson } from "@/lib/api/http";
import { requireAdmin } from "@/lib/auth/guards";
import { getDb, schema } from "@/lib/db/client";
import { addMinutes, findConflicts } from "@/lib/booking/engine";
import { getDefaultEmployee } from "@/lib/booking/config";

export const runtime = "nodejs";

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
    const startsAt = new Date(parsed.data.startsAt);
    const endsAt = addMinutes(startsAt, parsed.data.durationMin);
    const db = getDb();

    const conflicts = await findConflicts({
      employeeId: employee.id,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      tx: db,
    });

    if (conflicts.length) {
      return fail(409, "Block overlaps with existing booking/block.");
    }

    const [record] = await db
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

    return created({ ok: true, data: record });
  } catch (error) {
    return fail(500, error?.message || "Failed to create block.");
  }
}
