CREATE TABLE "staff_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" uuid NOT NULL,
	"user_id" uuid,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"color" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"claimed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "appointment_requests" DROP CONSTRAINT "appointment_requests_staff_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "appointments" DROP CONSTRAINT "appointments_staff_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "staff_schedules" DROP CONSTRAINT "staff_schedules_staff_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "staff_services" DROP CONSTRAINT "staff_services_staff_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "staff_profiles" ADD CONSTRAINT "staff_profiles_salon_id_organization_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_profiles" ADD CONSTRAINT "staff_profiles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "staff_profiles_salon_id_phone_unique" ON "staff_profiles" USING btree ("salon_id","phone");--> statement-breakpoint
CREATE UNIQUE INDEX "staff_profiles_user_id_unique" ON "staff_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "staff_profiles_phone_active_idx" ON "staff_profiles" USING btree ("phone","active");--> statement-breakpoint
CREATE INDEX "staff_profiles_salon_id_active_idx" ON "staff_profiles" USING btree ("salon_id","active");