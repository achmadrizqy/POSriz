import { NextResponse } from 'next/server';
const ThermalPrinter = require("node-thermal-printer").printer;
const PrinterTypes = require("node-thermal-printer").types;

// Tambahan bawaan Node.js untuk mengeksekusi trik Windows CMD
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { transaction, printerName } = body;

    // Nama ini SEKARANG merujuk pada "Share Name" yang baru saja Anda buat di Langkah 1
    const targetPrinter = printerName || "POS58";

    // Kita buang pengaturan "interface" dan "driver" yang bikin error tadi
    let printer = new ThermalPrinter({
      type: PrinterTypes.EPSON,
      interface: 'dummy',
      width: 32,
      removeSpecialCharacters: false,
      lineCharacter: "-",
    });

    printer.alignCenter();
    printer.println("TOKO RIZQY");
    printer.println("Jl. Raya Wendit Barat No 2H");
    printer.println("Krajan, Mangliawan,Kec. Pakis");
    printer.println("Kab. Malang, Jatim 65154");
    printer.drawLine();

    printer.alignLeft();
    // Menggunakan en-GB agar jam tampil dengan titik dua (:) dan format tanggal DD/MM/YYYY
    printer.println(`Tgl : ${new Date(transaction.createdAt).toLocaleString('en-GB')}`);
    printer.println(`ID  : ${transaction.id.slice(-6).toUpperCase()}`);
    printer.println(`Bayar: ${transaction.paymentMethod || "TUNAI"}`);
    printer.alignCenter();
    printer.drawLine();
    printer.alignLeft();

    for (const item of transaction.items) {
      printer.println(item.name);
      const formatPrice = Number(item.price).toLocaleString('id-ID');
      const formatSubtotal = Number(item.subtotal).toLocaleString('id-ID');
      printer.leftRight(`  ${item.qty}x ${formatPrice}`, formatSubtotal);
      if (item.itemDiscount && item.itemDiscount > 0) {
        printer.leftRight(`  Disc/Item`, `-${Number(item.itemDiscount).toLocaleString('id-ID')}`);
      }
    }

    printer.alignCenter();
    printer.drawLine();
    printer.alignLeft();

    const formatTotal = Number(transaction.total).toLocaleString('id-ID');
    printer.leftRight("Sub Total", formatTotal);

    if (transaction.discount > 0) {
      const formatDisc = Number(transaction.discount).toLocaleString('id-ID');
      printer.leftRight("Diskon", `-${formatDisc}`);
    }

    const formatGrand = Number(transaction.grandTotal).toLocaleString('id-ID');
    printer.leftRight("GRAND TOTAL", formatGrand);

    printer.alignCenter();
    printer.drawLine();

    printer.println("Terima Kasih");
    printer.println("Barang yang sudah dibeli");
    printer.println("tidak dapat ditukar/dikembalikan");
    printer.cut();

    // ================================================================
    // TRIK JALUR BELAKANG: MENGIRIM RAW DATA VIA WINDOWS CMD
    // ================================================================
    try {
      // 1. Ambil data mentah (raw buffer) dari desain struk di atas
      const buffer = printer.getBuffer();

      // 2. Buat file sementara di dalam folder proyek
      const tempFile = path.join(process.cwd(), 'temp_struk.bin');
      fs.writeFileSync(tempFile, buffer);

      // 3. Perintahkan Windows Command Line untuk mengirim file tersebut ke printer sharing
      const printCommand = `copy /B "${tempFile}" "\\\\localhost\\${targetPrinter}"`;

      exec(printCommand, (error: any) => {
        if (error) {
          console.error("Gagal mengirim ke printer Windows:", error);
        }
        // Hapus file sementaranya setelah terkirim agar laptop tetap bersih
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
      });

      return NextResponse.json({ success: true, message: "Struk Printed via CMD" });

    } catch (err: any) {
      console.warn("Execute Print Error:", err);
      return NextResponse.json({ success: false, message: 'Gagal mencetak struk, tapi transaksi tersimpan.' });
    }

  } catch (error: any) {
    console.error("Printer Logic Error:", error);
    return NextResponse.json({ success: false, message: 'Gagal inisialisasi printer' });
  }
}