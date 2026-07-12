import {
    integer,
    pgTable,
    varchar,
    jsonb,
    boolean,
    timestamp,
    text,
} from "drizzle-orm/pg-core"

export const avasWords = pgTable("avas_words", {
    dateKey: varchar("date_key", { length: 10 }).primaryKey(), // YYYY-MM-DD
    words: jsonb("words").$type<string[]>().notNull(),
    totalWords: jsonb("total_words").$type<string[]>(),
    imageData: text("image_data"),
    message: varchar("message", { length: 500 }),
})

export const playerWords = pgTable("player_words", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    dateKey: varchar("date_key", { length: 10 }).notNull(),
    words: jsonb("words").$type<string[]>().notNull(),
    score: integer("score").notNull().default(-1),
    fairFight: boolean("fair_fight").notNull().default(false),
    country: varchar("country", { length: 100 }),
    city: varchar("city", { length: 100 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
})
