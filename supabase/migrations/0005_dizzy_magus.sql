CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"slug" text,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
