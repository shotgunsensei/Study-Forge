import { pgTable, serial, integer, real, jsonb, timestamp } from "drizzle-orm/pg-core";

export type AttemptAnswerJson = {
  questionId: number;
  selectedIndex: number;
  correctIndex: number;
  isCorrect: boolean;
  topic: string;
};

export const quizAttemptsTable = pgTable("quiz_attempts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  studySetId: integer("study_set_id").notNull(),
  score: real("score").notNull().default(0),
  correctCount: integer("correct_count").notNull().default(0),
  totalCount: integer("total_count").notNull().default(0),
  answers: jsonb("answers").$type<AttemptAnswerJson[]>().notNull().default([]),
  completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
});

export type QuizAttemptRow = typeof quizAttemptsTable.$inferSelect;
