import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Query langsung ke DB: ambil produk yang stock <= minStock
    const lowStockProducts = await prisma.$queryRaw`
      SELECT id, code, name, stock, "minStock", price
      FROM "Product"
      WHERE stock <= "minStock"
      ORDER BY stock ASC
    `;

    return NextResponse.json(lowStockProducts);
  } catch (error) {
    console.error("Low stock error:", error);
    return NextResponse.json({ error: 'Gagal mengambil data stok kritis' }, { status: 500 });
  }
}
