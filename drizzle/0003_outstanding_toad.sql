ALTER TABLE "profile_pictures" RENAME COLUMN "url" TO "file_name";--> statement-breakpoint
ALTER TABLE "profile_pictures" ADD COLUMN "bucket" text NOT NULL;--> statement-breakpoint
ALTER TABLE "profile_pictures" ADD COLUMN "size" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "profile_pictures" ADD COLUMN "format" text NOT NULL;