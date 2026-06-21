CREATE TABLE "support_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"author_user_id" uuid NOT NULL,
	"author_kind" text NOT NULL,
	"author_display_name_snapshot" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" uuid NOT NULL,
	"submitted_by_user_id" uuid NOT NULL,
	"category" text NOT NULL,
	"subject" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"last_activity_at" timestamp with time zone NOT NULL,
	"last_manager_message_at" timestamp with time zone,
	"last_platform_message_at" timestamp with time zone,
	"manager_last_read_at" timestamp with time zone,
	"platform_last_read_at" timestamp with time zone,
	"resolved_at" timestamp with time zone,
	"resolved_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_ticket_id_support_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_author_user_id_user_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_salon_id_organization_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."organization"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_submitted_by_user_id_user_id_fk" FOREIGN KEY ("submitted_by_user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_resolved_by_user_id_user_id_fk" FOREIGN KEY ("resolved_by_user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "support_messages_ticket_created_id_idx" ON "support_messages" USING btree ("ticket_id","created_at","id");--> statement-breakpoint
CREATE INDEX "support_tickets_salon_activity_idx" ON "support_tickets" USING btree ("salon_id","last_activity_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "support_tickets_status_activity_idx" ON "support_tickets" USING btree ("status","last_activity_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "support_tickets_category_activity_idx" ON "support_tickets" USING btree ("category","last_activity_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "support_tickets_salon_status_idx" ON "support_tickets" USING btree ("salon_id","status");