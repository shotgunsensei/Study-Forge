import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { CreateCheckoutSessionBody } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import { planOf } from "../lib/plans";

const router: IRouter = Router();

function isDemoMode(): boolean {
  return !process.env.STRIPE_SECRET_KEY;
}

router.get("/billing/status", requireAuth, async (req, res): Promise<void> => {
  const user = req.user!;
  res.json({
    plan: planOf(user),
    demoMode: isDemoMode(),
    renewsAt: null,
    cancelAtPeriodEnd: false,
  });
});

router.post("/billing/checkout", requireAuth, async (req, res): Promise<void> => {
  const user = req.user!;
  const parsed = CreateCheckoutSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  if (isDemoMode()) {
    // In demo mode, instantly upgrade the user so the full product surface is usable.
    await db
      .update(usersTable)
      .set({ plan: parsed.data.plan })
      .where(eq(usersTable.id, user.id));
    res.json({
      url: null,
      demoMode: true,
      message: `Demo mode: instantly upgraded to ${parsed.data.plan.toUpperCase()}. In production this opens Stripe Checkout.`,
      plan: parsed.data.plan,
    });
    return;
  }
  res.json({
    url: null,
    demoMode: false,
    message: "Stripe checkout would open here in production.",
    plan: parsed.data.plan,
  });
});

router.post("/billing/portal", requireAuth, async (req, res): Promise<void> => {
  const user = req.user!;
  if (isDemoMode()) {
    // In demo mode, downgrade the user back to free as a "cancel".
    await db
      .update(usersTable)
      .set({ plan: "free" })
      .where(eq(usersTable.id, user.id));
    res.json({
      url: null,
      demoMode: true,
      message: "Demo mode: subscription canceled and reset to FREE. In production this opens the Stripe billing portal.",
      plan: "free",
    });
    return;
  }
  res.json({
    url: null,
    demoMode: false,
    message: "Stripe billing portal would open here in production.",
    plan: planOf(user),
  });
});

export default router;
