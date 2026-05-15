CREATE TABLE IF NOT EXISTS "service_addons" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "salon_id" uuid NOT NULL,
  "name" text NOT NULL,
  "price_delta" integer DEFAULT 0 NOT NULL,
  "duration_delta" integer DEFAULT 0 NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "description" text,
  "color" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

DO $$
BEGIN
  ALTER TABLE "service_addons"
    ADD CONSTRAINT "service_addons_salon_id_salons_id_fk"
    FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "service_addons_salon_id_active_idx"
  ON "service_addons" USING btree ("salon_id","active");
CREATE INDEX IF NOT EXISTS "service_addons_salon_id_sort_idx"
  ON "service_addons" USING btree ("salon_id","sort_order","name");

CREATE TABLE IF NOT EXISTS "service_addon_category_scopes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "salon_id" uuid NOT NULL,
  "addon_id" uuid NOT NULL,
  "scope_id" uuid NOT NULL
);

DO $$
BEGIN
  ALTER TABLE "service_addon_category_scopes"
    ADD CONSTRAINT "service_addon_category_scopes_salon_id_salons_id_fk"
    FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "service_addon_category_scopes"
    ADD CONSTRAINT "service_addon_category_scopes_addon_id_service_addons_id_fk"
    FOREIGN KEY ("addon_id") REFERENCES "public"."service_addons"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "service_addon_category_scopes"
    ADD CONSTRAINT "service_addon_category_scopes_scope_id_service_categories_id_fk"
    FOREIGN KEY ("scope_id") REFERENCES "public"."service_categories"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "service_addon_category_scopes_addon_scope_unique"
  ON "service_addon_category_scopes" USING btree ("addon_id","scope_id");
CREATE INDEX IF NOT EXISTS "service_addon_category_scopes_salon_id_addon_idx"
  ON "service_addon_category_scopes" USING btree ("salon_id","addon_id");
CREATE INDEX IF NOT EXISTS "service_addon_category_scopes_salon_id_scope_idx"
  ON "service_addon_category_scopes" USING btree ("salon_id","scope_id");

CREATE TABLE IF NOT EXISTS "service_addon_family_scopes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "salon_id" uuid NOT NULL,
  "addon_id" uuid NOT NULL,
  "scope_id" uuid NOT NULL
);

DO $$
BEGIN
  ALTER TABLE "service_addon_family_scopes"
    ADD CONSTRAINT "service_addon_family_scopes_salon_id_salons_id_fk"
    FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "service_addon_family_scopes"
    ADD CONSTRAINT "service_addon_family_scopes_addon_id_service_addons_id_fk"
    FOREIGN KEY ("addon_id") REFERENCES "public"."service_addons"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "service_addon_family_scopes"
    ADD CONSTRAINT "service_addon_family_scopes_scope_id_service_families_id_fk"
    FOREIGN KEY ("scope_id") REFERENCES "public"."service_families"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "service_addon_family_scopes_addon_scope_unique"
  ON "service_addon_family_scopes" USING btree ("addon_id","scope_id");
CREATE INDEX IF NOT EXISTS "service_addon_family_scopes_salon_id_addon_idx"
  ON "service_addon_family_scopes" USING btree ("salon_id","addon_id");
CREATE INDEX IF NOT EXISTS "service_addon_family_scopes_salon_id_scope_idx"
  ON "service_addon_family_scopes" USING btree ("salon_id","scope_id");

CREATE TABLE IF NOT EXISTS "service_addon_service_scopes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "salon_id" uuid NOT NULL,
  "addon_id" uuid NOT NULL,
  "scope_id" uuid NOT NULL
);

DO $$
BEGIN
  ALTER TABLE "service_addon_service_scopes"
    ADD CONSTRAINT "service_addon_service_scopes_salon_id_salons_id_fk"
    FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "service_addon_service_scopes"
    ADD CONSTRAINT "service_addon_service_scopes_addon_id_service_addons_id_fk"
    FOREIGN KEY ("addon_id") REFERENCES "public"."service_addons"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "service_addon_service_scopes"
    ADD CONSTRAINT "service_addon_service_scopes_scope_id_services_id_fk"
    FOREIGN KEY ("scope_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "service_addon_service_scopes_addon_scope_unique"
  ON "service_addon_service_scopes" USING btree ("addon_id","scope_id");
CREATE INDEX IF NOT EXISTS "service_addon_service_scopes_salon_id_addon_idx"
  ON "service_addon_service_scopes" USING btree ("salon_id","addon_id");
CREATE INDEX IF NOT EXISTS "service_addon_service_scopes_salon_id_scope_idx"
  ON "service_addon_service_scopes" USING btree ("salon_id","scope_id");
