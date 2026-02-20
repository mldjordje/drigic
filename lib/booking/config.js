import { and, desc, eq } from "drizzle-orm";
import { env } from "@/lib/env";
import { getDb, schema } from "@/lib/db/client";

export function toMinutes(timeValue) {
  const [hours, minutes] = timeValue.split(":").map(Number);
  return hours * 60 + minutes;
}

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
    workdayStart: settings?.workdayStart ?? env.CLINIC_WORKDAY_START,
    workdayEnd: settings?.workdayEnd ?? env.CLINIC_WORKDAY_END,
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

