import { Router } from "express";
import { prisma } from "../db";
import { z } from "zod";
import { requireAuth, requirePerm } from "../middleware";
import multer from "multer";
import path from "path";


const router = Router();
router.use(requireAuth);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.resolve(process.cwd(), "uploads/items")),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".bin";
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});
const upload = multer({ storage });


const itemSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  unit: z.string().default("pcs"),
  barcode: z.string().optional(),
  minStock: z.number().int().nonnegative().optional(),
});

router.get("/items", async (_req, res) => {
  const items = await prisma.item.findMany({ orderBy: { id: "desc" } });
  res.json(items);
});

router.post("/items", requirePerm("items.edit"), async (req, res) => {
  const parsed = itemSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  try {
    const item = await prisma.item.create({ data: parsed.data });
    res.json(item);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.put("/items/:id", requirePerm("items.edit"), async (req, res) => {
  const parsed = itemSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const id = Number(req.params.id);
  const item = await prisma.item.update({ where: { id }, data: parsed.data });
  res.json(item);
});

router.delete("/items/:id", requirePerm("items.edit"), async (req, res) => {
  const id = Number(req.params.id);
  await prisma.item.delete({ where: { id } });
  res.json({ ok: true });
});

router.get("/items/with-qty", async (req, res) => {
  const { q } = req.query as { q?: string };

  const items = await prisma.item.findMany({
    where: q
      ? {
          OR: [
            { sku:     { contains: q } },
            { name:    { contains: q } },
            { barcode: { contains: q } },
          ],
        }
      : undefined,
    orderBy: { id: "desc" },
  });

  if (items.length === 0) return res.json([]);

  const grouped = await prisma.stock.groupBy({
    by: ["itemId"],
    _sum: { quantity: true },
    where: q
      ? {
          item: {
            is: {
              OR: [
                { sku:     { contains: q } },
                { name:    { contains: q } },
                { barcode: { contains: q } },
              ],
            },
          },
        }
      : undefined,
  });

  const sums = new Map(grouped.map(g => [g.itemId, g._sum?.quantity ?? 0]));
  const withQty = items.map(i => ({ ...i, totalQty: sums.get(i.id) ?? 0 }));
  res.json(withQty);
});


const locationSchema = z.object({
  code: z.string().min(1),
  description: z.string().optional(),
});

router.get("/locations", async (_req, res) => {
  const locations = await prisma.location.findMany({ orderBy: { id: "desc" } });
  res.json(locations);
});

router.post("/locations", requirePerm("locations.edit"), async (req, res) => {
  const parsed = locationSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  try {
    const loc = await prisma.location.create({ data: parsed.data });
    res.json(loc);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.get("/stock", async (req, res) => {
  const { q } = req.query as { q?: string };

  const where = q
    ? {
        item: {
          is: {
            OR: [
              { sku:     { contains: q } },
              { name:    { contains: q } },
              { barcode: { contains: q } },
            ],
          },
        },
      }
    : {};

  const stock = await prisma.stock.findMany({
    where,
    include: { item: true, location: true },
    orderBy: [{ locationId: "asc" }, { itemId: "asc" }],
  });

  res.json(stock);
});

router.post(
  "/items/:id/image",
  requirePerm("items.edit"),
  upload.single("file"),
  async (req, res) => {
    const id = Number(req.params.id);
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const url = `/uploads/items/${req.file.filename}`;

    const item = await prisma.item.update({
      where: { id },
      data: { imageUrl: url },
    });

    res.json({ ok: true, imageUrl: item.imageUrl });
  }
);




export default router;
