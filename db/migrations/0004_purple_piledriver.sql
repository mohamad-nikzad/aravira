CREATE TABLE "salons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"phone" text,
	"address" text,
	"timezone" text DEFAULT 'Asia/Tehran' NOT NULL,
	"locale" text DEFAULT 'fa-IR' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO "salons" ("id", "name", "slug", "phone", "address", "timezone", "locale", "status")
VALUES ('00000000-0000-0000-0000-000000000001', 'سالن آراویرا', 'aravira', '02100000000', 'تهران', 'Asia/Tehran', 'fa-IR', 'active')
ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint
CREATE UNIQUE INDEX "salons_slug_unique" ON "salons" USING btree ("slug");
--> statement-breakpoint
ALTER TABLE "clients" DROP CONSTRAINT IF EXISTS "clients_phone_unique";
--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "salon_id" uuid DEFAULT '00000000-0000-0000-0000-000000000001' NOT NULL;
--> statement-breakpoint
ALTER TABLE "business_settings" ADD COLUMN "salon_id" uuid DEFAULT '00000000-0000-0000-0000-000000000001' NOT NULL;
--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "salon_id" uuid DEFAULT '00000000-0000-0000-0000-000000000001' NOT NULL;
--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD COLUMN "salon_id" uuid DEFAULT '00000000-0000-0000-0000-000000000001' NOT NULL;
--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "salon_id" uuid DEFAULT '00000000-0000-0000-0000-000000000001' NOT NULL;
--> statement-breakpoint
ALTER TABLE "staff_services" ADD COLUMN "salon_id" uuid DEFAULT '00000000-0000-0000-0000-000000000001' NOT NULL;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "salon_id" uuid DEFAULT '00000000-0000-0000-0000-000000000001' NOT NULL;
--> statement-breakpoint
CREATE SEQUENCE IF NOT EXISTS "business_settings_id_seq" OWNED BY "business_settings"."id";
--> statement-breakpoint
SELECT setval('"business_settings_id_seq"', COALESCE((SELECT max("id") FROM "business_settings"), 1));
--> statement-breakpoint
ALTER TABLE "business_settings" ALTER COLUMN "id" SET DEFAULT nextval('"business_settings_id_seq"');
--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "business_settings" ADD CONSTRAINT "business_settings_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "staff_services" ADD CONSTRAINT "staff_services_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "appointments" ALTER COLUMN "salon_id" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "business_settings" ALTER COLUMN "salon_id" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "clients" ALTER COLUMN "salon_id" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "push_subscriptions" ALTER COLUMN "salon_id" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "services" ALTER COLUMN "salon_id" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "staff_services" ALTER COLUMN "salon_id" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "salon_id" DROP DEFAULT;
--> statement-breakpoint
CREATE INDEX "appointments_salon_id_date_idx" ON "appointments" USING btree ("salon_id","date");
--> statement-breakpoint
CREATE INDEX "appointments_salon_id_staff_id_date_idx" ON "appointments" USING btree ("salon_id","staff_id","date");
--> statement-breakpoint
CREATE INDEX "appointments_salon_id_client_id_date_idx" ON "appointments" USING btree ("salon_id","client_id","date");
--> statement-breakpoint
CREATE UNIQUE INDEX "business_settings_salon_id_unique" ON "business_settings" USING btree ("salon_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "clients_salon_id_phone_unique" ON "clients" USING btree ("salon_id","phone");
--> statement-breakpoint
CREATE INDEX "clients_salon_id_phone_idx" ON "clients" USING btree ("salon_id","phone");
--> statement-breakpoint
CREATE UNIQUE INDEX "services_salon_id_name_unique" ON "services" USING btree ("salon_id","name");
--> statement-breakpoint
CREATE INDEX "services_salon_id_active_idx" ON "services" USING btree ("salon_id","active");
--> statement-breakpoint
CREATE INDEX "staff_services_salon_id_staff_user_id_idx" ON "staff_services" USING btree ("salon_id","staff_user_id");
--> statement-breakpoint
CREATE INDEX "staff_services_salon_id_service_id_idx" ON "staff_services" USING btree ("salon_id","service_id");
--> statement-breakpoint
CREATE INDEX "users_salon_id_role_active_idx" ON "users" USING btree ("salon_id","role","active");
