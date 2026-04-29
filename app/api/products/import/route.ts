import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });

    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length <= 1) return NextResponse.json({ error: "File CSV kosong" }, { status: 400 });

    // Skip header row
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      // Parse CSV dengan pemisah titik koma
      const cols = lines[i].split(";").map(c => c.replace(/^"|"$/g, "").replace(/""/g, '"'));
      if (cols.length < 6) { skipped++; continue; }

      const [code, name, stockStr, hargaModalStr, priceStr, minStockStr, tierJson] = cols;
      if (!code || !name) { skipped++; continue; }

      const stock = parseInt(stockStr) || 0;
      const hargaModal = parseInt(hargaModalStr) || 0;
      const price = parseInt(priceStr) || 0;
      const minStock = parseInt(minStockStr) || 5;

      let tierPrices: { minQty: number; price: number }[] = [];
      try {
        if (tierJson) tierPrices = JSON.parse(tierJson);
      } catch { /* abaikan jika gagal parse */ }

      try {
        const product = await prisma.product.upsert({
          where: { code: code.toUpperCase() },
          update: { name, stock, hargaModal, price, minStock },
          create: { code: code.toUpperCase(), name, stock, hargaModal, price, minStock },
        });

        // Update tier prices
        await prisma.productTierPrice.deleteMany({ where: { productId: product.id } });
        if (tierPrices.length > 0) {
          await prisma.productTierPrice.createMany({
            data: tierPrices.map(t => ({
              productId: product.id,
              minQty: parseInt(String(t.minQty)) || 0,
              price: parseInt(String(t.price)) || 0,
            })),
          });
        }
        imported++;
      } catch (e: any) {
        errors.push(`Baris ${i + 1} (${code}): ${e.message}`);
        skipped++;
      }
    }

    return NextResponse.json({ imported, skipped, errors });
  } catch (e: any) {
    return NextResponse.json({ error: "Gagal memproses file: " + e.message }, { status: 500 });
  }
}
