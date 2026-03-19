ALTER TABLE "services" ADD COLUMN "slug" varchar(255);
ALTER TABLE "services" ADD COLUMN "reminder_enabled" boolean DEFAULT false NOT NULL;
ALTER TABLE "services" ADD COLUMN "reminder_delay_days" integer DEFAULT 90 NOT NULL;
ALTER TABLE "before_after_cases" ADD COLUMN "service_id" uuid;
ALTER TABLE "treatment_records" ADD COLUMN "service_id" uuid;

UPDATE "services"
SET "slug" = regexp_replace(
  regexp_replace(lower(coalesce("name", '')), '[^a-z0-9]+', '-', 'g'),
  '(^-|-$)',
  '',
  'g'
)
WHERE "slug" IS NULL;

UPDATE "services"
SET "slug" = concat("slug", '-', substring(cast("id" as text), 1, 8))
WHERE "slug" IN (
  SELECT "slug"
  FROM "services"
  WHERE "slug" IS NOT NULL
  GROUP BY "slug"
  HAVING count(*) > 1
);

ALTER TABLE "before_after_cases"
ADD CONSTRAINT "before_after_cases_service_id_services_id_fk"
FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;

ALTER TABLE "treatment_records"
ADD CONSTRAINT "treatment_records_service_id_services_id_fk"
FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;

ALTER TABLE "services"
ADD CONSTRAINT "services_reminder_delay_days_check"
CHECK ("services"."reminder_delay_days" >= 1 AND "services"."reminder_delay_days" <= 3650);

CREATE UNIQUE INDEX "services_slug_unique" ON "services" USING btree ("slug");
