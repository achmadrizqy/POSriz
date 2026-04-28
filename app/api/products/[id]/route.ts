import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { code, name, stock, price, hargaModal, minStock, tierPrices } = body;

    const existing = await prisma.product.findUnique({
      where: { code }
    });

    if (existing && existing.id !== params.id) {
       return NextResponse.json({ error: 'Maaf, Kode Produk ini sudah digunakan oleh barang lain.' }, { status: 400 });
    }

    // Delete existing tier prices first
    await prisma.productTierPrice.deleteMany({
      where: { productId: params.id }
    });

    const product = await prisma.product.update({
      where: { id: params.id },
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
    return NextResponse.json({ error: 'Gagal mengupdate produk' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.product.delete({
      where: { id: params.id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal menghapus produk' }, { status: 500 });
  }
}
