import { pgTable, serial, text, integer, timestamp, jsonb, real, date } from "drizzle-orm/pg-core";

export type KeyTermJson = { term: string; definition: string };
export type ReviewSheetJson = {
  sections: { heading: string; bullets: string[] }[];
  cramSection: string[];
};

export const studySetsTable = pgTable("study_sets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  folderId: integer("folder_id"),
  title: text("title").notNull(),
  subject: text("subject").notNull(),
  course: text("course"),
  difficulty: text("difficulty").notNull().default("medium"),
  learningGoal: text("learning_goal"),
  examDate: date("exam_date"),
  notes: text("notes").notNull(),
  summary: text("summary").notNull().default(""),
  keyTerms: jsonb("key_terms").$type<KeyTermJson[]>().notNull().default([]),
  reviewSheet: jsonb("review_sheet").$type<ReviewSheetJson>().notNull().default({ sections: [], cramSection: [] }),
  weakAreas: jsonb("weak_areas").$type<string[]>().notNull().default([]),
  qualityScore: real("quality_score").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type StudySetRow = typeof studySetsTable.$inferSelect;
