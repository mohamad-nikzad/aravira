CREATE TABLE "account" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "appointment_addon_lines" (
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
--> statement-breakpoint
CREATE TABLE "appointment_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"staff_id" uuid,
	"requested_date" text NOT NULL,
	"requested_start_time" text NOT NULL,
	"requested_end_time" text NOT NULL,
	"customer_name" text NOT NULL,
	"customer_phone" text NOT NULL,
	"notes" text,
	"booked_service_name" text NOT NULL,
	"booked_service_duration" integer NOT NULL,
	"booked_service_price" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"payment_status" text DEFAULT 'none' NOT NULL,
	"deposit_amount" integer,
	"confirmation_token" uuid DEFAULT gen_random_uuid() NOT NULL,
	"reviewed_by_user_id" uuid,
	"reviewed_at" timestamp with time zone,
	"rejection_reason" text,
	"appointment_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"staff_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"date" text NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"booked_service_name" text NOT NULL,
	"booked_service_duration" integer NOT NULL,
	"booked_service_price" integer NOT NULL,
	"booked_total_duration" integer NOT NULL,
	"booked_total_price" integer NOT NULL,
	"status" text NOT NULL,
	"notes" text,
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"salon_id" uuid NOT NULL,
	"working_start" text DEFAULT '09:00' NOT NULL,
	"working_end" text DEFAULT '19:00' NOT NULL,
	"slot_duration_minutes" integer DEFAULT 30 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catalog_presets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"tree" jsonb NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_follow_ups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"due_date" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "client_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"label" text NOT NULL,
	"color" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" uuid NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"is_placeholder" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"email" text NOT NULL,
	"role" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"inviter_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" uuid NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"phone" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"notification_id" uuid NOT NULL,
	"channel" text NOT NULL,
	"status" text NOT NULL,
	"provider" text,
	"provider_message_id" text,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sent_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"salon_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"appointment_alerts_enabled" boolean DEFAULT true NOT NULL,
	"local_alerts_enabled" boolean DEFAULT true NOT NULL,
	"sms_alerts_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_preferences_salon_id_user_id_pk" PRIMARY KEY("salon_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"route" text NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"logo" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" text,
	CONSTRAINT "organization_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "preset_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" uuid NOT NULL,
	"preset_id" uuid NOT NULL,
	"applied_at" timestamp with time zone DEFAULT now() NOT NULL,
	"imported_variant_ids" uuid[] DEFAULT '{}' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "public_submit_rate_limits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ip" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "push_subscriptions_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
CREATE TABLE "resources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "salon_member" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"display_name" text,
	"color" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "salon_onboarding" (
	"salon_id" uuid PRIMARY KEY NOT NULL,
	"profile_confirmed_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"skipped_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "salon_profile" (
	"organization_id" uuid PRIMARY KEY NOT NULL,
	"timezone" text DEFAULT 'Asia/Tehran' NOT NULL,
	"locale" text DEFAULT 'fa-IR' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"phone" text,
	"address" text
);
--> statement-breakpoint
CREATE TABLE "salon_public_settings" (
	"salon_id" uuid PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"bio_text" text,
	"theme_id" text DEFAULT 'rose' NOT NULL,
	"layout_id" text DEFAULT 'agenda' NOT NULL,
	"appointment_requests_enabled" boolean DEFAULT true NOT NULL,
	"deposit_policy" jsonb,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_addon_category_scopes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" uuid NOT NULL,
	"addon_id" uuid NOT NULL,
	"scope_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_addon_family_scopes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" uuid NOT NULL,
	"addon_id" uuid NOT NULL,
	"scope_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_addon_service_scopes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" uuid NOT NULL,
	"addon_id" uuid NOT NULL,
	"scope_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_addons" (
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
--> statement-breakpoint
CREATE TABLE "service_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" uuid NOT NULL,
	"name" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_combo_components" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" uuid NOT NULL,
	"combo_service_id" uuid NOT NULL,
	"component_service_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_families" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"name" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_public_visibility" (
	"salon_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"visible" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "service_public_visibility_salon_id_service_id_pk" PRIMARY KEY("salon_id","service_id")
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" uuid NOT NULL,
	"family_id" uuid NOT NULL,
	"name" text NOT NULL,
	"duration" integer NOT NULL,
	"price" integer NOT NULL,
	"color" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"description" text,
	"kind" text DEFAULT 'standard' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" uuid NOT NULL,
	"active_organization_id" uuid,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "staff_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" uuid NOT NULL,
	"staff_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"working_start" text NOT NULL,
	"working_end" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_services" (
	"staff_user_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"salon_id" uuid NOT NULL,
	CONSTRAINT "staff_services_staff_user_id_service_id_pk" PRIMARY KEY("staff_user_id","service_id")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"username" text,
	"display_username" text,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_addon_lines" ADD CONSTRAINT "appointment_addon_lines_salon_id_organization_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_addon_lines" ADD CONSTRAINT "appointment_addon_lines_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_addon_lines" ADD CONSTRAINT "appointment_addon_lines_service_addon_id_service_addons_id_fk" FOREIGN KEY ("service_addon_id") REFERENCES "public"."service_addons"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_requests" ADD CONSTRAINT "appointment_requests_salon_id_organization_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_requests" ADD CONSTRAINT "appointment_requests_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_requests" ADD CONSTRAINT "appointment_requests_staff_id_user_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_requests" ADD CONSTRAINT "appointment_requests_reviewed_by_user_id_user_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_requests" ADD CONSTRAINT "appointment_requests_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_salon_id_organization_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."organization"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_staff_id_user_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_settings" ADD CONSTRAINT "business_settings_salon_id_organization_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_follow_ups" ADD CONSTRAINT "client_follow_ups_salon_id_organization_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_follow_ups" ADD CONSTRAINT "client_follow_ups_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_tags" ADD CONSTRAINT "client_tags_salon_id_organization_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_tags" ADD CONSTRAINT "client_tags_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_salon_id_organization_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."organization"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviter_id_user_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_salon_id_organization_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_notification_id_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_salon_id_organization_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_salon_id_organization_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preset_applications" ADD CONSTRAINT "preset_applications_salon_id_organization_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preset_applications" ADD CONSTRAINT "preset_applications_preset_id_catalog_presets_id_fk" FOREIGN KEY ("preset_id") REFERENCES "public"."catalog_presets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_salon_id_organization_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_salon_id_organization_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salon_member" ADD CONSTRAINT "salon_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salon_member" ADD CONSTRAINT "salon_member_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salon_onboarding" ADD CONSTRAINT "salon_onboarding_salon_id_organization_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salon_profile" ADD CONSTRAINT "salon_profile_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salon_public_settings" ADD CONSTRAINT "salon_public_settings_salon_id_organization_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_addon_category_scopes" ADD CONSTRAINT "service_addon_category_scopes_salon_id_organization_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_addon_category_scopes" ADD CONSTRAINT "service_addon_category_scopes_addon_id_service_addons_id_fk" FOREIGN KEY ("addon_id") REFERENCES "public"."service_addons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_addon_category_scopes" ADD CONSTRAINT "service_addon_category_scopes_scope_id_service_categories_id_fk" FOREIGN KEY ("scope_id") REFERENCES "public"."service_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_addon_family_scopes" ADD CONSTRAINT "service_addon_family_scopes_salon_id_organization_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_addon_family_scopes" ADD CONSTRAINT "service_addon_family_scopes_addon_id_service_addons_id_fk" FOREIGN KEY ("addon_id") REFERENCES "public"."service_addons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_addon_family_scopes" ADD CONSTRAINT "service_addon_family_scopes_scope_id_service_families_id_fk" FOREIGN KEY ("scope_id") REFERENCES "public"."service_families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_addon_service_scopes" ADD CONSTRAINT "service_addon_service_scopes_salon_id_organization_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_addon_service_scopes" ADD CONSTRAINT "service_addon_service_scopes_addon_id_service_addons_id_fk" FOREIGN KEY ("addon_id") REFERENCES "public"."service_addons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_addon_service_scopes" ADD CONSTRAINT "service_addon_service_scopes_scope_id_services_id_fk" FOREIGN KEY ("scope_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_addons" ADD CONSTRAINT "service_addons_salon_id_organization_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_categories" ADD CONSTRAINT "service_categories_salon_id_organization_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_combo_components" ADD CONSTRAINT "service_combo_components_salon_id_organization_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_combo_components" ADD CONSTRAINT "service_combo_components_combo_service_id_services_id_fk" FOREIGN KEY ("combo_service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_combo_components" ADD CONSTRAINT "service_combo_components_component_service_id_services_id_fk" FOREIGN KEY ("component_service_id") REFERENCES "public"."services"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_families" ADD CONSTRAINT "service_families_salon_id_organization_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_families" ADD CONSTRAINT "service_families_category_id_service_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."service_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_public_visibility" ADD CONSTRAINT "service_public_visibility_salon_id_organization_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_public_visibility" ADD CONSTRAINT "service_public_visibility_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_salon_id_organization_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."organization"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_family_id_service_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."service_families"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_schedules" ADD CONSTRAINT "staff_schedules_salon_id_organization_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_schedules" ADD CONSTRAINT "staff_schedules_staff_id_user_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_services" ADD CONSTRAINT "staff_services_staff_user_id_user_id_fk" FOREIGN KEY ("staff_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_services" ADD CONSTRAINT "staff_services_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_services" ADD CONSTRAINT "staff_services_salon_id_organization_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "appointment_addon_lines_appointment_addon_unique" ON "appointment_addon_lines" USING btree ("appointment_id","service_addon_id");--> statement-breakpoint
CREATE INDEX "appointment_addon_lines_salon_id_appointment_idx" ON "appointment_addon_lines" USING btree ("salon_id","appointment_id");--> statement-breakpoint
CREATE INDEX "appointment_addon_lines_salon_id_addon_idx" ON "appointment_addon_lines" USING btree ("salon_id","service_addon_id");--> statement-breakpoint
CREATE UNIQUE INDEX "appointment_requests_confirmation_token_unique" ON "appointment_requests" USING btree ("confirmation_token");--> statement-breakpoint
CREATE INDEX "appointment_requests_salon_id_status_date_idx" ON "appointment_requests" USING btree ("salon_id","status","requested_date");--> statement-breakpoint
CREATE INDEX "appointment_requests_salon_id_customer_phone_idx" ON "appointment_requests" USING btree ("salon_id","customer_phone");--> statement-breakpoint
CREATE INDEX "appointments_salon_id_date_idx" ON "appointments" USING btree ("salon_id","date");--> statement-breakpoint
CREATE INDEX "appointments_salon_id_staff_id_date_idx" ON "appointments" USING btree ("salon_id","staff_id","date");--> statement-breakpoint
CREATE INDEX "appointments_salon_id_client_id_date_idx" ON "appointments" USING btree ("salon_id","client_id","date");--> statement-breakpoint
CREATE INDEX "appointments_staff_id_date_idx" ON "appointments" USING btree ("staff_id","date");--> statement-breakpoint
CREATE INDEX "appointments_client_id_date_idx" ON "appointments" USING btree ("client_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "business_settings_salon_id_unique" ON "business_settings" USING btree ("salon_id");--> statement-breakpoint
CREATE UNIQUE INDEX "catalog_presets_slug_unique" ON "catalog_presets" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "catalog_presets_active_sort_idx" ON "catalog_presets" USING btree ("is_active","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "client_follow_ups_salon_id_client_id_reason_unique" ON "client_follow_ups" USING btree ("salon_id","client_id","reason");--> statement-breakpoint
CREATE INDEX "client_follow_ups_salon_id_status_due_idx" ON "client_follow_ups" USING btree ("salon_id","status","due_date");--> statement-breakpoint
CREATE INDEX "client_follow_ups_salon_id_client_id_idx" ON "client_follow_ups" USING btree ("salon_id","client_id");--> statement-breakpoint
CREATE UNIQUE INDEX "client_tags_salon_id_client_id_label_unique" ON "client_tags" USING btree ("salon_id","client_id","label");--> statement-breakpoint
CREATE INDEX "client_tags_salon_id_client_id_idx" ON "client_tags" USING btree ("salon_id","client_id");--> statement-breakpoint
CREATE INDEX "client_tags_salon_id_label_idx" ON "client_tags" USING btree ("salon_id","label");--> statement-breakpoint
CREATE UNIQUE INDEX "clients_salon_id_phone_unique" ON "clients" USING btree ("salon_id","phone");--> statement-breakpoint
CREATE INDEX "clients_salon_id_phone_idx" ON "clients" USING btree ("salon_id","phone");--> statement-breakpoint
CREATE INDEX "invitation_organization_id_idx" ON "invitation" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "invitation_email_idx" ON "invitation" USING btree ("email");--> statement-breakpoint
CREATE INDEX "locations_salon_id_active_idx" ON "locations" USING btree ("salon_id","active");--> statement-breakpoint
CREATE UNIQUE INDEX "locations_salon_id_name_unique" ON "locations" USING btree ("salon_id","name");--> statement-breakpoint
CREATE INDEX "member_organization_id_idx" ON "member" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "member_user_id_idx" ON "member" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notification_deliveries_notification_id_idx" ON "notification_deliveries" USING btree ("notification_id");--> statement-breakpoint
CREATE INDEX "notification_deliveries_channel_status_idx" ON "notification_deliveries" USING btree ("channel","status");--> statement-breakpoint
CREATE INDEX "notification_preferences_user_id_idx" ON "notification_preferences" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_salon_id_user_id_created_at_idx" ON "notifications" USING btree ("salon_id","user_id","created_at");--> statement-breakpoint
CREATE INDEX "notifications_salon_id_user_id_read_at_idx" ON "notifications" USING btree ("salon_id","user_id","read_at");--> statement-breakpoint
CREATE INDEX "preset_applications_salon_id_applied_at_idx" ON "preset_applications" USING btree ("salon_id","applied_at");--> statement-breakpoint
CREATE INDEX "preset_applications_preset_id_idx" ON "preset_applications" USING btree ("preset_id");--> statement-breakpoint
CREATE INDEX "public_submit_rate_limits_ip_created_at_idx" ON "public_submit_rate_limits" USING btree ("ip","created_at");--> statement-breakpoint
CREATE INDEX "resources_salon_id_active_idx" ON "resources" USING btree ("salon_id","active");--> statement-breakpoint
CREATE INDEX "resources_salon_id_location_id_idx" ON "resources" USING btree ("salon_id","location_id");--> statement-breakpoint
CREATE UNIQUE INDEX "resources_salon_id_location_id_name_unique" ON "resources" USING btree ("salon_id","location_id","name");--> statement-breakpoint
CREATE INDEX "salon_member_organization_id_idx" ON "salon_member" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "salon_member_user_id_organization_id_unique" ON "salon_member" USING btree ("user_id","organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "service_addon_category_scopes_addon_scope_unique" ON "service_addon_category_scopes" USING btree ("addon_id","scope_id");--> statement-breakpoint
CREATE INDEX "service_addon_category_scopes_salon_id_addon_idx" ON "service_addon_category_scopes" USING btree ("salon_id","addon_id");--> statement-breakpoint
CREATE INDEX "service_addon_category_scopes_salon_id_scope_idx" ON "service_addon_category_scopes" USING btree ("salon_id","scope_id");--> statement-breakpoint
CREATE UNIQUE INDEX "service_addon_family_scopes_addon_scope_unique" ON "service_addon_family_scopes" USING btree ("addon_id","scope_id");--> statement-breakpoint
CREATE INDEX "service_addon_family_scopes_salon_id_addon_idx" ON "service_addon_family_scopes" USING btree ("salon_id","addon_id");--> statement-breakpoint
CREATE INDEX "service_addon_family_scopes_salon_id_scope_idx" ON "service_addon_family_scopes" USING btree ("salon_id","scope_id");--> statement-breakpoint
CREATE UNIQUE INDEX "service_addon_service_scopes_addon_scope_unique" ON "service_addon_service_scopes" USING btree ("addon_id","scope_id");--> statement-breakpoint
CREATE INDEX "service_addon_service_scopes_salon_id_addon_idx" ON "service_addon_service_scopes" USING btree ("salon_id","addon_id");--> statement-breakpoint
CREATE INDEX "service_addon_service_scopes_salon_id_scope_idx" ON "service_addon_service_scopes" USING btree ("salon_id","scope_id");--> statement-breakpoint
CREATE INDEX "service_addons_salon_id_active_idx" ON "service_addons" USING btree ("salon_id","active");--> statement-breakpoint
CREATE INDEX "service_addons_salon_id_sort_idx" ON "service_addons" USING btree ("salon_id","sort_order","name");--> statement-breakpoint
CREATE UNIQUE INDEX "service_categories_salon_id_name_unique" ON "service_categories" USING btree ("salon_id","name");--> statement-breakpoint
CREATE INDEX "service_categories_salon_id_active_idx" ON "service_categories" USING btree ("salon_id","active");--> statement-breakpoint
CREATE UNIQUE INDEX "service_combo_components_combo_component_unique" ON "service_combo_components" USING btree ("combo_service_id","component_service_id");--> statement-breakpoint
CREATE INDEX "service_combo_components_salon_id_combo_idx" ON "service_combo_components" USING btree ("salon_id","combo_service_id");--> statement-breakpoint
CREATE INDEX "service_combo_components_salon_id_component_idx" ON "service_combo_components" USING btree ("salon_id","component_service_id");--> statement-breakpoint
CREATE UNIQUE INDEX "service_families_salon_id_category_id_name_unique" ON "service_families" USING btree ("salon_id","category_id","name");--> statement-breakpoint
CREATE INDEX "service_families_salon_id_category_id_idx" ON "service_families" USING btree ("salon_id","category_id");--> statement-breakpoint
CREATE INDEX "service_families_salon_id_active_idx" ON "service_families" USING btree ("salon_id","active");--> statement-breakpoint
CREATE UNIQUE INDEX "services_salon_id_name_unique" ON "services" USING btree ("salon_id","name");--> statement-breakpoint
CREATE INDEX "services_salon_id_family_id_idx" ON "services" USING btree ("salon_id","family_id");--> statement-breakpoint
CREATE INDEX "services_salon_id_active_idx" ON "services" USING btree ("salon_id","active");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "staff_schedules_salon_id_staff_id_day_unique" ON "staff_schedules" USING btree ("salon_id","staff_id","day_of_week");--> statement-breakpoint
CREATE INDEX "staff_schedules_salon_id_staff_id_idx" ON "staff_schedules" USING btree ("salon_id","staff_id");--> statement-breakpoint
CREATE INDEX "staff_schedules_salon_id_day_active_idx" ON "staff_schedules" USING btree ("salon_id","day_of_week","active");--> statement-breakpoint
CREATE INDEX "staff_services_service_id_idx" ON "staff_services" USING btree ("service_id");--> statement-breakpoint
CREATE INDEX "staff_services_salon_id_staff_user_id_idx" ON "staff_services" USING btree ("salon_id","staff_user_id");--> statement-breakpoint
CREATE INDEX "staff_services_salon_id_service_id_idx" ON "staff_services" USING btree ("salon_id","service_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");