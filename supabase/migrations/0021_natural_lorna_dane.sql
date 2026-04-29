CREATE TYPE "public"."checkout_intent_source" AS ENUM('cart', 'pdp');--> statement-breakpoint
CREATE TYPE "public"."checkout_intent_status" AS ENUM('active', 'expired', 'converted', 'cancelled');--> statement-breakpoint
CREATE TABLE "checkout_intent_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"intent_id" uuid NOT NULL,
	"order_item_id" uuid NOT NULL,
	"unit_price_snapshot" integer,
	"quantity_snapshot" integer,
	"option_total_snapshot" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "checkout_intents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"source" "checkout_intent_source" NOT NULL,
	"status" "checkout_intent_status" DEFAULT 'active' NOT NULL,
	"source_ref" text,
	"delivery_method" text,
	"shipping_cost" integer DEFAULT 0 NOT NULL,
	"subtotal_snapshot" integer,
	"total_snapshot" integer,
	"expires_at" timestamp with time zone,
	"converted_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "checkout_intent_items" ADD CONSTRAINT "checkout_intent_items_intent_id_checkout_intents_id_fk" FOREIGN KEY ("intent_id") REFERENCES "public"."checkout_intents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkout_intent_items" ADD CONSTRAINT "checkout_intent_items_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkout_intents" ADD CONSTRAINT "checkout_intents_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkout_intents" ADD CONSTRAINT "checkout_intents_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "checkout_intent_items_intent_order_item_uidx" ON "checkout_intent_items" USING btree ("intent_id","order_item_id");--> statement-breakpoint
CREATE INDEX "checkout_intent_items_intent_idx" ON "checkout_intent_items" USING btree ("intent_id");--> statement-breakpoint
CREATE INDEX "checkout_intent_items_order_item_idx" ON "checkout_intent_items" USING btree ("order_item_id");--> statement-breakpoint
CREATE INDEX "checkout_intents_profile_status_idx" ON "checkout_intents" USING btree ("profile_id","status");--> statement-breakpoint
CREATE INDEX "checkout_intents_order_idx" ON "checkout_intents" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "checkout_intents_active_profile_order_idx" ON "checkout_intents" USING btree ("profile_id","order_id","status");