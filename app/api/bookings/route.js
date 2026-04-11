import { z } from "zod";
import { sql } from "drizzle-orm";
import { created, fail, readJson } from "@/lib/api/http";
import { requireUser } from "@/lib/auth/guards";
import { sendTransactionalEmail } from "@/lib/auth/email";
import { getDb, schema } from "@/lib/db/client";
import { env } from "@/lib/env";
import {
  deliverBookingNotification,
  deliverNewBookingAlertToAdmins,
} from "@/lib/notifications/delivery";
import {
  buildAdminBookingEmail,
  buildClientBookingEmail,
} from "@/lib/notifications/booking-email";
import {
  CONSULTATION_SELECTION_ID,
  addMinutes,
  findConflicts,
  isWithinBookingWindow,
  isWithinWorkHours,
  normalizeServiceSelections,
  resolveQuote,
} from "@/lib/booking/engine";
import { getClinicSettings, getDefaultEmployee } from "@/lib/booking/config";
import { WORKING_HOURS_SUMMARY } from "@/lib/booking/schedule";

export const runtime = "nodejs";

const payloadSchema = z.object({
  serviceIds: z.array(z.string().uuid()).optional(),
  serviceSelections: z
    .array(
      z.object({
        serviceId: z.union([z.string().uuid(), z.literal(CONSULTATION_SELECTION_ID)]),
        quantity: z.number().int().min(1).optional(),
        brand: z.string().min(1).max(80).optional(),
      })
    )
    .optional(),
  startAt: z.string().datetime(),
  notes: z.string().max(1000).optional(),
});

async function lockEmployeeSchedule(tx, employeeId) {
  await tx.execute(
    sql`SELECT pg_advisory_xact_lock(hashtextextended(${employeeId}, 0))`
  );
}

