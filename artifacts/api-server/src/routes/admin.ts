import { Router, type IRouter } from "express";
import { desc } from "drizzle-orm";
import {
  db,
  usersTable,
  studySetsTable,
  flashcardsTable,
  quizAttemptsTable,
} from "@workspace/db";
import { requireAdmin } from "../lib/auth";

const router: IRouter = Router();

function isDemoMode(): boolean {
  return !process.env.STRIPE_SECRET_KEY;
}

router.get("/admin/stats", requireAdmin, async (_req, res): Promise<void> => {
  const users = await db.select().from(usersTable);
  const sets = await db.select().from(studySetsTable);
  const flashcards = await db.select().from(flashcardsTable);
  const attempts = await db.select().from(quizAttemptsTable);

  const planMap = new Map<string, number>();
  for (const u of users) planMap.set(u.plan, (planMap.get(u.plan) ?? 0) + 1);
  const usersByPlan = ["free", "pro", "tutor"].map((p) => ({
    plan: p,
    count: planMap.get(p) ?? 0,
  }));

  const setCountByUser = new Map<number, number>();
  for (const s of sets) setCountByUser.set(s.userId, (setCountByUser.get(s.userId) ?? 0) + 1);

  const recent = [...users]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 8)
    .map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      plan: u.plan,
      studySetCount: setCountByUser.get(u.id) ?? 0,
      createdAt: u.createdAt.toISOString(),
    }));

  res.json({
    totalUsers: users.length,
    totalStudySets: sets.length,
    totalFlashcards: flashcards.length,
    totalQuizAttempts: attempts.length,
    usersByPlan,
    demoMode: isDemoMode(),
    recentSignups: recent,
  });
});

router.get("/admin/users", requireAdmin, async (_req, res): Promise<void> => {
  const users = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt));
  const sets = await db.select().from(studySetsTable);
  const setCountByUser = new Map<number, number>();
  for (const s of sets) setCountByUser.set(s.userId, (setCountByUser.get(s.userId) ?? 0) + 1);
  res.json(
    users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      plan: u.plan,
      studySetCount: setCountByUser.get(u.id) ?? 0,
      createdAt: u.createdAt.toISOString(),
    })),
  );
});

export default router;
