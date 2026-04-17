CREATE TYPE "public"."payment_status" AS ENUM('pending', 'settlement', 'expire', 'cancel');--> statement-breakpoint
CREATE TYPE "public"."refund_status_enum" AS ENUM('none', 'requested', 'refunded');--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid,
	"status" "payment_status",
	"payment_method" text,
	"raw_response" jsonb,
	"refundStatus" "refund_status_enum" DEFAULT 'none',
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;