import dotenv from "dotenv";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../lib/db/schema.js";

dotenv.config({ path: ".env.local" });

const connectionString =
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL;

if (!connectionString) {
  throw new Error("Missing database URL for seed script.");
}

const db = drizzle({ client: neon(connectionString), schema });

async function seed() {
  const [admin] = await db
    .insert(schema.users)
    .values({
      email: "admin@drigic.com",
      role: "admin",
    })
    .onConflictDoNothing({ target: schema.users.email })
    .returning();

  if (!admin) {
    console.log("Admin already seeded.");
  }

  await db
    .insert(schema.employees)
    .values({
      fullName: "Dr Nikola Igić",
      slug: "nikola-igic",
      isActive: true,
    })
    .onConflictDoNothing({ target: schema.employees.slug });

  const existingCategories = await db.select().from(schema.serviceCategories);
  if (!existingCategories.length) {
    await db.insert(schema.serviceCategories).values([
      { name: "Akcije i paketi", sortOrder: 0 },
      { name: "Lice", sortOrder: 1 },
      { name: "Telo", sortOrder: 2 },
      { name: "Anti-age", sortOrder: 3 },
    ]);
  }

  const [settings] = await db.select().from(schema.clinicSettings).limit(1);
  if (!settings) {
    await db.insert(schema.clinicSettings).values({
      slotMinutes: Number(process.env.CLINIC_SLOT_MINUTES || 15),
      bookingWindowDays: Number(process.env.CLINIC_BOOKING_WINDOW_DAYS || 31),
      workdayStart: process.env.CLINIC_WORKDAY_START || "09:00",
      workdayEnd: process.env.CLINIC_WORKDAY_END || "20:00",
    });
  }

  const [vip] = await db.select().from(schema.vipSettings).limit(1);
  if (!vip) {
    await db.insert(schema.vipSettings).values({
      basePriceRsd: 0,
      notes: "Default VIP settings",
    });
  }

  console.log("Seed completed.");
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
