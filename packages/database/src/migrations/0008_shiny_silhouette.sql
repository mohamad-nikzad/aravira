ALTER TABLE "clients" ALTER COLUMN "phone" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "is_placeholder" boolean DEFAULT false NOT NULL;