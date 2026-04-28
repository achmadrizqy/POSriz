import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  // Pecah string berdasarkan spasi
  const words = q.split(/\s+/).filter(w => w.length > 0);

  try {
    const products = await prisma.product.findMany({
      where: {
        AND: words.map(word => ({
          OR: [
            { name: { contains: word, mode: 'insensitive' } },
            { code: { contains: word, mode: 'insensitive' } }
          ]
        }))
      },
      take: 20,
      include: { tierPrices: true }
    });
    
    return NextResponse.json(products);
  } catch (error) {
    console.error("Search Error:", error);
    return NextResponse.json({ error: 'Gagal mencari produk' }, { status: 500 });
  }
}
