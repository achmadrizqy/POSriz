import Link from "next/link";
import { ShoppingCart, Settings } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <div className="mb-12 text-center">
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-green-500/30">
            <span className="text-white font-black text-3xl">R</span>
          </div>
          <h1 className="text-6xl font-black text-white tracking-tight">
            POS<span className="text-green-400">riz</span>
          </h1>
        </div>
        <p className="text-slate-400 text-xl font-medium">Sistem Kasir Toko Rizqy</p>
      </div>

      {/* 2 Pilihan */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
        {/* Kasir / POS */}
        <Link href="/login?redirect=/pos" className="group">
          <div className="bg-slate-800 hover:bg-blue-600 border-2 border-slate-700 hover:border-blue-500 rounded-2xl p-8 flex flex-col items-center gap-5 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-blue-500/20 hover:shadow-2xl hover:-translate-y-1">
            <div className="w-20 h-20 bg-blue-500/20 group-hover:bg-white/20 rounded-2xl flex items-center justify-center transition-colors">
              <ShoppingCart className="w-10 h-10 text-blue-400 group-hover:text-white transition-colors" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-black text-white mb-2">Kasir / POS</h2>
              <p className="text-slate-400 group-hover:text-blue-100 text-base transition-colors">
                Proses transaksi penjualan
              </p>
            </div>
          </div>
        </Link>

        {/* Admin / Back Office */}
        <Link href="/login?redirect=/admin" className="group">
          <div className="bg-slate-800 hover:bg-green-600 border-2 border-slate-700 hover:border-green-500 rounded-2xl p-8 flex flex-col items-center gap-5 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-green-500/20 hover:shadow-2xl hover:-translate-y-1">
            <div className="w-20 h-20 bg-green-500/20 group-hover:bg-white/20 rounded-2xl flex items-center justify-center transition-colors">
              <Settings className="w-10 h-10 text-green-400 group-hover:text-white transition-colors" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-black text-white mb-2">Admin / Back Office</h2>
              <p className="text-slate-400 group-hover:text-green-100 text-base transition-colors">
                Kelola produk, stok & laporan
              </p>
            </div>
          </div>
        </Link>
      </div>

      <p className="mt-10 text-slate-600 text-sm">v1.0 · Toko Rizqy</p>
    </div>
  );
}
