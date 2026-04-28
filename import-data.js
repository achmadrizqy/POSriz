const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function importData() {
  const filePath = 'eksport_produk.csv';
  
  if (!fs.existsSync(filePath)) {
    console.log(`File ${filePath} tidak ditemukan.`);
    return;
  }

  console.log("Memulai proses impor data...");
  const csvData = fs.readFileSync(filePath, 'utf8');
  
  const lines = csvData.split('\\n').filter(line => line.trim() !== '');
  if (lines.length <= 1) {
    console.log("File CSV kosong atau tidak ada data selain header.");
    return;
  }

  // Mengabaikan baris ke-1 (header)
  let count = 0;
  for (let i = 1; i < lines.length; i++) {
    // Membaca pisahan tiap kolom
    const cols = lines[i].split(';').map(col => col.replace(/^"|"$/g, ''));
    
    // Asumsi Urutan: ['id', 'code', 'name', 'stock', 'hargaModal', 'price', 'minStock']
    if (cols.length < 6) continue;

    const code = cols[1];
    const name = cols[2];
    const stock = parseInt(cols[3]) || 0;
    const hargaModal = parseInt(cols[4]) || 0;
    const price = parseInt(cols[5]) || 0;
    const minStock = cols[6] ? parseInt(cols[6]) : 5;
    
    // Ambil data harga grosir dari kolom ke-8 (index 7)
    let tierPrices = [];
    try {
      if (cols[7]) {
        // Bersihkan escape quote jika ada (Standard CSV)
        const rawJson = cols[7].replace(/""/g, '"');
        tierPrices = JSON.parse(rawJson);
      }
    } catch (e) {
      console.warn(`Peringatan: Gagal membaca harga grosir untuk produk ${code}`);
    }

    // Lakukan Upsert (Jika kode barang sudah ada, akan diupdate. Jika belum, tambah baru)
    const product = await prisma.product.upsert({
      where: { code: code },
      update: { name, stock, hargaModal, price, minStock },
      create: { code, name, stock, hargaModal, price, minStock }
    });

    // Update Harga Grosir: Hapus yang lama, buat yang baru
    await prisma.productTierPrice.deleteMany({ where: { productId: product.id } });
    if (tierPrices.length > 0) {
      await prisma.productTierPrice.createMany({
        data: tierPrices.map(t => ({
          productId: product.id,
          minQty: parseInt(t.minQty) || 0,
          price: parseInt(t.price) || 0
        }))
      });
    }

    count++;
  }

  console.log(`Sukses! Sebanyak ${count} produk telah berhasil dimasukkan/diperbarui ke dalam database baru.`);
}

importData()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
