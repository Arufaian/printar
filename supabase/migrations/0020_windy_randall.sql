ALTER TABLE "addresses" ALTER COLUMN "profile_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "addresses" ADD COLUMN "recipient_name" text;--> statement-breakpoint
ALTER TABLE "addresses" ADD COLUMN "label" text;--> statement-breakpoint
ALTER TABLE "addresses" ADD COLUMN "is_default" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "addresses" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now();