export async function POST(request) {
  try {
    const auth = await requireUser(request);
    if (auth.error) {
      return auth.error;
    }

    const body = await readJson(request);
    const parsed = payloadSchema.safeParse(body);
    if (!parsed.success) {
      return fail(400, "Invalid payload", parsed.error.flatten());
    }

    const db = getDb();
    const startAt = new Date(parsed.data.startAt);
    const settings = await getClinicSettings();
    const normalizedSelections = normalizeServiceSelections(
      parsed.data.serviceSelections || [],
      parsed.data.serviceIds || []
    );

    if (!normalizedSelections.length) {
      return fail(400, "At least one service is required.");
    }

    if (!isWithinBookingWindow(startAt, settings.bookingWindowDays)) {
      return fail(400, `Booking must be within next ${settings.bookingWindowDays} days.`);
    }

    const quote = await resolveQuote(normalizedSelections, {
      requireHyaluronicBrand: true,
    });
    const endsAt = addMinutes(startAt, quote.totalDurationMin);
    const employee = await getDefaultEmployee();

    if (!(await isWithinWorkHours(startAt, quote.totalDurationMin, settings))) {
      return fail(400, `Clinic working hours are: ${WORKING_HOURS_SUMMARY}`);
    }

    let createdBooking = null;
    await db.transaction(async (tx) => {
      await lockEmployeeSchedule(tx, employee.id);

      const conflicts = await findConflicts({
        employeeId: employee.id,
        startsAt: startAt,
        endsAt,
        tx,
      });

      if (conflicts.length) {
        throw new Error("Requested slot is no longer available.");
      }

      [createdBooking] = await tx
        .insert(schema.bookings)
        .values({
          userId: auth.user.id,
          employeeId: employee.id,
          startsAt: startAt,
          endsAt,
          status: "pending",
          totalDurationMin: quote.totalDurationMin,
          totalPriceRsd: quote.totalPriceRsd,
          primaryServiceColor: quote.primaryServiceColor,
          notes: parsed.data.notes || null,
        })
        .returning();

      const bookingItems = quote.items
        .filter((item) => item.serviceId !== CONSULTATION_SELECTION_ID)
        .map((item) => ({
          bookingId: createdBooking.id,
          serviceId: item.serviceId,
          quantity: item.quantity,
          unitLabel: item.unitLabel,
          serviceNameSnapshot: item.name,
          durationMinSnapshot: item.durationMin,
          priceRsdSnapshot: item.finalPriceRsd,
          serviceColorSnapshot: item.serviceColor,
          sourcePackageServiceId: item.sourcePackageServiceId || null,
        }));

      if (bookingItems.length) {
        await tx.insert(schema.bookingItems).values(bookingItems);
      }

      try {
        await tx.insert(schema.bookingStatusLog).values({
          bookingId: createdBooking.id,
          previousStatus: null,
          nextStatus: "pending",
          changedByUserId: auth.user.id,
          note: "Booking created online (awaiting admin confirmation)",
        });
      } catch (logError) {
        console.error("[bookings.create] status log insert failed", logError);
      }
    });

    try {
      const startsAtLabel = new Date(createdBooking.startsAt).toLocaleString("sr-RS", {
        timeZone: "Europe/Belgrade",
      });
      const serviceSummary = quote.items
        .map((item) => `${item.name}${item.quantity > 1 ? ` x${item.quantity}` : ""}`)
        .join(", ");
      const inboxEmail = String(env.ADMIN_BOOKING_NOTIFY_EMAIL || "").trim();
      const clientDisplay = auth.user.email || auth.user.id;
      const clientEmailPayload = auth.user.email
        ? buildClientBookingEmail({
            subject: "Zahtev za termin je primljen",
            previewText: "Vas zahtev je uspesno evidentiran",
            heading: "Zahtev za termin je primljen",
            intro:
              "Poslali ste zahtev za termin i nas tim ce ga uskoro pregledati. Kada termin bude potvrdjen, dobicete novo obavestenje.",
            startsAt: createdBooking.startsAt,
            serviceSummary,
            durationMin: quote.totalDurationMin,
            priceRsd: quote.totalPriceRsd,
            statusLabel: "Na cekanju",
            notes: parsed.data.notes || null,
          })
        : null;

      const notifyResult = inboxEmail
        ? await sendTransactionalEmail({
            to: inboxEmail,
            ...buildAdminBookingEmail({
              subject: "Novi zahtev za termin",
              previewText: "Stigao je novi zahtev koji ceka obradu",
              heading: "Novi zahtev za termin",
              intro:
                "Stigao je novi zahtev preko booking forme. Pregledajte detalje i potvrdite termin iz admin kalendara.",
              startsAt: createdBooking.startsAt,
              serviceSummary,
              durationMin: quote.totalDurationMin,
              priceRsd: quote.totalPriceRsd,
              statusLabel: "Na cekanju",
              notes: parsed.data.notes || null,
              clientName: clientDisplay,
              clientEmail: auth.user.email || null,
              clientPhone: null,
            }),
          })
        : { sent: false, reason: "ADMIN_BOOKING_NOTIFY_EMAIL missing" };

      if (!notifyResult?.sent) {
        console.error(
          "[bookings.create] admin inbox email not sent",
          notifyResult?.reason || "unknown reason"
        );
      }

      if (auth.user.email) {
        await deliverBookingNotification({
          db,
          userId: auth.user.id,
          email: auth.user.email,
          type: "booking_submitted",
          title: "Zahtev za termin je poslat",
          message: `Vas zahtev za termin ${startsAtLabel} je primljen. Uskoro cete dobiti potvrdu klinike. Usluge: ${serviceSummary || "-"}.`,
          bookingId: createdBooking.id,
          scheduledFor: createdBooking.startsAt,
          dedupe: true,
          emailPayload: clientEmailPayload,
        });
      }

      await deliverNewBookingAlertToAdmins({
        db,
        bookingId: createdBooking.id,
        clientName: clientDisplay,
        clientEmail: auth.user.email || auth.user.id,
        clientPhone: null,
        startsAtLabel,
        startsAt: createdBooking.startsAt,
        serviceSummary,
        durationMin: quote.totalDurationMin,
        priceRsd: quote.totalPriceRsd,
        notes: parsed.data.notes || null,
      });
    } catch (notifyError) {
      console.error("[bookings.create] notification pipeline failed", notifyError);
    }

    return created({
      ok: true,
      booking: createdBooking,
      quote,
    });
  } catch (error) {
    const errorCode = String(error?.code || error?.cause?.code || "");
    const message = error?.message || "Booking failed.";
    if (message.includes("Requested slot is no longer available")) {
      return fail(409, message);
    }
    if (message.includes("invalid or inactive")) {
      return fail(400, message);
    }
    if (message.includes("cannot exceed 60 minutes")) {
      return fail(400, message);
    }
    if (errorCode === "23503") {
      return fail(400, "Session is outdated. Log out and log in again.");
    }
    if (errorCode === "42P01") {
      return fail(500, "Database schema mismatch. Run latest migrations.");
    }
    console.error("[bookings.create] unexpected error", error);
    return fail(500, "Booking failed unexpectedly. Please retry.", {
      code: errorCode || null,
      reason: process.env.NODE_ENV === "development" ? message : null,
    });
  }
}
