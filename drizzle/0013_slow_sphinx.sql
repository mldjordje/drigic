CREATE TABLE "site_page_views" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid,
  "session_id" varchar(128) NOT NULL,
  "pathname" varchar(512) NOT NULL,
  "referrer" text,
  "locale" varchar(16),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "site_page_views"
ADD CONSTRAINT "site_page_views_user_id_users_id_fk"
FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "site_page_views_created_idx"
ON "site_page_views" USING btree ("created_at");
--> statement-breakpoint
CREATE INDEX "site_page_views_path_idx"
ON "site_page_views" USING btree ("pathname");
--> statement-breakpoint
CREATE INDEX "site_page_views_session_idx"
ON "site_page_views" USING btree ("session_id");
