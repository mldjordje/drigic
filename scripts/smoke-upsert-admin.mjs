import dotenv from "dotenv";
import { neon } from "@neondatabase/serverless";

dotenv.config({ path: ".env.local" });

const url =
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL;

if (!url) {
  throw new Error("Missing DB URL");
}

const sql = neon(url);
const rows = await sql`
  INSERT INTO users (email, role, created_at, updated_at)
  VALUES ('smoke.admin@drigic.local', 'admin', NOW(), NOW())
  ON CONFLICT (email)
  DO UPDATE SET role = 'admin', updated_at = NOW()
  RETURNING id, email, role
`;

console.log(JSON.stringify(rows[0]));
