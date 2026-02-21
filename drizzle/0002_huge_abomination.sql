CREATE TYPE "public"."service_kind" AS ENUM('single', 'package');--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"user_agent" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_package_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"package_service_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "clinic_settings" ALTER COLUMN "workday_start" SET DEFAULT '16:00';--> statement-breakpoint
ALTER TABLE "clinic_settings" ALTER COLUMN "workday_end" SET DEFAULT '21:00';--> statement-breakpoint
ALTER TABLE "booking_items" ADD COLUMN "quantity" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "booking_items" ADD COLUMN "unit_label" varchar(24) DEFAULT 'kom' NOT NULL;--> statement-breakpoint
ALTER TABLE "booking_items" ADD COLUMN "service_color_snapshot" varchar(16);--> statement-breakpoint
ALTER TABLE "booking_items" ADD COLUMN "source_package_service_id" uuid;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "primary_service_color" varchar(16);--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "kind" "service_kind" DEFAULT 'single' NOT NULL;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "color_hex" varchar(16) DEFAULT '#8e939b' NOT NULL;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "supports_ml" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "max_ml" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "extra_ml_discount_percent" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_package_items" ADD CONSTRAINT "service_package_items_package_service_id_services_id_fk" FOREIGN KEY ("package_service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_package_items" ADD CONSTRAINT "service_package_items_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "push_subscriptions_user_idx" ON "push_subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "push_subscriptions_endpoint_unique" ON "push_subscriptions" USING btree ("endpoint");--> statement-breakpoint
CREATE INDEX "service_package_items_package_idx" ON "service_package_items" USING btree ("package_service_id");--> statement-breakpoint
CREATE UNIQUE INDEX "service_package_items_unique" ON "service_package_items" USING btree ("package_service_id","service_id");--> statement-breakpoint
ALTER TABLE "booking_items" ADD CONSTRAINT "booking_items_source_package_service_id_services_id_fk" FOREIGN KEY ("source_package_service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_max_ml_check" CHECK ("services"."max_ml" >= 1);--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_ml_discount_check" CHECK ("services"."extra_ml_discount_percent" >= 0 AND "services"."extra_ml_discount_percent" <= 40);