CREATE TABLE "salon_onboarding" (
	"salon_id" uuid PRIMARY KEY NOT NULL,
	"profile_confirmed_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"skipped_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "salon_onboarding_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action
);
