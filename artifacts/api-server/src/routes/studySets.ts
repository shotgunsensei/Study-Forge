import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import {
  db,
  studySetsTable,
  flashcardsTable,
  quizQuestionsTable,
  quizAttemptsTable,
  studySessionsTable,
  examCountdownsTable,
} from "@workspace/db";
import {
  CreateStudySetBody,
  UpdateStudySetBody,
  UpdateFlashcardStatusBody,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import { generateMaterials } from "../lib/generator";
import { limitsFor, planOf, limitErrorBody } from "../lib/plans";
import {
  applyMaterialsToSet,
  buildStudySetResponse,
  flashcardRowToApi,
  listSetsForUser,
  regenerateForSet,
} from "../lib/studySetService";

const router: IRouter = Router();

router.get("/study-sets", requireAuth, async (req, res): Promise<void> => {
  const user = req.user!;
  const search = typeof req.query.search === "string" ? req.query.search : undefined;
  const subject = typeof req.query.subject === "string" ? req.query.subject : undefined;
  let folderId: number | null | undefined;
  if (typeof req.query.folderId === "string" && req.query.folderId !== "") {
    const n = Number(req.query.folderId);
    folderId = Number.isNaN(n) ? undefined : n;
  }
  const sets = await listSetsForUser(user.id, { search, subject, folderId });
  res.json(sets);
});

router.post("/study-sets", requireAuth, async (req, res): Promise<void> => {
  const user = req.user!;
  const parsed = CreateStudySetBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const limits = limitsFor(user);
  const existingCount = (await db.select().from(studySetsTable).where(eq(studySetsTable.userId, user.id))).length;
  if (limits.maxStudySets !== null && existingCount >= limits.maxStudySets) {
    res.status(402).json(
      limitErrorBody(
        "study_sets",
        planOf(user),
        "pro",
        `Free plan is limited to ${limits.maxStudySets} study sets. Upgrade to Pro for unlimited.`,
      ),
    );
    return;
  }

  const body = parsed.data;
  const examDate = body.examDate && body.examDate.length > 0 ? body.examDate : null;
  const [set] = await db
    .insert(studySetsTable)
    .values({
      userId: user.id,
      title: body.title,
      subject: body.subject,
      course: body.course ?? null,
      difficulty: body.difficulty,
      learningGoal: body.learningGoal ?? null,
      examDate,
      notes: body.notes,
    })
    .returning();

  const materials = generateMaterials({
    notes: body.notes,
    title: body.title,
    subject: body.subject,
    difficulty: body.difficulty,
    examDate,
    maxFlashcards: limits.maxFlashcardsPerSet ?? undefined,
  });
  await applyMaterialsToSet(set.id, materials);

  if (examDate) {
    await db.insert(examCountdownsTable).values({
      userId: user.id,
      studySetId: set.id,
      examName: body.title,
      examDate,
    });
  }

  const full = await buildStudySetResponse(set.id);
  res.status(201).json(full);
});

router.get("/study-sets/:id", requireAuth, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const user = req.user!;
  const [set] = await db
    .select()
    .from(studySetsTable)
    .where(and(eq(studySetsTable.id, id), eq(studySetsTable.userId, user.id)));
  if (!set) {
    res.status(404).json({ error: "Study set not found" });
    return;
  }
  const full = await buildStudySetResponse(id);
  res.json(full);
});

router.patch("/study-sets/:id", requireAuth, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const user = req.user!;
  const parsed = UpdateStudySetBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const [set] = await db
    .select()
    .from(studySetsTable)
    .where(and(eq(studySetsTable.id, id), eq(studySetsTable.userId, user.id)));
  if (!set) {
    res.status(404).json({ error: "Study set not found" });
    return;
  }
  const updates: Record<string, unknown> = {};
  if (parsed.data.title !== undefined) updates.title = parsed.data.title;
  if (parsed.data.subject !== undefined) updates.subject = parsed.data.subject;
  if (parsed.data.course !== undefined) updates.course = parsed.data.course;
  if (parsed.data.difficulty !== undefined) updates.difficulty = parsed.data.difficulty;
  if (parsed.data.learningGoal !== undefined) updates.learningGoal = parsed.data.learningGoal;
  if (parsed.data.examDate !== undefined) updates.examDate = parsed.data.examDate;
  if (parsed.data.folderId !== undefined) updates.folderId = parsed.data.folderId;
  await db.update(studySetsTable).set(updates).where(eq(studySetsTable.id, id));
  const full = await buildStudySetResponse(id);
  res.json(full);
});

