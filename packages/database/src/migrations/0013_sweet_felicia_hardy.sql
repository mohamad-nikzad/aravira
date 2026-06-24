CREATE TABLE "salon_handoff" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_user_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "salon_handoff" ADD CONSTRAINT "salon_handoff_salon_id_organization_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salon_handoff" ADD CONSTRAINT "salon_handoff_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "salon_handoff_token_hash_unique" ON "salon_handoff" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "salon_handoff_salon_id_idx" ON "salon_handoff" USING btree ("salon_id");