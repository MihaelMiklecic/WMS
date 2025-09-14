import { Router } from "express";
import { prisma } from "../db";
import { z } from "zod";
import { requireAuth } from "../middleware";

const router = Router();
router.use(requireAuth);

const dispatchSchema = z.object({
  number: z.string().min(1),
  customer: z.string().optional(),
  date: z.string().optional(),
  lines: z.array(z.object({
    itemId: z.number().int().positive(),
    locationId: z.number().int().positive(),
    qty: z.number().int().positive()
  })).min(1)
});

router.get("/", async (_req, res) => {
  const rows = await prisma.dispatch.findMany({ include: { lines: true }, orderBy: { id: "desc" } });
  res.json(rows);
});

router.post("/", async (req, res) => {
  const parsed = dispatchSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const { number, customer, date, lines } = parsed.data;
  const row = await prisma.dispatch.create({
    data: {
      number,
      customer,
      date: date ? new Date(date) : undefined,
      lines: { create: lines }
    },
    include: { lines: true }
  });
  res.json(row);
});

router.post("/:id/post", async (req, res) => {
  const id = Number(req.params.id);
  const doc = await prisma.dispatch.update({ where: { id }, data: { status: "posted" }, include: { lines: true } });
  for (const line of doc.lines) {
    await prisma.stock.upsert({
      where: { itemId_locationId: { itemId: line.itemId, locationId: line.locationId } },
      update: { quantity: { decrement: line.qty } },
      create: { itemId: line.itemId, locationId: line.locationId, quantity: -line.qty }
    });
  }
  res.json({ ok: true });
});

router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const parsed = dispatchSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const { number, customer, date, lines } = parsed.data;

  const current = await prisma.dispatch.findUnique({ where: { id } });
  if (!current) return res.status(404).json({ error: "Not found" });
  if (current.status !== "draft") return res.status(400).json({ error: "Samo nacrti mogu se urediti" });

  const updated = await prisma.$transaction(async (tx) => {
    await tx.dispatchLine.deleteMany({ where: { dispatchId: id } });
    return tx.dispatch.update({
      where: { id },
      data: {
        number,
        customer,
        date: date ? new Date(date) : undefined,
        lines: { create: lines }
      },
      include: { lines: true }
    });
  });

  res.json(updated);
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);

  const current = await prisma.dispatch.findUnique({ where: { id } });
  if (!current) return res.status(404).json({ error: "Not found" });
  if (current.status === "posted") return res.status(400).json({ error: "Proknjižene otpremnice se ne mogu obrisati" });

  await prisma.$transaction([
    prisma.dispatchLine.deleteMany({ where: { dispatchId: id } }),
    prisma.dispatch.delete({ where: { id } }),
  ]);

  res.status(204).end();
});

export default router;