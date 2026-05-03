import { pgTable, serial, integer, text, date, timestamp } from "drizzle-orm/pg-core";

export const examCountdownsTable = pgTable("exam_countdowns", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  studySetId: integer("study_set_id"),
  examName: text("exam_name").notNull(),
  examDate: date("exam_date").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ExamCountdownRow = typeof examCountdownsTable.$inferSelect;
