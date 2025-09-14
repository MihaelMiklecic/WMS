import { Router } from "express";
import { prisma } from "../db";
import { z } from "zod";
import { requireAuth, requirePerm } from "../middleware";

const router = Router();
router.use(requireAuth);

const stocktakeSchema = z.object({
  number: z.string().min(1),
  date: z.string().optional(),
  lines: z
    .array(
      z.object({
        itemId: z.number().int().positive(),
        locationId: z.number().int().positive(),
        countedQty: z.number().int().nonnegative(),
      })
    )
    .min(1),
});

router.get("/", async (_req, res) => {
  const rows = await prisma.stocktake.findMany({
    include: { lines: true },
    orderBy: { id: "desc" },
  });
  res.json(rows);
});

router.post("/", requirePerm("stocktakes.edit"), async (req, res) => {
  const parsed = stocktakeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const { number, date, lines } = parsed.data;
  const row = await prisma.stocktake.create({
    data: {
      number,
      date: date ? new Date(date) : undefined,
      lines: { create: lines },
    },
    include: { lines: true },
  });
  res.json(row);
});

router.post("/:id/post", requirePerm("stocktakes.post"), async (req, res) => {
  const id = Number(req.params.id);
  const st = await prisma.stocktake.update({
    where: { id },
    data: { status: "posted" },
    include: { lines: true },
  });

  for (const line of st.lines) {
    await prisma.stock.upsert({
      where: {
        itemId_locationId: { itemId: line.itemId, locationId: line.locationId },
      },
      update: { quantity: line.countedQty },
      create: {
        itemId: line.itemId,
        locationId: line.locationId,
        quantity: line.countedQty,
      },
    });
  }
  res.json({ ok: true });
});

router.put("/:id", requirePerm("stocktakes.edit"), async (req, res) => {
  const id = Number(req.params.id);
  const parsed = stocktakeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const { number, date, lines } = parsed.data;

  const current = await prisma.stocktake.findUnique({ where: { id } });
  if (!current) return res.status(404).json({ error: "Not found" });
  if (current.status !== "draft") return res.status(400).json({ error: "Samo nacrti mogu se urediti" });

  const updated = await prisma.$transaction(async (tx) => {
    await tx.stocktakeLine.deleteMany({ where: { stocktakeId: id } });
    return tx.stocktake.update({
      where: { id },
      data: {
        number,
        date: date ? new Date(date) : undefined,
        lines: { create: lines },
      },
      include: { lines: true },
    });
  });

  res.json(updated);
});

router.delete("/:id", requirePerm("stocktakes.edit"), async (req, res) => {
  const id = Number(req.params.id);

  const current = await prisma.stocktake.findUnique({ where: { id } });
  if (!current) return res.status(404).json({ error: "Not found" });
  if (current.status === "posted") return res.status(400).json({ error: "Proknjižene inventure se ne mogu obrisati" });

  await prisma.$transaction([
    prisma.stocktakeLine.deleteMany({ where: { stocktakeId: id } }),
    prisma.stocktake.delete({ where: { id } }),
  ]);

  res.status(204).end();
});

export default router;
