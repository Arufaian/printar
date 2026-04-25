ALTER TABLE "variants" DROP CONSTRAINT "variants_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "option_groups" DROP CONSTRAINT "option_groups_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "options" DROP CONSTRAINT "options_option_group_id_option_groups_id_fk";
--> statement-breakpoint
ALTER TABLE "variants" ADD CONSTRAINT "variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "option_groups" ADD CONSTRAINT "option_groups_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "options" ADD CONSTRAINT "options_option_group_id_option_groups_id_fk" FOREIGN KEY ("option_group_id") REFERENCES "public"."option_groups"("id") ON DELETE cascade ON UPDATE no action;