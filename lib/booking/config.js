import { and, desc, eq } from "drizzle-orm";
import { env } from "@/lib/env";
import { getDb, schema } from "@/lib/db/client";
import {
  DEFAULT_WEEKDAY_INTERVALS,
  WORKING_HOURS_SUMMARY,
  toMinutes,
} from "@/lib/booking/schedule";

const FIXED_WORKDAY_START = DEFAULT_WEEKDAY_INTERVALS[0].start;
const FIXED_WORKDAY_END = DEFAULT_WEEKDAY_INTERVALS[0].end;

export async function getClinicSettings() {
  const db = getDb();
  const [settings] = await db
    .select()
    .from(schema.clinicSettings)
    .orderBy(desc(schema.clinicSettings.createdAt))
    .limit(1);

  return {
    slotMinutes: settings?.slotMinutes ?? env.CLINIC_SLOT_MINUTES,
    bookingWindowDays:
      settings?.bookingWindowDays ?? env.CLINIC_BOOKING_WINDOW_DAYS,
    // Clinic working hours are locked by business requirement.
    workdayStart: FIXED_WORKDAY_START,
    workdayEnd: FIXED_WORKDAY_END,
    workingHoursSummary: WORKING_HOURS_SUMMARY,
  };
}

export async function getDefaultEmployee() {
  const db = getDb();
  const [employee] = await db
    .select()
    .from(schema.employees)
    .where(
      and(
        eq(schema.employees.slug, env.CLINIC_DEFAULT_EMPLOYEE_SLUG),
        eq(schema.employees.isActive, true)
      )
    )
    .limit(1);

  if (employee) {
    return employee;
  }

  const [inserted] = await db
    .insert(schema.employees)
    .values({
      fullName: "Dr Nikola Igić",
      slug: env.CLINIC_DEFAULT_EMPLOYEE_SLUG,
      isActive: true,
    })
    .returning();

  return inserted;
}
