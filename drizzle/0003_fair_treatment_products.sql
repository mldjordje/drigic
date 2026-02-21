CREATE TABLE "treatment_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"logo_url" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "treatment_records" ADD COLUMN "product_id" uuid;
--> statement-breakpoint
ALTER TABLE "treatment_records" ADD CONSTRAINT "treatment_records_product_id_treatment_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."treatment_products"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "treatment_products_name_unique" ON "treatment_products" USING btree ("name");
--> statement-breakpoint
CREATE INDEX "treatment_products_sort_idx" ON "treatment_products" USING btree ("sort_order");
--> statement-breakpoint
CREATE INDEX "treatment_records_product_idx" ON "treatment_records" USING btree ("product_id");
