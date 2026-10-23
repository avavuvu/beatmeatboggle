UPDATE "player_words" SET "mode" = 'challenge' WHERE "challenged_by" IS NOT NULL;--> statement-breakpoint
UPDATE "player_words" SET "mode" = 'archive'
WHERE "challenged_by" IS NULL
  AND "created_at" NOT BETWEEN '2026-06-04 12:01:57' AND '2026-06-04 12:01:58'
  AND to_char("created_at" + interval '10 hours', 'YYYY-MM-DD') <> "date_key";
