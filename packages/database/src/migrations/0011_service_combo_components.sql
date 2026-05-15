CREATE TABLE IF NOT EXISTS "service_combo_components" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "salon_id" uuid NOT NULL,
  "combo_service_id" uuid NOT NULL,
  "component_service_id" uuid NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

DO $$
BEGIN
  ALTER TABLE "service_combo_components"
    ADD CONSTRAINT "service_combo_components_salon_id_salons_id_fk"
    FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "service_combo_components"
    ADD CONSTRAINT "service_combo_components_combo_service_id_services_id_fk"
    FOREIGN KEY ("combo_service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "service_combo_components"
    ADD CONSTRAINT "service_combo_components_component_service_id_services_id_fk"
    FOREIGN KEY ("component_service_id") REFERENCES "public"."services"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "service_combo_components_combo_component_unique"
  ON "service_combo_components" USING btree ("combo_service_id","component_service_id");
CREATE INDEX IF NOT EXISTS "service_combo_components_salon_id_combo_idx"
  ON "service_combo_components" USING btree ("salon_id","combo_service_id");
CREATE INDEX IF NOT EXISTS "service_combo_components_salon_id_component_idx"
  ON "service_combo_components" USING btree ("salon_id","component_service_id");
