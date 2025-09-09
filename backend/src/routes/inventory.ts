import { Router } from "express";
import { prisma } from "../db";
import { z } from "zod";
import { requireAuth } from "../middleware";

const router = Router();
router.use(requireAuth);

// Items
const itemSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  unit: z.string().default("pcs"),
  barcode: z.string().optional(),
  minStock: z.number().int().nonnegative().optional()
});

router.get("/items", async (_req, res) => {
  const items = await prisma.item.findMany({ orderBy: { id: "desc" } });
  res.json(items);
});

router.post("/items", async (req, res) => {
  const parsed = itemSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  try {
    const item = await prisma.item.create({ data: parsed.data });
    res.json(item);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.put("/items/:id", async (req, res) => {
  const parsed = itemSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const id = Number(req.params.id);
  const item = await prisma.item.update({ where: { id }, data: parsed.data });
  res.json(item);
});

router.delete("/items/:id", async (req, res) => {
  const id = Number(req.params.id);
  await prisma.item.delete({ where: { id } });
  res.json({ ok: true });
});

// Locations
const locationSchema = z.object({
  code: z.string().min(1),
  description: z.string().optional()
});

router.get("/locations", async (_req, res) => {
  const locations = await prisma.location.findMany({ orderBy: { id: "desc" } });
  res.json(locations);
});

router.post("/locations", async (req, res) => {
  const parsed = locationSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  try {
    const loc = await prisma.location.create({ data: parsed.data });
    res.json(loc);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Stock view
router.get("/stock", async (req, res) => {
  const { q } = req.query as { q?: string };
  const where = q ? { item: { OR: [{ sku: { contains: q } }, { name: { contains: q } }, { barcode: { contains: q } }] } } : {};
  const stock = await prisma.stock.findMany({
    where,
    include: { item: true, location: true },
    orderBy: [{ locationId: "asc" }, { itemId: "asc" }]
  });
  res.json(stock);
});

export default router;