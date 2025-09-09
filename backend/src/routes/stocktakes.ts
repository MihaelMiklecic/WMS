import { Router } from "express";
import { prisma } from "../db";
import { z } from "zod";
import { requireAuth } from "../middleware";

const router = Router();
router.use(requireAuth);

const stocktakeSchema = z.object({
  number: z.string().min(1),
  date: z.string().optional(),
  lines: z.array(z.object({
    itemId: z.number().int().positive(),
    locationId: z.number().int().positive(),
    countedQty: z.number().int().nonnegative()
  })).min(1)
});

router.get("/", async (_req, res) => {
  const rows = await prisma.stocktake.findMany({ include: { lines: true }, orderBy: { id: "desc" } });
  res.json(rows);
});

router.post("/", async (req, res) => {
  const parsed = stocktakeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const { number, date, lines } = parsed.data;
  const row = await prisma.stocktake.create({
    data: {
      number,
      date: date ? new Date(date) : undefined,
      lines: { create: lines }
    },
    include: { lines: true }
  });
  res.json(row);
});

router.post("/:id/post", async (req, res) => {
  const id = Number(req.params.id);
  const st = await prisma.stocktake.update({ where: { id }, data: { status: "posted" }, include: { lines: true } });
  // Reconcile stock to counted quantities
  for (const line of st.lines) {
    await prisma.stock.upsert({
      where: { itemId_locationId: { itemId: line.itemId, locationId: line.locationId } },
      update: { quantity: line.countedQty },
      create: { itemId: line.itemId, locationId: line.locationId, quantity: line.countedQty }
    });
  }
  res.json({ ok: true });
});

export default router;