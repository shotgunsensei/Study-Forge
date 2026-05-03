import { pgTable, serial, text, integer } from "drizzle-orm/pg-core";

export const flashcardsTable = pgTable("flashcards", {
  id: serial("id").primaryKey(),
  studySetId: integer("study_set_id").notNull(),
  position: integer("position").notNull().default(0),
  front: text("front").notNull(),
  back: text("back").notNull(),
  status: text("status").notNull().default("new"),
});

export type FlashcardRow = typeof flashcardsTable.$inferSelect;
