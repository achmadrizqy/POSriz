import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, discount, total, grandTotal, paymentMethod } = body;

    const transaction = await prisma.$transaction(async (tx: any) => {
      const newTransaction = await tx.transaction.create({
        data: {
          discount,
          total,
          grandTotal,
          paymentMethod: paymentMethod || "TUNAI",
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              name: item.name,
              qty: item.qty,
              price: item.price,
              itemDiscount: item.itemDiscount || 0,
              subtotal: item.subtotal
            }))
          }
        },
        include: { items: true }
      });

      for (const item of items) {
        if (item.productId) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.qty } }
          });
        }
      }
      return newTransaction;
    });

    return NextResponse.json(transaction);
  } catch (error: any) {
    console.error("Transaction Error:", error);
    return NextResponse.json({ error: 'Gagal memproses transaksi: ' + error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  const paymentMethod = searchParams.get('paymentMethod');
  const sort = searchParams.get('sort') || 'desc';
  const startDateStr = searchParams.get('startDate');
  const endDateStr = searchParams.get('endDate');
  
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '15');
  const skip = (page - 1) * limit;

  const whereClause: any = {};
  
  // Custom Date Range Priority
  if (startDateStr && endDateStr) {
    const start = new Date(startDateStr);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDateStr);
    end.setHours(23, 59, 59, 999);
    whereClause.createdAt = { gte: start, lte: end };
  } else if (searchParams.get('filter') === 'hari') {
    const start = new Date();
    start.setHours(0,0,0,0);
    whereClause.createdAt = { gte: start };
  } else if (searchParams.get('filter') === 'bulan') {
    const start = new Date();
    start.setDate(1);
    start.setHours(0,0,0,0);
    whereClause.createdAt = { gte: start };
  }

  if (paymentMethod && paymentMethod !== 'Semua' && paymentMethod !== 'semua') {
    whereClause.paymentMethod = paymentMethod;
  }

  const sortOrder = sort === 'asc' ? 'asc' : 'desc';

  try {
    const [transactions, totalItems, aggregate] = await Promise.all([
      prisma.transaction.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: sortOrder },
        include: { items: true }
      }),
      prisma.transaction.count({ where: whereClause }),
      prisma.transaction.aggregate({
        where: whereClause,
        _sum: { grandTotal: true },
      })
    ]);

    const sumIncome = aggregate._sum.grandTotal || 0;
    const totalPages = Math.ceil(totalItems / limit) || 1;

    return NextResponse.json({
      data: transactions,
      meta: {
        total: totalItems,
        page,
        limit,
        totalPages,
        sumIncome
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengambil riwayat transaksi' }, { status: 500 });
  }
}
