"use client";
import { useState, useEffect } from "react";
import { Calendar, FileText, Printer } from "lucide-react";

type Transaction = {
  id: string;
  createdAt: string;
  discount: number;
  total: number;
  grandTotal: number;
  paymentMethod: string;
  items: { id: string; name: string; qty: number; price: number; subtotal: number }[];
};

export default function LaporanPage() {
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState<string>("Semua");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [data, setData] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPendapatan, setTotalPendapatan] = useState(0);
  const [totalTransaksi, setTotalTransaksi] = useState(0);
  const [printingId, setPrintingId] = useState<string | null>(null);

  const handlePrintReceipt = async (tx: Transaction) => {
    setPrintingId(tx.id);
    try {
      await fetch("/api/printer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transaction: tx, printerName: "POS-58" })
      });
      alert("Struk berhasil dikirim ke printer!");
    } catch (e: any) {
      alert("Gagal mencetak: " + e.message);
    } finally {
      setPrintingId(null);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      let url = `/api/transactions?page=${page}&limit=10&sort=${sortOrder}&paymentMethod=${paymentMethod}`;
      if (startDate && endDate) url += `&startDate=${startDate}&endDate=${endDate}`;
      else url += `&filter=hari`;
      const res = await fetch(url);
      const json = await res.json();
      if (!json.error && json.data) {
        setData(json.data);
        setTotalPages(json.meta.totalPages);
        setTotalTransaksi(json.meta.total);
        setTotalPendapatan(json.meta.sumIncome);
      }
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchData(); }, [startDate, endDate, paymentMethod, sortOrder, page]);

  const paymentBadgeColor: Record<string, string> = {
    TUNAI: "bg-green-100 text-green-700",
    QRIS: "bg-blue-100 text-blue-700",
    TRANSFER: "bg-purple-100 text-purple-700",
    "BELUM LUNAS": "bg-red-100 text-red-700",
  };

  return (
    <div className="p-5 max-w-7xl mx-auto space-y-5">

      {/* Filter */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
        <h2 className="text-lg font-bold text-slate-700 mb-4">Filter Laporan</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-base font-semibold text-slate-600">Rentang Tanggal</label>
            <div className="flex items-center gap-2">
              <input type="date" value={startDate}
                onChange={e => { setStartDate(e.target.value); setPage(1); }}
                className="flex-1 p-3 text-lg border-2 border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-colors" />
              <span className="text-slate-400 font-bold text-lg">–</span>
              <input type="date" value={endDate}
                onChange={e => { setEndDate(e.target.value); setPage(1); }}
                className="flex-1 p-3 text-lg border-2 border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-colors" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-base font-semibold text-slate-600">Metode Pembayaran</label>
            <select value={paymentMethod} onChange={e => { setPaymentMethod(e.target.value); setPage(1); }}
              className="w-full p-3 text-lg border-2 border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-white transition-colors">
              <option value="Semua">Semua Pembayaran</option>
              <option value="TUNAI">TUNAI</option>
              <option value="QRIS">QRIS</option>
              <option value="TRANSFER">TRANSFER</option>
              <option value="BELUM LUNAS">BELUM LUNAS</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-base font-semibold text-slate-600">Urutan</label>
            <select value={sortOrder} onChange={e => { setSortOrder(e.target.value); setPage(1); }}
              className="w-full p-3 text-lg border-2 border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-white transition-colors">
              <option value="desc">Terbaru di Atas</option>
              <option value="asc">Terlama di Atas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ringkasan */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex items-center justify-between">
          <div>
            <p className="text-base font-semibold text-slate-500 mb-1">Total Pendapatan</p>
            <p className="text-4xl font-black text-green-600">Rp {totalPendapatan.toLocaleString("id-ID")}</p>
          </div>
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center shrink-0">
            <FileText className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex items-center justify-between">
          <div>
            <p className="text-base font-semibold text-slate-500 mb-1">Total Transaksi</p>
            <p className="text-4xl font-black text-blue-600">{totalTransaksi} Nota</p>
          </div>
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center shrink-0">
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Tabel Riwayat */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">Riwayat Penjualan</h2>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-xl text-slate-400">Memuat data...</div>
        ) : (
          <div className="overflow-x-auto min-h-[360px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-100 text-base text-slate-500 bg-slate-50">
                  <th className="px-5 py-3 font-semibold">Waktu</th>
                  <th className="px-5 py-3 font-semibold">No. Nota</th>
                  <th className="px-5 py-3 font-semibold">Rincian Barang</th>
                  <th className="px-5 py-3 font-semibold text-right">Diskon</th>
                  <th className="px-5 py-3 font-semibold text-right">Grand Total</th>
                  <th className="px-5 py-3 font-semibold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr><td colSpan={6} className="p-10 text-center text-xl text-slate-400">Tidak ada transaksi ditemukan.</td></tr>
                ) : data.map(tx => (
                  <tr key={tx.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 text-base font-medium text-slate-600 whitespace-nowrap">
                      {new Date(tx.createdAt).toLocaleString("id-ID", {
                        day: "2-digit", month: "short", year: "numeric",
                        hour: "2-digit", minute: "2-digit"
                      })}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-700 text-lg">#{tx.id.slice(-6).toUpperCase()}</p>
                      <span className={`inline-block mt-1 text-sm font-bold px-2.5 py-1 rounded-lg ${paymentBadgeColor[tx.paymentMethod] || "bg-slate-100 text-slate-600"}`}>
                        {tx.paymentMethod || "TUNAI"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <ul className="space-y-1">
                        {tx.items.map(item => (
                          <li key={item.id} className="text-base text-slate-700">
                            <span className="font-bold">{item.qty}×</span> {item.name}
                            <span className="text-slate-400 ml-1">(@Rp{item.price.toLocaleString("id-ID")})</span>
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-5 py-4 text-right text-red-500 font-semibold text-lg">
                      {tx.discount > 0 ? `-Rp ${tx.discount.toLocaleString("id-ID")}` : "–"}
                    </td>
                    <td className="px-5 py-4 text-right font-black text-2xl text-green-700">
                      Rp {tx.grandTotal.toLocaleString("id-ID")}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => handlePrintReceipt(tx)}
                        disabled={printingId === tx.id}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors disabled:opacity-50 text-base"
                      >
                        <Printer className="w-5 h-5" />
                        {printingId === tx.id ? "Mencetak..." : "Cetak"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)}
              className="px-6 py-3 bg-white border-2 border-slate-200 rounded-xl text-lg font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
              ← Sebelumnya
            </button>
            <span className="text-lg font-bold text-slate-600">Halaman {page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}
              className="px-6 py-3 bg-white border-2 border-slate-200 rounded-xl text-lg font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
              Selanjutnya →
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
