import { Router } from "express";
import { prisma } from "../db";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { requireAdmin, requireAuth, requirePerm } from "../middleware";
import multer from "multer";
import path from "path";

const router = Router();
router.use(requireAuth);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.resolve(process.cwd(), "uploads/avatars"));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".bin";
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});
const upload = multer({ storage });

const upsertSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).optional(),
  role: z.enum(["admin", "user"]),
  perms: z.array(z.string()).default([]),
});

type UserRow = {
  id: number;
  email: string;
  role: string;
  createdAt: Date;
  avatarUrl: string | null;
  permissions: { perm: string }[];
};

router.get("/", async (_req, res) => {
  const rows = await prisma.user.findMany({
    orderBy: { id: "asc" },
    include: { permissions: { select: { perm: true } } },
  });

  const users = rows as unknown as UserRow[];

  res.json(
    users.map((u) => ({
      id: u.id,
      email: u.email,
      role: u.role,
      avatarUrl: u.avatarUrl ?? null,
      perms: u.permissions.map((p) => p.perm),
      createdAt: u.createdAt,
    }))
  );
});

router.post("/", async (req, res) => {
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const { email, password, role, perms } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: "Email already exists" });

  const passwordHash = await bcrypt.hash(password ?? "changeme123", 10);
  const created = (await prisma.user.create({
    data: {
      email,
      passwordHash,
      role,
      permissions: { create: perms.map((perm) => ({ perm })) },
    },
    include: { permissions: true },
  })) as unknown as UserRow;

  res.json({
    id: created.id,
    email: created.email,
    role: created.role,
    avatarUrl: created.avatarUrl ?? null,
    perms: created.permissions.map((p) => p.perm),
  });
});

router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const parsed = upsertSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const { email, password, role, perms } = parsed.data;

  const updates: any = {};
  if (email) updates.email = email;
  if (role) updates.role = role;
  if (password) updates.passwordHash = await bcrypt.hash(password, 10);

  const updated = (await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id },
      data: updates,
    });

    if (perms) {
      await tx.userPermission.deleteMany({ where: { userId: id } });
      await tx.userPermission.createMany({
        data: perms.map((perm) => ({ userId: id, perm })),
        skipDuplicates: true,
      });
    }

    return tx.user.findUnique({
      where: { id },
      include: { permissions: true },
    });
  })) as unknown as UserRow | null;

  if (!updated) return res.status(404).json({ error: "User not found" });

  res.json({
    id: updated.id,
    email: updated.email,
    role: updated.role,
    avatarUrl: updated.avatarUrl ?? null,
    perms: updated.permissions.map((p) => p.perm),
  });
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  await prisma.user.delete({ where: { id } });
  res.status(204).end();
});


router.post(
  "/:id/avatar",
  requirePerm("user.change.icon"),
  upload.single("file"),
  async (req, res) => {
    const id = Number(req.params.id);
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const url = `/uploads/avatars/${req.file.filename}`;

    const user = await prisma.user.update({
      where: { id },
      data: { avatarUrl: url } as any,
    });
    res.json({ ok: true, avatarUrl: (user as any).avatarUrl ?? null });
  }
);

export default router;
