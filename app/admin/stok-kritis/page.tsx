"use client";
import { useState, useEffect } from "react";
import { AlertTriangle, PackageSearch, CheckCircle } from "lucide-react";
import Link from "next/link";

type Product = { id: string; code: string; name: string; price: number; stock: number; minStock: number };

export default function StokKritisPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/products/low-stock")
      .then(res => res.json())
      .then(data => { if (!data.error) setProducts(data); })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="p-5 max-w-7xl mx-auto space-y-5">

      {/* Header Banner */}
      <div className={`rounded-2xl border-2 p-6 flex items-start gap-4 ${
        products.length > 0
          ? "bg-red-50 border-red-200"
          : "bg-green-50 border-green-200"
      }`}>
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
          products.length > 0 ? "bg-red-100" : "bg-green-100"
        }`}>
          {products.length > 0
            ? <AlertTriangle className="w-8 h-8 text-red-600" />
            : <CheckCircle className="w-8 h-8 text-green-600" />
          }
        </div>
        <div>
          <h2 className={`text-2xl font-bold mb-1 ${products.length > 0 ? "text-red-800" : "text-green-800"}`}>
            {products.length > 0 ? "Peringatan Stok Kritis!" : "Stok Aman"}
          </h2>
          <p className={`text-lg ${products.length > 0 ? "text-red-700" : "text-green-700"}`}>
            {products.length > 0
              ? `Ada ${products.length} produk yang stoknya di bawah batas minimal. Segera lakukan pengisian stok!`
              : "Semua produk memiliki stok yang cukup saat ini."
            }
          </p>
        </div>
      </div>

      {/* Tabel */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xl text-slate-400">Memeriksa data stok...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-100 text-base text-slate-500 bg-slate-50">
                  <th className="px-5 py-3 font-semibold">Kode</th>
                  <th className="px-5 py-3 font-semibold">Nama Produk</th>
                  <th className="px-5 py-3 font-semibold text-center text-red-600">Sisa Stok</th>
                  <th className="px-5 py-3 font-semibold text-center">Batas Minimum</th>
                  <th className="px-5 py-3 font-semibold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-xl text-slate-400 font-medium">
                      Tidak ada produk dengan stok kritis saat ini.
                    </td>
                  </tr>
                ) : products.map(p => (
                  <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 font-bold text-slate-600 text-lg">{p.code}</td>
                    <td className="px-5 py-4 font-semibold text-slate-800 text-lg">{p.name}</td>
                    <td className="px-5 py-4 text-center">
                      <span className="inline-block px-5 py-2 rounded-xl font-black text-2xl bg-red-100 text-red-700 border border-red-200 animate-pulse">
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="inline-block px-4 py-2 rounded-xl font-bold text-lg bg-slate-100 text-slate-600">
                        {p.minStock ?? 5}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <Link href="/admin/master-data">
                        <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-xl font-bold text-base transition-colors">
                          <PackageSearch className="w-5 h-5" /> Isi Stok
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
