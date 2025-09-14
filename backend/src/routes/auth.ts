import { Router } from "express";
import { prisma } from "../db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { requireAuth } from "../middleware";


const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["admin", "user"]).optional()
});

router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const { email, password } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: "Email already registered" });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { email, passwordHash, role: "user" } });
  res.json({ id: user.id, email: user.email });
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});



router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const perms = await prisma.userPermission.findMany({
    where: { userId: user.id },
    select: { perm: true },
  });

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, perms: perms.map(p => p.perm) },
    process.env.JWT_SECRET as string,
    { expiresIn: "1d" }
  );
  res.json({ token });
});

router.get("/me", requireAuth, async (req: any, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, email: true, role: true, avatarUrl: true }, 
  });
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});



export default router;
