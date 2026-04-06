import { integer, pgTable, varchar, jsonb } from 'drizzle-orm/pg-core';

export const avasWords = pgTable('avas_words', {
    dateKey: varchar('date_key', { length: 10 }).primaryKey(), // YYYY-MM-DD
    words: jsonb('words').$type<string[]>().notNull(),
    wordCount: integer('word_count').notNull(),
});

export const playerWords = pgTable('player_words', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    dateKey: varchar('date_key', { length: 10 }).notNull(),
    words: jsonb('words').$type<string[]>().notNull(),
    wordCount: integer('word_count').notNull(),
});