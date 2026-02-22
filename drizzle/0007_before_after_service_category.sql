ALTER TABLE "before_after_cases"
ADD COLUMN "service_category" varchar(120);

CREATE INDEX IF NOT EXISTS "before_after_service_category_idx"
ON "before_after_cases" USING btree ("service_category");
