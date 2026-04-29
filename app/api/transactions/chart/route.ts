import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "minggu"; // minggu | bulan | tahun

  const now = new Date();
  let start: Date;
  let groupFormat: "day" | "week" | "month";

  if (period === "minggu") {
    // 7 hari terakhir
    start = new Date(now);
    start.setDate(now.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    groupFormat = "day";
  } else if (period === "bulan") {
    // 30 hari terakhir
    start = new Date(now);
    start.setDate(now.getDate() - 29);
    start.setHours(0, 0, 0, 0);
    groupFormat = "day";
  } else {
    // 12 bulan terakhir
    start = new Date(now);
    start.setMonth(now.getMonth() - 11);
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    groupFormat = "month";
  }

  try {
    const transactions = await prisma.transaction.findMany({
      where: { createdAt: { gte: start } },
      select: { createdAt: true, grandTotal: true, paymentMethod: true },
      orderBy: { createdAt: "asc" },
    });

    // Build label array
    const labels: string[] = [];
    const labelMap = new Map<string, { pendapatan: number; transaksi: number }>();

    if (groupFormat === "day") {
      const days = period === "minggu" ? 7 : 30;
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const key = d.toISOString().split("T")[0]; // YYYY-MM-DD
        const label = d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
        labels.push(label);
        labelMap.set(key, { pendapatan: 0, transaksi: 0 });
      }
      for (const tx of transactions) {
        const key = tx.createdAt.toISOString().split("T")[0];
        const entry = labelMap.get(key);
        if (entry) {
          entry.pendapatan += tx.grandTotal;
          entry.transaksi += 1;
        }
      }
    } else {
      // monthly
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const label = d.toLocaleDateString("id-ID", { month: "short", year: "2-digit" });
        labels.push(label);
        labelMap.set(key, { pendapatan: 0, transaksi: 0 });
      }
      for (const tx of transactions) {
        const d = tx.createdAt;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const entry = labelMap.get(key);
        if (entry) {
          entry.pendapatan += tx.grandTotal;
          entry.transaksi += 1;
        }
      }
    }

    // Payment method breakdown
    const paymentBreakdown = new Map<string, number>();
    for (const tx of transactions) {
      const m = tx.paymentMethod || "TUNAI";
      paymentBreakdown.set(m, (paymentBreakdown.get(m) || 0) + tx.grandTotal);
    }

    const chartData = labels.map((label, i) => {
      const key = Array.from(labelMap.keys())[i];
      const entry = labelMap.get(key) || { pendapatan: 0, transaksi: 0 };
      return { label, ...entry };
    });

    const paymentData = Array.from(paymentBreakdown.entries()).map(([name, value]) => ({ name, value }));

    // Summary stats
    const totalPendapatan = transactions.reduce((s, t) => s + t.grandTotal, 0);
    const totalTransaksi = transactions.length;
    const rataRata = totalTransaksi > 0 ? Math.round(totalPendapatan / totalTransaksi) : 0;

    return NextResponse.json({ chartData, paymentData, totalPendapatan, totalTransaksi, rataRata });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
