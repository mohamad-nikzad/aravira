CREATE TABLE IF NOT EXISTS "service_categories" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "salon_id" uuid NOT NULL,
  "name" text NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "service_families" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "salon_id" uuid NOT NULL,
  "category_id" uuid NOT NULL,
  "name" text NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "service_categories"
  ADD CONSTRAINT "service_categories_salon_id_salons_id_fk"
  FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "service_families"
  ADD CONSTRAINT "service_families_salon_id_salons_id_fk"
  FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "service_families"
  ADD CONSTRAINT "service_families_category_id_service_categories_id_fk"
  FOREIGN KEY ("category_id") REFERENCES "public"."service_categories"("id") ON DELETE restrict ON UPDATE no action;

ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "family_id" uuid;
ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "description" text;
ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "kind" text DEFAULT 'standard' NOT NULL;
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "booked_service_name" text;
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "booked_service_duration" integer;
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "booked_service_price" integer;

ALTER TABLE "services"
  ADD CONSTRAINT "services_family_id_service_families_id_fk"
  FOREIGN KEY ("family_id") REFERENCES "public"."service_families"("id") ON DELETE restrict ON UPDATE no action;

CREATE UNIQUE INDEX IF NOT EXISTS "service_categories_salon_id_name_unique"
  ON "service_categories" USING btree ("salon_id","name");
CREATE INDEX IF NOT EXISTS "service_categories_salon_id_active_idx"
  ON "service_categories" USING btree ("salon_id","active");
CREATE UNIQUE INDEX IF NOT EXISTS "service_families_salon_id_category_id_name_unique"
  ON "service_families" USING btree ("salon_id","category_id","name");
CREATE INDEX IF NOT EXISTS "service_families_salon_id_category_id_idx"
  ON "service_families" USING btree ("salon_id","category_id");
CREATE INDEX IF NOT EXISTS "service_families_salon_id_active_idx"
  ON "service_families" USING btree ("salon_id","active");
CREATE INDEX IF NOT EXISTS "services_salon_id_family_id_idx"
  ON "services" USING btree ("salon_id","family_id");

UPDATE "appointments"
SET
  "booked_service_name" = "services"."name",
  "booked_service_duration" = "services"."duration",
  "booked_service_price" = "services"."price"
FROM "services"
WHERE "appointments"."service_id" = "services"."id"
  AND "appointments"."salon_id" = "services"."salon_id"
  AND (
    "appointments"."booked_service_name" IS NULL
    OR "appointments"."booked_service_duration" IS NULL
    OR "appointments"."booked_service_price" IS NULL
  );

ALTER TABLE "appointments" ALTER COLUMN "booked_service_name" SET NOT NULL;
ALTER TABLE "appointments" ALTER COLUMN "booked_service_duration" SET NOT NULL;
ALTER TABLE "appointments" ALTER COLUMN "booked_service_price" SET NOT NULL;
ALTER TABLE "services" ALTER COLUMN "family_id" SET NOT NULL;
ALTER TABLE "services" DROP COLUMN IF EXISTS "category";
