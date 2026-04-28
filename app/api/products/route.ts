import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const isPaginated = searchParams.get('paginated') === 'true';

  try {
    if (!isPaginated) {
      // Endpoint fallback original untuk memory load (kasir)
      const products = await prisma.product.findMany({
        orderBy: { createdAt: 'desc' },
        include: { tierPrices: true }
      });
      return NextResponse.json(products);
    }

    // Eksekusi untuk Master Data dengan pagination & search
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    const search = searchParams.get('search') || '';
    const skip = (page - 1) * limit;

    let whereClause = {};
    if (search.length >= 2) {
      const words = search.split(/\s+/).filter(w => w.length > 0);
      whereClause = {
        AND: words.map(word => ({
          OR: [
            { name: { contains: word, mode: 'insensitive' } },
            { code: { contains: word, mode: 'insensitive' } }
          ]
        }))
      };
    }

    const [products, totalItems] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { tierPrices: { orderBy: { minQty: 'asc' } } }
      }),
      prisma.product.count({ where: whereClause })
    ]);

    const totalPages = Math.ceil(totalItems / limit) || 1;

    return NextResponse.json({
      data: products,
      meta: {
        total: totalItems,
        page,
        limit,
        totalPages
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengambil data produk' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, name, stock, price, hargaModal, minStock, tierPrices } = body;

    const existingProduct = await prisma.product.findUnique({
      where: { code }
    });

    if (existingProduct) {
      return NextResponse.json({ error: 'Kode produk sudah digunakan' }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        code,
        name,
        stock: parseInt(stock),
        hargaModal: parseInt(hargaModal || 0),
        price: parseInt(price),
        minStock: parseInt(minStock) || 5,
        ...(tierPrices && tierPrices.length > 0 ? {
          tierPrices: {
            create: tierPrices.map((t: any) => ({
              minQty: parseInt(t.minQty),
              price: parseInt(t.price)
            }))
          }
        } : {})
      } as any
    });

    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json({ error: 'Gagal menambah produk' }, { status: 500 });
  }
}
