CREATE TABLE "sunday_availability" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "sunday_date" date NOT NULL,
  "start_time" varchar(5) NOT NULL,
  "end_time" varchar(5) NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "note" text,
  "created_by_user_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX "sunday_availability_sunday_date_unique"
ON "sunday_availability" USING btree ("sunday_date");

CREATE INDEX "sunday_availability_sunday_date_idx"
ON "sunday_availability" USING btree ("sunday_date");

CREATE INDEX "sunday_availability_active_idx"
ON "sunday_availability" USING btree ("is_active");

ALTER TABLE "sunday_availability"
ADD CONSTRAINT "sunday_availability_created_by_user_id_users_id_fk"
FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
