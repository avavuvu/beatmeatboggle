CREATE TABLE "avas_words" (
	"date_key" varchar(10) PRIMARY KEY NOT NULL,
	"words" jsonb NOT NULL,
	"word_count" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "player_words" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "player_words_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"date_key" varchar(10) NOT NULL,
	"words" jsonb NOT NULL,
	"word_count" integer NOT NULL
);
