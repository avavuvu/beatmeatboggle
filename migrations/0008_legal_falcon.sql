ALTER TABLE "player_words" ALTER COLUMN "challenged_by" SET DATA TYPE varchar(12);--> statement-breakpoint
ALTER TABLE "player_words" ALTER COLUMN "player_id" SET DATA TYPE varchar(12);--> statement-breakpoint
ALTER TABLE "player_words" ADD COLUMN "mode" varchar(10) DEFAULT 'daily' NOT NULL;--> statement-breakpoint
CREATE INDEX "player_words_date_key_player_id_idx" ON "player_words" USING btree ("date_key","player_id");