import { z } from "zod";
import { and, asc, eq, gt, inArray, sql } from "drizzle-orm";
import { created, fail, readJson } from "@/lib/api/http";
import { consumeRateLimit, getRequestIp } from "@/lib/api/rate-limit";
import { getSessionFromRequest } from "@/lib/auth/guards";
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
import { isPlaceholderGuestEmail, resolveGuestUser } from "@/lib/booking/guest";
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
  /**
   * Set only when the client already saw the "you already have an appointment" answer
   * and chose to move it: the old booking is cancelled and the new one created
   * in the same transaction, so the patient never ends up holding both.
   */
  replaceBookingId: z.string().uuid().optional(),
  /**
   * The other answer to "you already have an appointment": a patient booking two
   * separate treatments on two days is legitimate, so they can confirm the extra
   * appointment instead of moving the first one.
   */
  allowAdditional: z.boolean().optional(),
  guest: z
    .object({
      fullName: z.string().min(2).max(120),
      phone: z.string().min(6).max(32),
      email: z.string().email().max(255).optional().or(z.literal("")),
    })
    .optional(),
});

async function lockEmployeeSchedule(tx, employeeId) {
  await tx.execute(
    sql`SELECT pg_advisory_xact_lock(hashtextextended(${employeeId}, 0))`
  );
}

const ACTIVE_BOOKING_STATUSES = ["pending", "confirmed"];

/**
 * Ceiling on appointments a patient may hold at once. Two separate treatments on
 * two days is normal; a dozen is someone clicking through the form.
 */
const MAX_ACTIVE_BOOKINGS = 3;

/**
 * Upcoming bookings the patient is still holding.
 *
 * Slot conflicts alone do not stop a patient from stacking appointments: three
 * consecutive free slots are three valid bookings as far as the calendar is
 * concerned. Someone trying to *move* an appointment has no other button to
 * press, so they book again — and the clinic gets duplicates to clean up by
 * hand. The create route asks for this list first and refuses to silently add
 * a second one.
 */
async function findActiveBookings(executor, userId, { excludeBookingId } = {}) {
  const filters = [
    eq(schema.bookings.userId, userId),
    inArray(schema.bookings.status, ACTIVE_BOOKING_STATUSES),
    gt(schema.bookings.startsAt, new Date()),
  ];

  if (excludeBookingId) {
    filters.push(sql`${schema.bookings.id} <> ${excludeBookingId}`);
  }

  return executor
    .select({
      id: schema.bookings.id,
      status: schema.bookings.status,
      startsAt: schema.bookings.startsAt,
      endsAt: schema.bookings.endsAt,
      totalDurationMin: schema.bookings.totalDurationMin,
    })
    .from(schema.bookings)
    .where(and(...filters))
    .orderBy(asc(schema.bookings.startsAt));
}

