import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const connectionString =
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL;

if (!connectionString) {
  console.error("Missing database URL in environment");
  process.exit(1);
}

const sql = neon(connectionString);

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "blog_posts" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "slug" varchar(255) NOT NULL,
    "title" varchar(255) NOT NULL,
    "excerpt" text,
    "content" text NOT NULL,
    "category" varchar(80),
    "featured_image_url" text,
    "seo_title" varchar(255),
    "seo_description" text,
    "seo_keywords" text[],
    "is_published" boolean DEFAULT false NOT NULL,
    "published_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "blog_posts_slug_unique" ON "blog_posts" USING btree ("slug")`,
  `CREATE INDEX IF NOT EXISTS "blog_posts_published_idx" ON "blog_posts" USING btree ("is_published","published_at")`,
  `CREATE INDEX IF NOT EXISTS "blog_posts_category_idx" ON "blog_posts" USING btree ("category")`,
];

try {
  console.log("Applying blog_posts migration...");
  for (const stmt of STATEMENTS) {
    await sql.query(stmt);
  }
  console.log("✓ blog_posts table and indexes created successfully");
} catch (err) {
  console.error("Migration failed:", err.message);
  process.exit(1);
}
