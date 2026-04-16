CREATE TYPE "public"."order_status" AS ENUM('pending_payment', 'paid', 'file_review', 'revision_requested', 'printing', 'ready', 'shipped', 'completed', 'canceled');--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid,
	"address_id" uuid,
	"status" "order_status",
	"delivery_method" text,
	"shipping_cost" integer,
	"total_price" integer,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_address_id_addresses_id_fk" FOREIGN KEY ("address_id") REFERENCES "public"."addresses"("id") ON DELETE no action ON UPDATE no action;