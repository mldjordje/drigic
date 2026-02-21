import { eq } from "drizzle-orm";
import { z } from "zod";
import { fail, ok, readJson } from "@/lib/api/http";
import { requireAdmin } from "@/lib/auth/guards";
import { getDb, schema } from "@/lib/db/client";

export const runtime = "nodejs";

const updateSchema = z.object({
  fullName: z.string().max(255).optional(),
  gender: z.string().max(32).optional(),
  birthDate: z.string().nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
  email: z.string().email().optional(),
  phone: z.string().max(32).nullable().optional(),
});

async function getClientById(db, id) {
  const [client] = await db
    .select({
      id: schema.users.id,
      role: schema.users.role,
      email: schema.users.email,
      phone: schema.users.phone,
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
    .where(eq(schema.users.id, id))
    .limit(1);

  if (!client || !["client", "admin"].includes(client.role)) {
    return null;
  }

  return client;
}

export async function GET(request, { params }) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return auth.error;
  }

  const { id } = params || {};
  if (!id) {
    return fail(400, "Missing client id.");
  }

  const db = getDb();
  const client = await getClientById(db, id);
  if (!client) {
    return fail(404, "Client not found.");
  }

  return ok({
    ok: true,
    data: {
      id: client.id,
      email: client.email,
      phone: client.phone,
      createdAt: client.createdAt,
      lastLoginAt: client.lastLoginAt,
      profile: {
        id: client.profileId,
        fullName: client.fullName,
        gender: client.gender,
        birthDate: client.birthDate,
        avatarUrl: client.avatarUrl,
      },
    },
  });
}

export async function PATCH(request, { params }) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return auth.error;
  }

  const { id } = params || {};
  if (!id) {
    return fail(400, "Missing client id.");
  }

  const body = await readJson(request);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return fail(400, "Invalid payload", parsed.error.flatten());
  }

  const payload = parsed.data;
  if (!Object.keys(payload).length) {
    return fail(400, "No fields to update.");
  }

  const db = getDb();
  const client = await getClientById(db, id);
  if (!client) {
    return fail(404, "Client not found.");
  }

  try {
    const userUpdates = { updatedAt: new Date() };
    if (payload.email) {
      userUpdates.email = payload.email.toLowerCase().trim();
    }
    if (payload.phone !== undefined) {
      userUpdates.phone = payload.phone?.trim() || null;
    }

    if (Object.keys(userUpdates).length > 1) {
      await db.update(schema.users).set(userUpdates).where(eq(schema.users.id, id));
    }

    const profileUpdates = { updatedAt: new Date() };
    if (payload.fullName !== undefined) {
      profileUpdates.fullName = payload.fullName;
    }
    if (payload.gender !== undefined) {
      profileUpdates.gender = payload.gender;
    }
    if (payload.birthDate !== undefined) {
      profileUpdates.birthDate = payload.birthDate || null;
    }
    if (payload.avatarUrl !== undefined) {
      profileUpdates.avatarUrl = payload.avatarUrl || null;
    }

    if (Object.keys(profileUpdates).length > 1) {
      if (client.profileId) {
        await db
          .update(schema.profiles)
          .set(profileUpdates)
          .where(eq(schema.profiles.id, client.profileId));
      } else {
        await db.insert(schema.profiles).values({
          userId: id,
          fullName: profileUpdates.fullName || null,
          gender: profileUpdates.gender || null,
          birthDate: profileUpdates.birthDate || null,
          avatarUrl: profileUpdates.avatarUrl || null,
        });
      }
    }
  } catch (error) {
    const pgCode = String(error?.code || error?.cause?.code || "");
    if (pgCode === "23505") {
      return fail(409, "Email ili telefon je vec zauzet.");
    }
    throw error;
  }

  const refreshed = await getClientById(db, id);
  return ok({
    ok: true,
    data: {
      id: refreshed.id,
      email: refreshed.email,
      phone: refreshed.phone,
      createdAt: refreshed.createdAt,
      lastLoginAt: refreshed.lastLoginAt,
      profile: {
        id: refreshed.profileId,
        fullName: refreshed.fullName,
        gender: refreshed.gender,
        birthDate: refreshed.birthDate,
        avatarUrl: refreshed.avatarUrl,
      },
    },
  });
}
