import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { created, fail, readJson } from "@/lib/api/http";
import { requireAdmin } from "@/lib/auth/guards";
import { getDb, schema } from "@/lib/db/client";
import { getDefaultEmployee } from "@/lib/booking/config";
import { buildClientBookingEmail } from "@/lib/notifications/booking-email";
import { deliverBookingNotification } from "@/lib/notifications/delivery";
import { getServiceReminderGuidance } from "@/lib/notifications/service-reminders";

export const runtime = "nodejs";

const payloadSchema = z.object({
  notes: z.string().max(2000).optional(),
  correctionDueDate: z.string().optional(),
});

const TREATMENT_RECORD_EXISTS_ERROR = "Treatment record for this booking already exists.";
const COMPLETION_STATUS_ERROR = "Booking cannot be completed from current status.";

function addDays(dateValue, days) {
  const nextDate = new Date(dateValue);
  nextDate.setUTCDate(nextDate.getUTCDate() + Number(days || 0));
  return nextDate.toISOString().slice(0, 10);
}

function formatServiceSummaryItem(row) {
  const quantity = Number(row.quantity || 1);
  const label = row.serviceName || "Usluga";
  if (quantity <= 1) {
    return label;
  }

  return `${label} (${quantity} ${row.unitLabel || "kom"})`;
}

async function lockBooking(tx, bookingId) {
  await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${bookingId}, 0))`);
}

async function loadBookingCompletionContext(db, bookingId) {
  const rows = await db
    .select({
      booking: schema.bookings,
      email: schema.users.email,
      serviceName: schema.bookingItems.serviceNameSnapshot,
      quantity: schema.bookingItems.quantity,
      unitLabel: schema.bookingItems.unitLabel,
    })
    .from(schema.bookings)
    .leftJoin(schema.users, eq(schema.users.id, schema.bookings.userId))
    .leftJoin(schema.bookingItems, eq(schema.bookingItems.bookingId, schema.bookings.id))
    .where(eq(schema.bookings.id, bookingId));

  if (!rows.length) {
    return null;
  }

  const first = rows[0];
  const services = rows
    .filter((row) => row.serviceName)
    .map((row) => formatServiceSummaryItem(row));

  return {
    ...first.booking,
    email: first.email,
    serviceSummary: services.join(", "),
  };
}

export async function POST(request, { params }) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return auth.error;
  }

  const { id } = params;
  const body = (await readJson(request)) || {};
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return fail(400, "Invalid payload", parsed.error.flatten());
  }

  const db = getDb();
  const employee = await getDefaultEmployee();
  const now = new Date();
  let booking = null;
  let updatedBooking = null;
  let record = null;

  try {
    await db.transaction(async (tx) => {
      await lockBooking(tx, id);

      [booking] = await tx
        .select()
        .from(schema.bookings)
        .where(eq(schema.bookings.id, id))
        .limit(1);

      if (!booking) {
        throw new Error("BOOKING_NOT_FOUND");
      }
      if (!["pending", "confirmed"].includes(booking.status)) {
        throw new Error(COMPLETION_STATUS_ERROR);
      }

      const [existingRecord] = await tx
        .select({ id: schema.treatmentRecords.id })
        .from(schema.treatmentRecords)
        .where(eq(schema.treatmentRecords.bookingId, booking.id))
        .limit(1);
      if (existingRecord) {
        throw new Error(TREATMENT_RECORD_EXISTS_ERROR);
      }

      const bookingItemRows = await tx
        .select({
          serviceId: schema.bookingItems.serviceId,
          reminderEnabled: schema.services.reminderEnabled,
          reminderDelayDays: schema.services.reminderDelayDays,
        })
        .from(schema.bookingItems)
        .leftJoin(schema.services, eq(schema.services.id, schema.bookingItems.serviceId))
        .where(eq(schema.bookingItems.bookingId, booking.id));

      const reminderService =
        bookingItemRows.find((item) => item.serviceId && item.reminderEnabled) ||
        bookingItemRows.find((item) => item.serviceId) ||
        null;

      const correctionDueDate =
        parsed.data.correctionDueDate ||
        (reminderService?.reminderEnabled
          ? addDays(booking.endsAt || booking.startsAt, reminderService.reminderDelayDays || 90)
          : null);

      [updatedBooking] = await tx
        .update(schema.bookings)
        .set({
          status: "completed",
          updatedAt: now,
        })
        .where(eq(schema.bookings.id, booking.id))
        .returning();

      await tx.insert(schema.bookingStatusLog).values({
        bookingId: booking.id,
        previousStatus: booking.status,
        nextStatus: "completed",
        changedByUserId: auth.user.id,
        note: parsed.data.notes || "Completed by admin",
      });

      [record] = await tx
        .insert(schema.treatmentRecords)
        .values({
          userId: booking.userId,
          bookingId: booking.id,
          serviceId: reminderService?.serviceId || null,
          employeeId: employee.id,
          treatmentDate: booking.endsAt || booking.startsAt,
          notes: parsed.data.notes || null,
          correctionDueDate,
        })
        .returning();
    });
  } catch (error) {
    const message = String(error?.message || "");
    if (message.includes("BOOKING_NOT_FOUND")) {
      return fail(404, "Booking not found.");
    }
    if (message.includes(COMPLETION_STATUS_ERROR)) {
      return fail(409, `Booking cannot be completed from status '${booking?.status || "unknown"}'.`);
    }
    if (message.includes(TREATMENT_RECORD_EXISTS_ERROR)) {
      return fail(409, TREATMENT_RECORD_EXISTS_ERROR);
    }
    return fail(500, error?.message || "Failed to complete booking.");
  }

  try {
    const completionContext = await loadBookingCompletionContext(db, updatedBooking.id);
    if (completionContext?.email) {
      const guidance = getServiceReminderGuidance(completionContext.serviceSummary);
      const footerLines = [...guidance.aftercare];
      const serviceLabel = completionContext.serviceSummary
        ? ` za ${completionContext.serviceSummary}`
        : "";

      if (record?.correctionDueDate) {
        footerLines.push(
          `Preporuceni kontrolni termin je oko ${new Date(
            `${record.correctionDueDate}T12:00:00Z`
          ).toLocaleDateString("sr-RS", {
            timeZone: "Europe/Belgrade",
            dateStyle: "long",
          })}.`
        );
      }

      await deliverBookingNotification({
        db,
        userId: completionContext.userId,
        email: completionContext.email,
        type: "post_treatment_care",
        title: "Saveti nakon tretmana",
        message: `Poslali smo vam savete nakon tretmana${serviceLabel}.`,
        bookingId: completionContext.id,
        scheduledFor: completionContext.endsAt || completionContext.startsAt,
        dedupe: true,
        emailPayload: buildClientBookingEmail({
          subject: "Saveti nakon tretmana",
          previewText: "Kratke smernice za oporavak i negu nakon tretmana",
          heading: "Saveti nakon tretmana",
          intro:
            "Termin je evidentiran kao zavrsen. U nastavku vam saljemo kratke smernice za oporavak i negu, kako biste rezultat pratili sto sigurnije i mirnije.",
          startsAt: completionContext.endsAt || completionContext.startsAt,
          serviceSummary: completionContext.serviceSummary,
          durationMin: completionContext.totalDurationMin,
          priceRsd: completionContext.totalPriceRsd,
          statusLabel: "Zavrsen",
          notes: completionContext.notes,
          footerLines,
        }),
      });
    }
  } catch {
    // Completion should not fail if follow-up delivery encounters an issue.
  }

  return created({
    ok: true,
    booking: updatedBooking,
    treatmentRecord: record,
  });
}
