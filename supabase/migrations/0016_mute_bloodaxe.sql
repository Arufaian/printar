ALTER TABLE "order_status_logs" RENAME COLUMN "order_item_id" TO "order_id";--> statement-breakpoint
ALTER TABLE "order_status_logs" DROP CONSTRAINT "order_status_logs_order_item_id_orders_id_fk";
--> statement-breakpoint
ALTER TABLE "order_status_logs" ADD CONSTRAINT "order_status_logs_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;