router.delete("/study-sets/:id", requireAuth, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const user = req.user!;
  const [set] = await db
    .select()
    .from(studySetsTable)
    .where(and(eq(studySetsTable.id, id), eq(studySetsTable.userId, user.id)));
  if (!set) {
    res.status(404).json({ error: "Study set not found" });
    return;
  }
  await db.delete(flashcardsTable).where(eq(flashcardsTable.studySetId, id));
  await db.delete(quizQuestionsTable).where(eq(quizQuestionsTable.studySetId, id));
  await db.delete(quizAttemptsTable).where(eq(quizAttemptsTable.studySetId, id));
  await db.delete(studySessionsTable).where(eq(studySessionsTable.studySetId, id));
  await db.delete(examCountdownsTable).where(eq(examCountdownsTable.studySetId, id));
  await db.delete(studySetsTable).where(eq(studySetsTable.id, id));
  res.json({ ok: true });
});

router.post("/study-sets/:id/duplicate", requireAuth, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const user = req.user!;
  const limits = limitsFor(user);
  const existingCount = (await db.select().from(studySetsTable).where(eq(studySetsTable.userId, user.id))).length;
  if (limits.maxStudySets !== null && existingCount >= limits.maxStudySets) {
    res.status(402).json(
      limitErrorBody(
        "study_sets",
        planOf(user),
        "pro",
        `Free plan is limited to ${limits.maxStudySets} study sets. Upgrade to Pro to duplicate.`,
      ),
    );
    return;
  }
  const [set] = await db
    .select()
    .from(studySetsTable)
    .where(and(eq(studySetsTable.id, id), eq(studySetsTable.userId, user.id)));
  if (!set) {
    res.status(404).json({ error: "Study set not found" });
    return;
  }
  const [copy] = await db
    .insert(studySetsTable)
    .values({
      userId: user.id,
      folderId: set.folderId ?? null,
      title: `${set.title} (Copy)`,
      subject: set.subject,
      course: set.course ?? null,
      difficulty: set.difficulty,
      learningGoal: set.learningGoal ?? null,
      examDate: set.examDate,
      notes: set.notes,
      summary: set.summary,
      keyTerms: set.keyTerms,
      reviewSheet: set.reviewSheet,
      weakAreas: set.weakAreas,
      qualityScore: set.qualityScore,
    })
    .returning();
  const cards = await db.select().from(flashcardsTable).where(eq(flashcardsTable.studySetId, id));
  if (cards.length > 0) {
    await db.insert(flashcardsTable).values(
      cards.map((c) => ({
        studySetId: copy.id,
        position: c.position,
        front: c.front,
        back: c.back,
        status: "new",
      })),
    );
  }
  const quiz = await db.select().from(quizQuestionsTable).where(eq(quizQuestionsTable.studySetId, id));
  if (quiz.length > 0) {
    await db.insert(quizQuestionsTable).values(
      quiz.map((q) => ({
        studySetId: copy.id,
        position: q.position,
        type: q.type,
        question: q.question,
        choices: q.choices,
        correctIndex: q.correctIndex,
        answer: q.answer,
        explanation: q.explanation,
        topic: q.topic,
      })),
    );
  }
  const sessions = await db.select().from(studySessionsTable).where(eq(studySessionsTable.studySetId, id));
  if (sessions.length > 0) {
    await db.insert(studySessionsTable).values(
      sessions.map((s) => ({
        studySetId: copy.id,
        day: s.day,
        date: s.date,
        topic: s.topic,
        focus: s.focus,
        estimatedMinutes: s.estimatedMinutes,
        completed: false,
      })),
    );
  }
  const full = await buildStudySetResponse(copy.id);
  res.status(201).json(full);
});

router.post("/study-sets/:id/regenerate", requireAuth, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const user = req.user!;
  const [set] = await db
    .select()
    .from(studySetsTable)
    .where(and(eq(studySetsTable.id, id), eq(studySetsTable.userId, user.id)));
  if (!set) {
    res.status(404).json({ error: "Study set not found" });
    return;
  }
  await regenerateForSet(id, user);
  const full = await buildStudySetResponse(id);
  res.json(full);
});

router.patch(
  "/study-sets/:id/flashcards/:cardId/status",
  requireAuth,
  async (req, res): Promise<void> => {
    const id = Number(req.params.id);
    const cardId = Number(req.params.cardId);
    if (Number.isNaN(id) || Number.isNaN(cardId)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const parsed = UpdateFlashcardStatusBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request" });
      return;
    }
    const user = req.user!;
    const [set] = await db
      .select()
      .from(studySetsTable)
      .where(and(eq(studySetsTable.id, id), eq(studySetsTable.userId, user.id)));
    if (!set) {
      res.status(404).json({ error: "Study set not found" });
      return;
    }
    const [updated] = await db
      .update(flashcardsTable)
      .set({ status: parsed.data.status })
      .where(and(eq(flashcardsTable.id, cardId), eq(flashcardsTable.studySetId, id)))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Flashcard not found" });
      return;
    }
    res.json(flashcardRowToApi(updated));
  },
);

export default router;
