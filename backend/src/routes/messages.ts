import { Router } from "express";
import { prisma } from "../db";
import { z } from "zod";
import { requireAuth, AuthRequest } from "../middleware";

const router = Router();
router.use(requireAuth);

// List available users to chat with (exclude self)
router.get("/users", async (req: AuthRequest, res) => {
  const meId = req.user!.id;
  const users = await prisma.user.findMany({
    where: { id: { not: meId } },
    select: { id: true, email: true, avatarUrl: true, role: true },
    orderBy: { id: "asc" },
  });
  res.json(users);
});

// Fetch conversation between me and another user
router.get("/", async (req: AuthRequest, res) => {
  const meId = req.user!.id;
  const otherId = Number(req.query.userId);
  if (!otherId) return res.status(400).json({ error: "Missing userId" });

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { fromUserId: meId, toUserId: otherId },
        { fromUserId: otherId, toUserId: meId },
      ],
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      fromUserId: true,
      toUserId: true,
      body: true,
      createdAt: true,
      readAt: true,
    },
  });

  res.json(messages);
});

// Send a message
router.post("/", async (req: AuthRequest, res) => {
  const meId = req.user!.id;
  const schema = z.object({
    toUserId: z.number().int().positive(),
    body: z.string().min(1),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const { toUserId, body } = parsed.data;

  const saved = await prisma.message.create({
    data: { fromUserId: meId, toUserId, body },
    select: {
      id: true, fromUserId: true, toUserId: true, body: true, createdAt: true, readAt: true,
    },
  });

  // Notify receiver in realtime (if connected) via Socket.IO
  req.app.get("io")?.to(`user:${toUserId}`).emit("message:new", saved);

  res.json(saved);
});

// Mark messages as read (optional)
router.post("/read", async (req: AuthRequest, res) => {
  const meId = req.user!.id;
  const schema = z.object({ userId: z.number().int().positive() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const { userId } = parsed.data;

  await prisma.message.updateMany({
    where: { fromUserId: userId, toUserId: meId, readAt: null },
    data: { readAt: new Date() },
  });

  res.json({ ok: true });
});

export default router;
