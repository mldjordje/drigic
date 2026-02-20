require("dotenv").config({ path: ".env.local" });

const connectionString =
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL;

if (!connectionString) {
  throw new Error(
    "Missing POSTGRES_URL/DATABASE_URL in environment for Drizzle configuration."
  );
}

/** @type { import("drizzle-kit").Config } */
module.exports = {
  schema: "./lib/db/schema.js",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
  },
  strict: true,
  verbose: true,
};
