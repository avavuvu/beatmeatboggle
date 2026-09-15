import {
    integer,
    pgTable,
    varchar,
    jsonb,
    boolean,
    timestamp,
} from "drizzle-orm/pg-core"

export const boards = pgTable("boards", {
    dateKey: varchar("date_key", { length: 10 }).primaryKey(), // YYYY-MM-DD
    size: integer("size").notNull(),
    letters: jsonb("letters").$type<string[]>().notNull(),
    time: integer("time").notNull(),
    totalWords: jsonb("total_words").$type<string[]>().notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const avasWords = pgTable("avas_words", {
    dateKey: varchar("date_key", { length: 10 }).primaryKey(), // YYYY-MM-DD
    words: jsonb("words").$type<string[]>().notNull(),
    // kept until the boards backfill is confirmed complete, then dropped in a follow-up migration
    totalWords: jsonb("total_words").$type<string[]>(),
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
    challengedBy: varchar("challenged_by"),
    playerId: varchar("player_id")
})
