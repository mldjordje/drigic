import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { fail, ok, readJson } from "@/lib/api/http";
import { sendTransactionalEmail } from "@/lib/auth/email";
import { requireUser } from "@/lib/auth/guards";
import { getDb, schema } from "@/lib/db/client";
import { hasCancelWindow } from "@/lib/booking/engine";
import { env } from "@/lib/env";
import {
  deliverBookingAlertToAdmins,
  deliverBookingNotification,
} from "@/lib/notifications/delivery";
import {
  buildAdminBookingEmail,
  buildClientBookingEmail,
} from "@/lib/notifications/booking-email";

export const runtime = "nodejs";

const payloadSchema = z.object({
  reason: z.string().max(400).optional(),
});

function formatServiceSummaryItem(row) {
  const quantity = Number(row.quantity || 1);
  if (quantity <= 1) {
    return row.serviceName || "Usluga";
  }
  return `${row.serviceName || "Usluga"} (${quantity} ${row.unitLabel || "kom"})`;
}

function isPlaceholderEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase()
    .endsWith("@drigic.local");
}

async function loadBookingContext(db, bookingId) {
  const rows = await db
    .select({
      booking: schema.bookings,
      userEmail: schema.users.email,
      userPhone: schema.users.phone,
      profileName: schema.profiles.fullName,
      serviceName: schema.bookingItems.serviceNameSnapshot,
      quantity: schema.bookingItems.quantity,
      unitLabel: schema.bookingItems.unitLabel,
    })
    .from(schema.bookings)
    .leftJoin(schema.users, eq(schema.users.id, schema.bookings.userId))
    .leftJoin(schema.profiles, eq(schema.profiles.userId, schema.bookings.userId))
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
    clientName:
      String(first.profileName || "").trim() ||
      String(first.userPhone || "").trim() ||
      String(first.userEmail || "").trim() ||
      "Klijent",
    clientEmail: String(first.userEmail || "").trim(),
    clientPhone: String(first.userPhone || "").trim(),
    serviceSummary: services.join(", "),
  };
}

export async function PATCH(request, { params }) {
  const auth = await requireUser(request);
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
  const [booking] = await db
    .select()
    .from(schema.bookings)
    .where(and(eq(schema.bookings.id, id), eq(schema.bookings.userId, auth.user.id)))
    .limit(1);

  if (!booking) {
    return fail(404, "Booking not found.");
  }

  if (!["pending", "confirmed"].includes(booking.status)) {
    return fail(409, `Booking cannot be cancelled in status '${booking.status}'.`);
  }

  if (!hasCancelWindow(booking.startsAt)) {
    return fail(400, "Cancellation is allowed at least 2 hours before appointment.");
  }

  const now = new Date();
  await db
    .update(schema.bookings)
    .set({
      status: "cancelled",
      cancelledAt: now,
      cancellationReason: parsed.data.reason || null,
      updatedAt: now,
    })
    .where(eq(schema.bookings.id, booking.id));

  await db.insert(schema.bookingStatusLog).values({
    bookingId: booking.id,
    previousStatus: booking.status,
    nextStatus: "cancelled",
    changedByUserId: auth.user.id,
    note: parsed.data.reason || "Cancelled by client",
  });

  try {
    const context = await loadBookingContext(db, booking.id);
    if (context) {
      const startsAtLabel = new Date(context.startsAt).toLocaleString("sr-RS", {
        timeZone: "Europe/Belgrade",
      });
      const clientEmailPayload =
        context.clientEmail && !isPlaceholderEmail(context.clientEmail)
          ? buildClientBookingEmail({
              subject: "Potvrda otkazivanja termina",
              previewText: "Uspesno ste otkazali svoj termin",
              heading: "Termin je otkazan",
              intro:
                "Vas zahtev za otkazivanje je uspesno evidentiran i termin je oslobodjen za novo zakazivanje.",
              startsAt: context.startsAt,
              serviceSummary: context.serviceSummary,
              durationMin: context.totalDurationMin,
              priceRsd: context.totalPriceRsd,
              statusLabel: "Otkazan",
              notes: context.notes,
              cancellationReason: context.cancellationReason,
            })
          : null;

      if (clientEmailPayload && context.clientEmail) {
        await deliverBookingNotification({
          db,
          userId: context.userId,
          email: context.clientEmail,
          type: "booking_cancelled",
          title: "Termin je otkazan",
          message: `Vas termin za ${startsAtLabel} je uspesno otkazan.`,
          bookingId: context.id,
          scheduledFor: context.startsAt,
          dedupe: false,
          emailPayload: clientEmailPayload,
        });
      }

      const adminEmailPayload = buildAdminBookingEmail({
        subject: "Klijent je otkazao termin",
        previewText: "Termin je otkazan od strane klijenta",
        heading: "Klijent je otkazao termin",
        intro:
          "Klijent je otkazao termin preko svog naloga. Slot je odmah oslobodjen u booking formi i admin kalendaru.",
        startsAt: context.startsAt,
        serviceSummary: context.serviceSummary,
        durationMin: context.totalDurationMin,
        priceRsd: context.totalPriceRsd,
        statusLabel: "Otkazan",
        notes: context.notes,
        cancellationReason: context.cancellationReason,
        clientName: context.clientName,
        clientEmail: context.clientEmail,
        clientPhone: context.clientPhone,
        actorLabel: "Klijent",
      });

      const inboxEmail = String(env.ADMIN_BOOKING_NOTIFY_EMAIL || "").trim();
      if (inboxEmail) {
        const inboxResult = await sendTransactionalEmail({
          to: inboxEmail,
          ...adminEmailPayload,
        });
        if (!inboxResult?.sent) {
          console.error(
            "[bookings.cancel] admin inbox email not sent",
            inboxResult?.reason || "unknown reason"
          );
        }
      }

      await deliverBookingAlertToAdmins({
        db,
        bookingId: context.id,
        type: "client_booking_cancelled",
        title: "Klijent je otkazao termin",
        message: `Klijent ${context.clientName} je otkazao termin ${startsAtLabel}.`,
        url: "/admin/kalendar",
        dedupe: true,
        emailPayload: adminEmailPayload,
      });
    }
  } catch (notifyError) {
    console.error("[bookings.cancel] notification pipeline failed", notifyError);
  }

  return ok({ ok: true, bookingId: booking.id, status: "cancelled" });
}
