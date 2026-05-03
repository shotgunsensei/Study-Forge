import { Router, type IRouter } from "express";
import { eq, and, inArray } from "drizzle-orm";
import { db, foldersTable, studySetsTable } from "@workspace/db";
import { CreateFolderBody } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/folders", requireAuth, async (req, res): Promise<void> => {
  const user = req.user!;
  const folders = await db.select().from(foldersTable).where(eq(foldersTable.userId, user.id));
  if (folders.length === 0) {
    res.json([]);
    return;
  }
  const ids = folders.map((f) => f.id);
  const sets = await db
    .select()
    .from(studySetsTable)
    .where(and(eq(studySetsTable.userId, user.id), inArray(studySetsTable.folderId, ids)));
  const counts = new Map<number, number>();
  for (const s of sets) if (s.folderId != null) counts.set(s.folderId, (counts.get(s.folderId) ?? 0) + 1);
  res.json(
    folders.map((f) => ({
      id: f.id,
      name: f.name,
      color: f.color,
      studySetCount: counts.get(f.id) ?? 0,
    })),
  );
});

router.post("/folders", requireAuth, async (req, res): Promise<void> => {
  const user = req.user!;
  const parsed = CreateFolderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const [folder] = await db
    .insert(foldersTable)
    .values({
      userId: user.id,
      name: parsed.data.name.trim(),
      color: parsed.data.color || "#7c3aed",
    })
    .returning();
  res.status(201).json({ id: folder.id, name: folder.name, color: folder.color, studySetCount: 0 });
});

router.delete("/folders/:id", requireAuth, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const user = req.user!;
  const [folder] = await db
    .select()
    .from(foldersTable)
    .where(and(eq(foldersTable.id, id), eq(foldersTable.userId, user.id)));
  if (!folder) {
    res.status(404).json({ error: "Folder not found" });
    return;
  }
  await db
    .update(studySetsTable)
    .set({ folderId: null })
    .where(eq(studySetsTable.folderId, id));
  await db.delete(foldersTable).where(eq(foldersTable.id, id));
  res.json({ ok: true });
});

export default router;
