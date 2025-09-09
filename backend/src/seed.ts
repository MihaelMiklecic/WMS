import { prisma } from "./db";
import bcrypt from "bcryptjs";

async function main() {
  const adminEmail = "admin@example.com";
  const passwordHash = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: { email: adminEmail, passwordHash, role: "admin" }
  });

  const locA = await prisma.location.upsert({
    where: { code: "A-01" },
    update: {},
    create: { code: "A-01", description: "Shelf A-01" }
  });
  const locB = await prisma.location.upsert({
    where: { code: "B-01" },
    update: {},
    create: { code: "B-01", description: "Shelf B-01" }
  });

  const item1 = await prisma.item.upsert({
    where: { sku: "SKU-001" },
    update: {},
    create: { sku: "SKU-001", name: "Test Item 1", unit: "pcs", barcode: "111111" }
  });
  const item2 = await prisma.item.upsert({
    where: { sku: "SKU-002" },
    update: {},
    create: { sku: "SKU-002", name: "Test Item 2", unit: "pcs", barcode: "222222" }
  });

  await prisma.stock.upsert({
    where: { itemId_locationId: { itemId: item1.id, locationId: locA.id } },
    update: { quantity: 10 },
    create: { itemId: item1.id, locationId: locA.id, quantity: 10 }
  });

  console.log("Seeded admin user and sample data.");
}

main().finally(() => prisma.$disconnect());