import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";

const GUEST_EMAIL_DOMAIN = "gost.drigic.rs";

export function normalizeGuestPhone(raw) {
  const value = String(raw || "").trim();
  if (!value) {
    return "";
  }

  const hasPlus = value.startsWith("+");
  const digits = value.replace(/\D/g, "");
  if (!digits) {
    return "";
  }

  return hasPlus ? `+${digits}` : digits;
}

export function normalizeGuestEmail(raw) {
  return String(raw || "").trim().toLowerCase();
}

export function normalizeGuestName(raw) {
  return String(raw || "").replace(/\s+/g, " ").trim();
}

function placeholderEmail(phone) {
  const digits = phone.replace(/\D/g, "");
  return `gost.${digits}@${GUEST_EMAIL_DOMAIN}`;
}

export function isPlaceholderGuestEmail(email) {
  return String(email || "").endsWith(`@${GUEST_EMAIL_DOMAIN}`);
}

/**
 * Bookings require a user row, so a guest is mapped onto one:
 * an existing account matching the e-mail or phone is reused, otherwise a
 * lightweight client record is created. If the guest later signs in with the
 * same Google e-mail they see the booking in their account.
 */
export async function resolveGuestUser({ fullName, phone, email }) {
  const db = getDb();
  const normalizedPhone = normalizeGuestPhone(phone);
  const normalizedEmail = normalizeGuestEmail(email);
  const normalizedName = normalizeGuestName(fullName);

  if (!normalizedPhone) {
    throw new Error("Guest phone is required.");
  }

  let user = null;

  if (normalizedEmail) {
    [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, normalizedEmail))
      .limit(1);
  }

  if (!user) {
    [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.phone, normalizedPhone))
      .limit(1);
  }

  if (!user) {
    [user] = await db
      .insert(schema.users)
      .values({
        email: normalizedEmail || placeholderEmail(normalizedPhone),
        phone: normalizedPhone,
        role: "client",
      })
      .returning();
  } else if (!user.phone) {
    try {
      const [updated] = await db
        .update(schema.users)
        .set({ phone: normalizedPhone, updatedAt: new Date() })
        .where(eq(schema.users.id, user.id))
        .returning();
      user = updated || user;
    } catch (error) {
      // Phone already taken by another account - keep the existing record.
      console.error("[booking.guest] phone update skipped", error);
    }
  }

  if (normalizedName) {
    try {
      const [profile] = await db
        .select({ id: schema.profiles.id, fullName: schema.profiles.fullName })
        .from(schema.profiles)
        .where(eq(schema.profiles.userId, user.id))
        .limit(1);

      if (!profile) {
        await db
          .insert(schema.profiles)
          .values({ userId: user.id, fullName: normalizedName });
      } else if (!profile.fullName) {
        await db
          .update(schema.profiles)
          .set({ fullName: normalizedName, updatedAt: new Date() })
          .where(eq(schema.profiles.id, profile.id));
      }
    } catch (error) {
      console.error("[booking.guest] profile upsert failed", error);
    }
  }

  return {
    user,
    guest: {
      fullName: normalizedName,
      phone: normalizedPhone,
      email: normalizedEmail,
    },
  };
}
