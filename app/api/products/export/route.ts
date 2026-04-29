import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: { tierPrices: { orderBy: { minQty: "asc" } } },
    });

    const headers = ["kode", "nama", "stok", "harga_modal", "harga_jual", "min_stok", "harga_grosir"];
    const rows = products.map(p => {
      const tierJson = JSON.stringify(
        p.tierPrices.map(t => ({ minQty: t.minQty, price: t.price }))
      );
      return [
        p.code,
        `"${p.name.replace(/"/g, '""')}"`,
        p.stock,
        p.hargaModal,
        p.price,
        p.minStock,
        `"${tierJson.replace(/"/g, '""')}"`,
      ].join(";");
    });

    const csv = [headers.join(";"), ...rows].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="produk_${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: "Gagal export" }, { status: 500 });
  }
}
