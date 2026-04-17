CREATE TABLE "order_status_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_item_id" uuid,
	"status" "order_status",
	"change_by" uuid,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "order_status_logs" ADD CONSTRAINT "order_status_logs_order_item_id_orders_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_status_logs" ADD CONSTRAINT "order_status_logs_change_by_profiles_id_fk" FOREIGN KEY ("change_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;