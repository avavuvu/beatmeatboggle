ALTER TABLE "boards" ADD COLUMN "seed_word" varchar(20);--> statement-breakpoint
ALTER TABLE "boards" ADD COLUMN "ladder" jsonb;--> statement-breakpoint
ALTER TABLE "boards" ADD COLUMN "generator" varchar(20);