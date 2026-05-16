ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "booked_total_duration" integer;
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "booked_total_price" integer;

UPDATE "appointments"
SET
  "booked_total_duration" = "booked_service_duration",
  "booked_total_price" = "booked_service_price"
WHERE "booked_total_duration" IS NULL OR "booked_total_price" IS NULL;

ALTER TABLE "appointments" ALTER COLUMN "booked_total_duration" SET NOT NULL;
ALTER TABLE "appointments" ALTER COLUMN "booked_total_price" SET NOT NULL;

CREATE TABLE IF NOT EXISTS "appointment_addon_lines" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "salon_id" uuid NOT NULL,
  "appointment_id" uuid NOT NULL,
  "service_addon_id" uuid NOT NULL,
  "booked_addon_name" text NOT NULL,
  "booked_addon_price_delta" integer NOT NULL,
  "booked_addon_duration_delta" integer NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

DO $$ BEGIN
  ALTER TABLE "appointment_addon_lines"
    ADD CONSTRAINT "appointment_addon_lines_salon_id_salons_id_fk"
    FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "appointment_addon_lines"
    ADD CONSTRAINT "appointment_addon_lines_appointment_id_appointments_id_fk"
    FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "appointment_addon_lines"
    ADD CONSTRAINT "appointment_addon_lines_service_addon_id_service_addons_id_fk"
    FOREIGN KEY ("service_addon_id") REFERENCES "public"."service_addons"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "appointment_addon_lines_appointment_addon_unique"
  ON "appointment_addon_lines" USING btree ("appointment_id","service_addon_id");
CREATE INDEX IF NOT EXISTS "appointment_addon_lines_salon_id_appointment_idx"
  ON "appointment_addon_lines" USING btree ("salon_id","appointment_id");
CREATE INDEX IF NOT EXISTS "appointment_addon_lines_salon_id_addon_idx"
  ON "appointment_addon_lines" USING btree ("salon_id","service_addon_id");