export async function POST(request) {
  try {
    const sessionUser = await getSessionFromRequest(request);

    const body = await readJson(request);
    const parsed = payloadSchema.safeParse(body);
    if (!parsed.success) {
      return fail(400, "Invalid payload", parsed.error.flatten());
    }

    // Guests can book without an account; the request must then carry contact details.
    if (!sessionUser && !parsed.data.guest) {
      return fail(401, "Unauthorized");
    }

    if (!sessionUser) {
      const limit = consumeRateLimit(`guest-booking:${getRequestIp(request)}`, {
        limit: 5,
        windowMs: 60 * 60 * 1000,
      });
      if (!limit.allowed) {
        return fail(429, "Previse zahteva sa ove adrese. Pokusajte kasnije ili nas pozovite.");
      }
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

    // Resolved last so a rejected request never leaves a stray guest account behind.
    let bookingUser = sessionUser;
    let guestContact = null;
    if (!sessionUser) {
      const resolved = await resolveGuestUser(parsed.data.guest);
      bookingUser = resolved.user;
      guestContact = resolved.guest;
    }

    // Booking while already holding an appointment is usually an attempt to move
    // that one, so the patient is shown what they have and picks: reschedule, or
    // confirm this really is an extra appointment (two treatments, two days).
    // Nothing is created until they choose.
    const replaceBookingId = parsed.data.replaceBookingId || null;
    const allowAdditional = parsed.data.allowAdditional === true;
    const activeBookings = await findActiveBookings(db, bookingUser.id, {
      excludeBookingId: replaceBookingId,
    });
    const serializeBooking = (booking) => ({
      id: booking.id,
      status: booking.status,
      startsAt: booking.startsAt,
      endsAt: booking.endsAt,
      durationMin: booking.totalDurationMin,
    });

    if (activeBookings.length >= MAX_ACTIVE_BOOKINGS) {
      return fail(
        409,
        `Vec imate ${activeBookings.length} zakazana termina. Otkazite ili prezakazite jedan pre novog.`,
        {
          code: "TOO_MANY_BOOKINGS",
          limit: MAX_ACTIVE_BOOKINGS,
          bookings: activeBookings.map(serializeBooking),
        }
      );
    }

    if (activeBookings.length && !allowAdditional) {
      return fail(409, "Vec imate zakazan termin.", {
        code: "EXISTING_BOOKING",
        bookings: activeBookings.map(serializeBooking),
      });
    }

    let bookingToReplace = null;
    if (replaceBookingId) {
      [bookingToReplace] = await db
        .select()
        .from(schema.bookings)
        .where(
          and(
            eq(schema.bookings.id, replaceBookingId),
            eq(schema.bookings.userId, bookingUser.id)
          )
        )
        .limit(1);

      if (!bookingToReplace) {
        return fail(404, "Termin koji menjate nije pronadjen.");
      }

      if (!ACTIVE_BOOKING_STATUSES.includes(bookingToReplace.status)) {
        return fail(409, `Termin se ne moze prezakazati u statusu '${bookingToReplace.status}'.`);
      }
    }

    const guestNoteParts = guestContact
      ? [
          `Gost: ${guestContact.fullName}`,
          `Telefon: ${guestContact.phone}`,
          guestContact.email ? `Email: ${guestContact.email}` : null,
        ].filter(Boolean)
      : [];
    const replacedFromNote = bookingToReplace
      ? `Prezakazano sa termina ${new Date(bookingToReplace.startsAt).toLocaleString("sr-RS", {
          timeZone: "Europe/Belgrade",
        })}`
      : "";
    const bookingNotes =
      [guestNoteParts.join(" | "), replacedFromNote, parsed.data.notes || ""]
        .filter(Boolean)
        .join("\n") || null;
    const clientEmail =
      guestContact?.email ||
      (isPlaceholderGuestEmail(bookingUser.email) ? "" : bookingUser.email || "");
    const clientPhone = guestContact?.phone || bookingUser.phone || null;
    const clientDisplay = guestContact?.fullName || clientEmail || bookingUser.id;

    let createdBooking = null;
    await db.transaction(async (tx) => {
      await lockEmployeeSchedule(tx, employee.id);

      const conflicts = await findConflicts({
        employeeId: employee.id,
        startsAt: startAt,
        endsAt,
        // The appointment being moved must not block its own replacement.
        excludeBookingId: bookingToReplace?.id,
        tx,
      });

      if (conflicts.length) {
        throw new Error("Requested slot is no longer available.");
      }

      if (bookingToReplace) {
        const [stillActive] = await tx
          .select({ status: schema.bookings.status })
          .from(schema.bookings)
          .where(eq(schema.bookings.id, bookingToReplace.id))
          .limit(1);

        if (!stillActive || !ACTIVE_BOOKING_STATUSES.includes(stillActive.status)) {
          throw new Error("Booking to replace is no longer active.");
        }

        await tx
          .update(schema.bookings)
          .set({
            status: "cancelled",
            cancelledAt: new Date(),
            cancellationReason: "Prezakazano na novi termin",
            updatedAt: new Date(),
          })
          .where(eq(schema.bookings.id, bookingToReplace.id));

        try {
          await tx.insert(schema.bookingStatusLog).values({
            bookingId: bookingToReplace.id,
            previousStatus: stillActive.status,
            nextStatus: "cancelled",
            changedByUserId: bookingUser.id,
            note: "Cancelled because the patient rescheduled to a new slot",
          });
        } catch (logError) {
          console.error("[bookings.create] replace status log insert failed", logError);
        }
      }

      [createdBooking] = await tx
        .insert(schema.bookings)
        .values({
          userId: bookingUser.id,
          employeeId: employee.id,
          startsAt: startAt,
          endsAt,
          status: "pending",
          totalDurationMin: quote.totalDurationMin,
          totalPriceRsd: quote.totalPriceRsd,
          primaryServiceColor: quote.primaryServiceColor,
          notes: bookingNotes,
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
          changedByUserId: bookingUser.id,
          note: guestContact
            ? "Guest booking created online (awaiting admin confirmation)"
            : "Booking created online (awaiting admin confirmation)",
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
      const clientEmailPayload = clientEmail
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
            notes: bookingNotes,
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
              notes: bookingNotes,
              clientName: clientDisplay,
              clientEmail: clientEmail || null,
              clientPhone: clientPhone,
            }),
          })
        : { sent: false, reason: "ADMIN_BOOKING_NOTIFY_EMAIL missing" };

      if (!notifyResult?.sent) {
        console.error(
          "[bookings.create] admin inbox email not sent",
          notifyResult?.reason || "unknown reason"
        );
      }

      if (clientEmail) {
        await deliverBookingNotification({
          db,
          userId: bookingUser.id,
          email: clientEmail,
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
        clientEmail: clientEmail || bookingUser.id,
        clientPhone: clientPhone,
        startsAtLabel,
        startsAt: createdBooking.startsAt,
        serviceSummary,
        durationMin: quote.totalDurationMin,
        priceRsd: quote.totalPriceRsd,
        notes: bookingNotes,
      });
    } catch (notifyError) {
      console.error("[bookings.create] notification pipeline failed", notifyError);
    }

    return created({
      ok: true,
      booking: createdBooking,
      replacedBookingId: bookingToReplace?.id || null,
      quote,
    });
  } catch (error) {
    const errorCode = String(error?.code || error?.cause?.code || "");
    const message = error?.message || "Booking failed.";
    if (message.includes("Requested slot is no longer available")) {
      return fail(409, message);
    }
    if (message.includes("Booking to replace is no longer active")) {
      return fail(409, "Termin koji menjate je u medjuvremenu promenjen. Osvezite stranicu.");
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
