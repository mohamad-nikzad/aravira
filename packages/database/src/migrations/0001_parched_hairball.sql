ALTER TABLE "services" DROP CONSTRAINT "services_family_id_service_families_id_fk";
--> statement-breakpoint
ALTER TABLE "services" ALTER COLUMN "family_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "category_id" uuid;--> statement-breakpoint
UPDATE "services" AS s SET "category_id" = f."category_id" FROM "service_families" AS f WHERE s."family_id" = f."id" AND s."category_id" IS NULL;--> statement-breakpoint
ALTER TABLE "services" ALTER COLUMN "category_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_category_id_service_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."service_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_family_id_service_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."service_families"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "services_salon_id_category_id_idx" ON "services" USING btree ("salon_id","category_id");
