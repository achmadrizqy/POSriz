import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const products = await prisma.product.findMany({
      orderBy: { stock: 'asc' }
    });

    // Filter produk yang stoknya <= minStock
    // Menggunakan cast opsional as any untuk properti minStock jika TS belum terupdate
    const lowStockProducts = products.filter((p: any) => p.stock <= (p.minStock ?? 5));

    return NextResponse.json(lowStockProducts);
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengambil data produk dengan stok kritis' }, { status: 500 });
  }
}
