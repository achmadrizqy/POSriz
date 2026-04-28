const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function exportData() {
  console.log("Memulai proses eksport data...");
  const products = await prisma.product.findMany({
    include: { tierPrices: true }
  });
  
  if (products.length === 0) {
    console.log("Tidak ada produk di database.");
    return;
  }

  // Header CSV
  const keys = ['id', 'code', 'name', 'stock', 'hargaModal', 'price', 'minStock', 'tierPrices'];
  const headers = keys.join(';');

  // Row Data
  const rows = products.map(p => {
    return keys.map(k => {
      let val = p[k];
      // Jika kolom adalah tierPrices (Array), simpan sebagai string JSON
      if (k === 'tierPrices') {
        val = JSON.stringify(val || []);
      }
      return `"${val !== undefined && val !== null ? val : ''}"`;
    }).join(';');
  });

  const csvContent = [headers, ...rows].join('\n');
  fs.writeFileSync('eksport_produk.csv', csvContent, 'utf8');
  
  console.log(`Berhasil mengekspor ${products.length} produk ke dalam file 'eksport_produk.csv' di folder utama aplikasi.`);
}

exportData()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
