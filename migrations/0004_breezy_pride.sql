CREATE TABLE "boards" (
	"date_key" varchar(10) PRIMARY KEY NOT NULL,
	"size" integer NOT NULL,
	"letters" jsonb NOT NULL,
	"time" integer NOT NULL,
	"total_words" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
