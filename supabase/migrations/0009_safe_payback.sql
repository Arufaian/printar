CREATE TABLE "options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"option_group_id" uuid,
	"name" text,
	"additional_price" integer
);
--> statement-breakpoint
ALTER TABLE "options" ADD CONSTRAINT "options_option_group_id_option_groups_id_fk" FOREIGN KEY ("option_group_id") REFERENCES "public"."option_groups"("id") ON DELETE no action ON UPDATE no action;