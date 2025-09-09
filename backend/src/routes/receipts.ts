import { Router } from "express";
import { prisma } from "../db";
import { z } from "zod";
import { requireAuth } from "../middleware";

const router = Router();
router.use(requireAuth);

const receiptSchema = z.object({
  number: z.string().min(1),
  supplier: z.string().optional(),
  date: z.string().optional(), // ISO
  lines: z.array(z.object({
    itemId: z.number().int().positive(),
    locationId: z.number().int().positive(),
    qty: z.number().int().positive()
  })).min(1)
});

router.get("/", async (_req, res) => {
  const receipts = await prisma.receipt.findMany({ include: { lines: true }, orderBy: { id: "desc" } });
  res.json(receipts);
});

router.post("/", async (req, res) => {
  const parsed = receiptSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const { number, supplier, date, lines } = parsed.data;
  const receipt = await prisma.receipt.create({
    data: {
      number,
      supplier,
      date: date ? new Date(date) : undefined,
      lines: { create: lines }
    },
    include: { lines: true }
  });
  res.json(receipt);
});

router.post("/:id/post", async (req, res) => {
  const id = Number(req.params.id);
  const receipt = await prisma.receipt.update({ where: { id }, data: { status: "posted" }, include: { lines: true } });
  // Update stock quantities
  for (const line of receipt.lines) {
    await prisma.stock.upsert({
      where: { itemId_locationId: { itemId: line.itemId, locationId: line.locationId } },
      update: { quantity: { increment: line.qty } },
      create: { itemId: line.itemId, locationId: line.locationId, quantity: line.qty }
    });
  }
  res.json({ ok: true });
});

export default router;