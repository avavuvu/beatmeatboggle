ALTER TABLE "player_words" ADD COLUMN "score" integer DEFAULT -1 NOT NULL;--> statement-breakpoint
ALTER TABLE "player_words" ADD COLUMN "fair_fight" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "player_words" ADD COLUMN "country" varchar(100);--> statement-breakpoint
ALTER TABLE "player_words" ADD COLUMN "city" varchar(100);--> statement-breakpoint
ALTER TABLE "player_words" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "avas_words" DROP COLUMN "word_count";--> statement-breakpoint
ALTER TABLE "player_words" DROP COLUMN "word_count";