import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { LoginBody, SignupBody } from "@workspace/api-zod";
import {
  createSessionCookie,
  destroySession,
  getCurrentUser,
  hashPassword,
  verifyPassword,
} from "../lib/auth";

const router: IRouter = Router();

function userToSession(u: { id: number; email: string; name: string; role: string; plan: string; createdAt: Date }) {
  return {
    user: {
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      plan: u.plan,
      createdAt: u.createdAt.toISOString(),
    },
  };
}

router.get("/auth/me", async (req, res): Promise<void> => {
  const user = await getCurrentUser(req);
  if (!user) {
    res.json({ user: null });
    return;
  }
  res.json(userToSession(user));
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const email = parsed.data.email.toLowerCase().trim();
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  await createSessionCookie(res, user.id);
  res.json(userToSession(user));
});

router.post("/auth/signup", async (req, res): Promise<void> => {
  const parsed = SignupBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const email = parsed.data.email.toLowerCase().trim();
  if (parsed.data.password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing) {
    res.status(400).json({ error: "An account with that email already exists" });
    return;
  }
  const [user] = await db
    .insert(usersTable)
    .values({
      email,
      name: parsed.data.name.trim() || email.split("@")[0],
      passwordHash: hashPassword(parsed.data.password),
      role: "student",
      plan: "free",
    })
    .returning();
  await createSessionCookie(res, user.id);
  res.json(userToSession(user));
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  await destroySession(req, res);
  res.json({ ok: true });
});

export default router;
