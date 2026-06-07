CREATE TABLE "client_follow_up_message_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" uuid NOT NULL,
	"follow_up_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"phone" text NOT NULL,
	"request_id" text NOT NULL,
	"status" text NOT NULL,
	"provider_message_id" text,
	"error" text,
	"sent_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sent_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "client_follow_up_message_deliveries" ADD CONSTRAINT "client_follow_up_message_deliveries_salon_id_organization_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "client_follow_up_message_deliveries" ADD CONSTRAINT "client_follow_up_message_deliveries_follow_up_id_client_follow_ups_id_fk" FOREIGN KEY ("follow_up_id") REFERENCES "public"."client_follow_ups"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "client_follow_up_message_deliveries" ADD CONSTRAINT "client_follow_up_message_deliveries_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "client_follow_up_message_deliveries" ADD CONSTRAINT "client_follow_up_message_deliveries_sent_by_user_id_user_id_fk" FOREIGN KEY ("sent_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "client_follow_up_msg_deliveries_salon_follow_up_idx" ON "client_follow_up_message_deliveries" USING btree ("salon_id","follow_up_id");
--> statement-breakpoint
CREATE INDEX "client_follow_up_msg_deliveries_client_idx" ON "client_follow_up_message_deliveries" USING btree ("salon_id","client_id");
--> statement-breakpoint
CREATE INDEX "client_follow_up_msg_deliveries_provider_status_idx" ON "client_follow_up_message_deliveries" USING btree ("provider","status");
--> statement-breakpoint
CREATE UNIQUE INDEX "client_follow_up_msg_deliveries_sent_unique" ON "client_follow_up_message_deliveries" USING btree ("follow_up_id","provider") WHERE "status" = 'sent';
