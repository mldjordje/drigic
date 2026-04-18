CREATE TABLE "saturday_afternoon_activations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "start_date" date NOT NULL,
  "end_date" date NOT NULL,
  "start_time" varchar(5) NOT NULL,
  "end_time" varchar(5) NOT NULL,
  "note" text,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_by_user_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "saturday_afternoon_activations_date_range_check" CHECK ("saturday_afternoon_activations"."start_date" <= "saturday_afternoon_activations"."end_date")
);
--> statement-breakpoint
ALTER TABLE "saturday_afternoon_activations"
ADD CONSTRAINT "saturday_afternoon_activations_created_by_user_id_users_id_fk"
FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "saturday_afternoon_activations_start_date_idx"
ON "saturday_afternoon_activations" USING btree ("start_date");
--> statement-breakpoint
CREATE INDEX "saturday_afternoon_activations_end_date_idx"
ON "saturday_afternoon_activations" USING btree ("end_date");
--> statement-breakpoint
CREATE INDEX "saturday_afternoon_activations_active_idx"
ON "saturday_afternoon_activations" USING btree ("is_active");

