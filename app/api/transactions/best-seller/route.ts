import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startDateStr = searchParams.get("startDate");
  const endDateStr = searchParams.get("endDate");
  const limit = parseInt(searchParams.get("limit") || "10");

  const whereClause: any = {};
  if (startDateStr && endDateStr) {
    const start = new Date(startDateStr);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDateStr);
    end.setHours(23, 59, 59, 999);
    whereClause.transaction = { createdAt: { gte: start, lte: end } };
  }

  try {
    // Ambil semua transaction items dalam rentang waktu
    const items = await prisma.transactionItem.findMany({
      where: whereClause,
      select: { name: true, qty: true, subtotal: true, productId: true },
    });

    // Agregasi manual per nama produk
    const map = new Map<string, { name: string; totalQty: number; totalRevenue: number }>();
    for (const item of items) {
      const key = item.name;
      const existing = map.get(key);
      if (existing) {
        existing.totalQty += item.qty;
        existing.totalRevenue += item.subtotal;
      } else {
        map.set(key, { name: item.name, totalQty: item.qty, totalRevenue: item.subtotal });
      }
    }

    const result = Array.from(map.values())
      .sort((a, b) => b.totalQty - a.totalQty)
      .slice(0, limit);

    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: "Gagal mengambil data: " + e.message }, { status: 500 });
  }
}
