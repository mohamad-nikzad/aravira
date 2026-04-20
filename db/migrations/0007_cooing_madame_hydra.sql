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
ALTER TABLE "client_follow_ups" ADD CONSTRAINT "client_follow_ups_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_follow_ups" ADD CONSTRAINT "client_follow_ups_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_tags" ADD CONSTRAINT "client_tags_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_tags" ADD CONSTRAINT "client_tags_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "client_follow_ups_salon_id_client_id_reason_unique" ON "client_follow_ups" USING btree ("salon_id","client_id","reason");--> statement-breakpoint
CREATE INDEX "client_follow_ups_salon_id_status_due_idx" ON "client_follow_ups" USING btree ("salon_id","status","due_date");--> statement-breakpoint
CREATE INDEX "client_follow_ups_salon_id_client_id_idx" ON "client_follow_ups" USING btree ("salon_id","client_id");--> statement-breakpoint
CREATE UNIQUE INDEX "client_tags_salon_id_client_id_label_unique" ON "client_tags" USING btree ("salon_id","client_id","label");--> statement-breakpoint
CREATE INDEX "client_tags_salon_id_client_id_idx" ON "client_tags" USING btree ("salon_id","client_id");--> statement-breakpoint
CREATE INDEX "client_tags_salon_id_label_idx" ON "client_tags" USING btree ("salon_id","label");