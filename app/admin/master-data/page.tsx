"use client";
import { useState, useEffect } from "react";
import { Plus, Trash2, Save, PackageSearch, Edit, X, Search } from "lucide-react";

type ProductTierPrice = { id?: string; minQty: number; price: number };
type Product = {
  id: string; code: string; name: string; price: number;
  stock: number; hargaModal: number; minStock?: number; tierPrices?: ProductTierPrice[];
};

export default function MasterDataPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Add form
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [stock, setStock] = useState("");
  const [price, setPrice] = useState("");
  const [modal, setModal] = useState("");
  const [margin, setMargin] = useState("");
  const [minStock, setMinStock] = useState("5");
  const [tierPrices, setTierPrices] = useState<{ minQty: string; price: string }[]>([]);

  // Edit form
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editCode, setEditCode] = useState("");
  const [editName, setEditName] = useState("");
  const [editStock, setEditStock] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editModal, setEditModal] = useState("");
  const [editMargin, setEditMargin] = useState("");
  const [editMinStock, setEditMinStock] = useState("");
  const [editTierPrices, setEditTierPrices] = useState<{ minQty: string; price: string }[]>([]);
  const [editError, setEditError] = useState<string | null>(null);

  const calculatePrice = (m: string, pct: string, setP: (val: string) => void) => {
    const modalVal = parseInt(m) || 0;
    const pctVal = parseInt(pct) || 0;
    if (modalVal > 0 && pctVal > 0) {
      const calculated = modalVal + (modalVal * pctVal / 100);
      setP((Math.ceil(calculated / 100) * 100).toString());
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/products?paginated=true&page=${page}&limit=10&search=${encodeURIComponent(search)}`);
      const payload = await res.json();
      if (!payload.error && payload.data) {
        setProducts(payload.data);
        setTotalPages(payload.meta.totalPages);
      }
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { setPage(1); }, [search]);
  useEffect(() => {
    const delay = setTimeout(() => fetchData(), 300);
    return () => clearTimeout(delay);
  }, [page, search]);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !name || !stock || !price) return alert("Lengkapi semua data!");
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code, name, stock: parseInt(stock), price: parseInt(price),
          hargaModal: parseInt(modal || "0"), minStock: parseInt(minStock || "5"),
          tierPrices: tierPrices.filter(t => t.minQty && t.price)
        })
      });
      const result = await res.json();
      if (result.error) return alert(result.error);
      alert("Produk berhasil ditambahkan!");
      setCode(""); setName(""); setStock(""); setPrice(""); setModal(""); setMargin(""); setMinStock("5"); setTierPrices([]);
      fetchData();
    } catch { alert("Gagal menambahkan produk"); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus produk "${name}"?`)) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      const result = await res.json();
      if (result.error) return alert(result.error);
      fetchData();
    } catch { alert("Gagal menghapus produk"); }
  };

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setEditCode(product.code);
    setEditName(product.name);
    setEditStock(product.stock.toString());
    setEditPrice(product.price.toString());
    setEditModal(product.hargaModal.toString());
    setEditMargin("");
    setEditMinStock((product.minStock ?? 5).toString());
    setEditTierPrices(product.tierPrices ? product.tierPrices.map(t => ({ minQty: t.minQty.toString(), price: t.price.toString() })) : []);
    setEditError(null);
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);
    if (!editingProduct) return;
    if (!editCode || !editName || !editStock || !editPrice) { setEditError("Lengkapi semua data!"); return; }
    try {
      const res = await fetch(`/api/products/${editingProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: editCode.toUpperCase(), name: editName,
          stock: parseInt(editStock), price: parseInt(editPrice),
          hargaModal: parseInt(editModal || "0"),
          minStock: parseInt(editMinStock || "5"),
          tierPrices: editTierPrices.filter(t => t.minQty && t.price)
        })
      });
      const result = await res.json();
      if (!res.ok || result.error) { setEditError(result.error || "Gagal menyimpan perubahan"); return; }
      alert("Perubahan berhasil disimpan!");
      setEditingProduct(null);
      fetchData();
    } catch { setEditError("Gagal mengupdate produk"); }
  };

  const modalNum = parseInt(modal) || 0;
  const marginNum = parseInt(margin) || 0;
  const exactPriceDisplay = modalNum > 0 && marginNum > 0 ? modalNum + (modalNum * marginNum / 100) : null;

  const editModalNum = parseInt(editModal) || 0;
  const editMarginNum = parseInt(editMargin) || 0;
  const exactEditPriceDisplay = editModalNum > 0 && editMarginNum > 0 ? editModalNum + (editModalNum * editMarginNum / 100) : null;

  return (
    <div className="p-5 max-w-7xl mx-auto space-y-6">

      {/* Form Tambah Produk */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
          <PackageSearch className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-slate-800">Tambah Produk Baru</h2>
        </div>

        <form onSubmit={handleAddProduct} className="p-6 space-y-5">
          {/* Baris 1 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <FormField label="Kode Produk">
              <input type="text" className="form-input uppercase"
                value={code} onChange={e => setCode(e.target.value.toUpperCase())} />
            </FormField>
            <FormField label="Nama Produk" className="md:col-span-2">
              <input type="text" className="form-input"
                value={name} onChange={e => setName(e.target.value)} />
            </FormField>
            <FormField label="Batas Stok Kritis">
              <input type="text" inputMode="numeric" className="form-input bg-red-50 text-red-700 font-bold border-red-200 focus:border-red-400"
                value={minStock} onChange={e => setMinStock(e.target.value.replace(/\D/g, ""))} />
            </FormField>
          </div>

          {/* Baris 2 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <FormField label="Stok Awal">
              <input type="text" inputMode="numeric" className="form-input"
                value={stock} onChange={e => setStock(e.target.value.replace(/\D/g, ""))} />
            </FormField>
            <FormField label="Harga Modal (Rp)">
              <input type="text" inputMode="numeric" className="form-input"
                value={modal} onChange={e => { const v = e.target.value.replace(/\D/g, ""); setModal(v); calculatePrice(v, margin, setPrice); }} />
            </FormField>
            <FormField label="Margin Keuntungan (%)">
              <input type="text" inputMode="numeric" placeholder="%" className="form-input"
                value={margin} onChange={e => { const v = e.target.value.replace(/\D/g, ""); setMargin(v); calculatePrice(modal, v, setPrice); }} />
              <div className="flex gap-2 mt-2">
                {[10, 15, 20].map(pct => (
                  <button type="button" key={pct}
                    onClick={() => { setMargin(pct.toString()); calculatePrice(modal, pct.toString(), setPrice); }}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg font-bold text-sm transition-colors">
                    {pct}%
                  </button>
                ))}
              </div>
            </FormField>
            <FormField label="Harga Jual (Rp)">
              <input type="text" inputMode="numeric" className="form-input"
                value={price} onChange={e => setPrice(e.target.value.replace(/\D/g, ""))} />
              {exactPriceDisplay !== null && (
                <p className="text-sm text-slate-400 mt-1">*Asli: Rp {exactPriceDisplay.toLocaleString("id-ID")}</p>
              )}
            </FormField>
          </div>

          {/* Harga Grosir */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-blue-900">Harga Grosir (Opsional)</h3>
              <button type="button"
                onClick={() => setTierPrices([...tierPrices, { minQty: "", price: "" }])}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold text-base flex items-center gap-2 transition-colors">
                <Plus className="w-5 h-5" /> Tambah
              </button>
            </div>
            {tierPrices.map((tier, idx) => (
              <div key={idx} className="flex gap-3 items-end bg-white p-4 rounded-xl border border-slate-200">
                <FormField label="Min. Beli (Qty)" className="flex-1">
                  <input type="text" inputMode="numeric" className="form-input"
                    value={tier.minQty} onChange={e => { const t = [...tierPrices]; t[idx].minQty = e.target.value.replace(/\D/g, ""); setTierPrices(t); }} />
                </FormField>
                <FormField label="Harga Grosir/Satuan" className="flex-1">
                  <input type="text" inputMode="numeric" className="form-input"
                    value={tier.price} onChange={e => { const t = [...tierPrices]; t[idx].price = e.target.value.replace(/\D/g, ""); setTierPrices(t); }} />
                </FormField>
                <button type="button"
                  onClick={() => setTierPrices(tierPrices.filter((_, i) => i !== idx))}
                  className="mb-[2px] p-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>

          <button type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl text-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm">
            <Save className="w-6 h-6" /> Simpan Produk
          </button>
        </form>
      </div>

      {/* Tabel Produk */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <h2 className="text-xl font-bold text-slate-800">Daftar Produk & Stok</h2>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama atau kode..."
              className="w-full text-lg py-3 pl-12 pr-4 border-2 border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-colors"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-xl text-slate-400">Memuat data...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-100 text-base text-slate-500 bg-slate-50">
                  <th className="px-5 py-3 font-semibold">Kode</th>
                  <th className="px-5 py-3 font-semibold">Nama Produk</th>
                  <th className="px-5 py-3 font-semibold text-center">Stok</th>
                  <th className="px-5 py-3 font-semibold text-right">Harga Jual</th>
                  <th className="px-5 py-3 font-semibold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr><td colSpan={5} className="p-10 text-center text-xl text-slate-400">Belum ada produk terdaftar.</td></tr>
                ) : products.map(p => (
                  <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 font-bold text-blue-600 text-lg">{p.code}</td>
                    <td className="px-5 py-4 font-semibold text-slate-800 text-lg">{p.name}</td>
                    <td className="px-5 py-4 text-center">
                      <span className={`inline-block px-4 py-1.5 rounded-lg font-bold text-lg ${
                        p.stock <= (p.minStock ?? 5)
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : "bg-green-50 text-green-700 border border-green-200"
                      }`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-lg text-slate-800">
                      Rp {p.price.toLocaleString("id-ID")}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleEditClick(p)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-base transition-colors shadow-sm">
                          <Edit className="w-4 h-4" /> Edit
                        </button>
                        <button onClick={() => handleDelete(p.id, p.name)}
                          className="p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
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

      {/* Modal Edit */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl border border-slate-200 flex flex-col max-h-[92vh]">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <Edit className="w-6 h-6 text-amber-500" />
                <h2 className="text-xl font-bold text-slate-800">Edit Data Produk</h2>
              </div>
              <button type="button" onClick={() => setEditingProduct(null)}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleUpdateProduct} className="p-6 space-y-5 overflow-y-auto">
              {editError && (
                <div className="bg-red-50 border border-red-300 text-red-700 p-4 rounded-xl text-lg font-semibold flex items-center gap-2">
                  <X className="w-5 h-5 shrink-0" /> {editError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <FormField label="Kode Produk">
                  <input type="text" className="form-input uppercase" autoFocus
                    value={editCode} onChange={e => setEditCode(e.target.value.toUpperCase())} />
                </FormField>
                <FormField label="Nama Produk" className="md:col-span-2">
                  <input type="text" className="form-input"
                    value={editName} onChange={e => setEditName(e.target.value)} />
                </FormField>
                <FormField label="Batas Stok Kritis">
                  <input type="text" inputMode="numeric" className="form-input bg-red-50 text-red-700 font-bold border-red-200 focus:border-red-400"
                    value={editMinStock} onChange={e => setEditMinStock(e.target.value.replace(/\D/g, ""))} />
                </FormField>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <FormField label="Stok Barang">
                  <input type="text" inputMode="numeric" className="form-input"
                    value={editStock} onChange={e => setEditStock(e.target.value.replace(/\D/g, ""))} />
                </FormField>
                <FormField label="Harga Modal (Rp)">
                  <input type="text" inputMode="numeric" className="form-input"
                    value={editModal} onChange={e => { const v = e.target.value.replace(/\D/g, ""); setEditModal(v); calculatePrice(v, editMargin, setEditPrice); }} />
                </FormField>
                <FormField label="Margin (%)">
                  <input type="text" inputMode="numeric" className="form-input"
                    value={editMargin} onChange={e => { const v = e.target.value.replace(/\D/g, ""); setEditMargin(v); calculatePrice(editModal, v, setEditPrice); }} />
                  <div className="flex gap-2 mt-2">
                    {[10, 15, 20].map(pct => (
                      <button type="button" key={pct}
                        onClick={() => { setEditMargin(pct.toString()); calculatePrice(editModal, pct.toString(), setEditPrice); }}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg font-bold text-sm transition-colors">
                        {pct}%
                      </button>
                    ))}
                  </div>
                </FormField>
                <FormField label="Harga Jual (Rp)">
                  <input type="text" inputMode="numeric" className="form-input"
                    value={editPrice} onChange={e => setEditPrice(e.target.value.replace(/\D/g, ""))} />
                  {exactEditPriceDisplay !== null && (
                    <p className="text-sm text-slate-400 mt-1">*Asli: Rp {exactEditPriceDisplay.toLocaleString("id-ID")}</p>
                  )}
                </FormField>
              </div>

              {/* Harga Grosir Edit */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-amber-900">Harga Grosir (Opsional)</h3>
                  <button type="button"
                    onClick={() => setEditTierPrices([...editTierPrices, { minQty: "", price: "" }])}
                    className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl font-bold text-base flex items-center gap-2 transition-colors">
                    <Plus className="w-5 h-5" /> Tambah
                  </button>
                </div>
                {editTierPrices.map((tier, idx) => (
                  <div key={idx} className="flex gap-3 items-end bg-white p-4 rounded-xl border border-slate-200">
                    <FormField label="Min. Beli (Qty)" className="flex-1">
                      <input type="text" inputMode="numeric" className="form-input"
                        value={tier.minQty} onChange={e => { const t = [...editTierPrices]; t[idx].minQty = e.target.value.replace(/\D/g, ""); setEditTierPrices(t); }} />
                    </FormField>
                    <FormField label="Harga Grosir/Satuan" className="flex-1">
                      <input type="text" inputMode="numeric" className="form-input"
                        value={tier.price} onChange={e => { const t = [...editTierPrices]; t[idx].price = e.target.value.replace(/\D/g, ""); setEditTierPrices(t); }} />
                    </FormField>
                    <button type="button"
                      onClick={() => setEditTierPrices(editTierPrices.filter((_, i) => i !== idx))}
                      className="mb-[2px] p-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditingProduct(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-4 rounded-xl text-xl font-bold transition-colors">
                  Batal
                </button>
                <button type="submit"
                  className="flex-[2] bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl text-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm">
                  <Save className="w-6 h-6" /> Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper component
function FormField({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="text-base font-semibold text-slate-600">{label}</label>
      {children}
    </div>
  );
}
