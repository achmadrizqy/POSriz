"use client";
import { useState, useEffect, useRef } from "react";
import { Search, ShoppingCart, Trash2, Printer, CheckCircle } from "lucide-react";
import { useArrowNav } from "../hooks/useArrowNav";

type ProductTierPrice = { id?: string; minQty: number; price: number };
type Product = {
  id: string; code: string; name: string; price: number;
  stock: number; minStock?: number; tierPrices?: ProductTierPrice[];
};
type CartItem = Product & {
  cartItemId: string; qty: number; subtotal: number;
  originalPrice: number; itemDiscount?: number;
};

export default function KasirPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("TUNAI");
  const [isProcessing, setIsProcessing] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const paymentArrowNav = useArrowNav({ containerSelector: "#payment-panel" });
  const cartArrowNav = useArrowNav({ containerSelector: "#cart-table" });

  useEffect(() => {
    fetch("/api/products")
      .then(res => res.json())
      .then(data => { if (!data.error) setProducts(data); });
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const delay = setTimeout(() => {
        fetch(`/api/products/search?q=${encodeURIComponent(searchQuery)}`)
          .then(res => res.json())
          .then(data => {
            if (!data.error) {
              setSearchResults(data);
              setIsDropdownOpen(true);
              setSelectedIndex(0);
            }
          });
      }, 300);
      return () => clearTimeout(delay);
    } else {
      setSearchResults([]);
      setIsDropdownOpen(false);
    }
  }, [searchQuery]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setIsDropdownOpen(false);
      setSearchQuery("");
      return;
    }
    if (!isDropdownOpen || searchResults.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex(prev => (prev + 1) % searchResults.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex(prev => (prev - 1 + searchResults.length) % searchResults.length); }
    else if (e.key === "Enter") { e.preventDefault(); handleSelectProduct(searchResults[selectedIndex]); }
  };

  const handleSelectProduct = (prod: Product) => {
    const totalInCart = cart.filter(c => c.id === prod.id).reduce((acc, item) => acc + item.qty, 0);
    if (totalInCart + 1 > prod.stock) { alert("Melebihi stok yang ada!"); return; }

    const cartItemId = `${prod.id}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    let finalPrice = prod.price;
    if (prod.tierPrices && prod.tierPrices.length > 0) {
      const sorted = [...prod.tierPrices].sort((a, b) => b.minQty - a.minQty);
      const matched = sorted.find(t => t.minQty <= 1);
      if (matched) finalPrice = matched.price;
    }

    setCart([{ ...prod, cartItemId, qty: 1, subtotal: finalPrice, originalPrice: prod.price, price: finalPrice, itemDiscount: 0 }, ...cart]);
    setSearchQuery("");
    setSearchResults([]);
    setIsDropdownOpen(false);
    searchInputRef.current?.focus();
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isDropdownOpen && searchResults.length > 0) {
      handleSelectProduct(searchResults[selectedIndex]);
    } else if (searchQuery) {
      const prod = products.find(p =>
        p.code.toLowerCase() === searchQuery.toLowerCase() ||
        p.name.toLowerCase() === searchQuery.toLowerCase()
      );
      if (prod) handleSelectProduct(prod);
      else alert("Produk tidak ditemukan, atau ketik minimal 2 huruf untuk mencari!");
    }
  };

  const updateCartItem = (cartItemId: string, newQty: number, newPrice: number, newDiscount?: number) => {
    setCart(cart.map(item => {
      if (item.cartItemId === cartItemId) {
        const validQty = Math.max(0, newQty);
        const itemDisc = newDiscount !== undefined ? newDiscount : (item.itemDiscount || 0);
        const calcSubtotal = Math.max(0, (validQty * newPrice) - itemDisc);
        return { ...item, qty: validQty, price: newPrice, itemDiscount: itemDisc, subtotal: calcSubtotal };
      }
      return item;
    }));
  };

  const removeCartItem = (cartItemId: string) => setCart(cart.filter(item => item.cartItemId !== cartItemId));

  const subtotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
  const grandTotal = Math.max(0, subtotal - discount);

  const handleCheckout = async (print: boolean) => {
    if (cart.length === 0) return alert("Keranjang kosong!");
    setIsProcessing(true);
    try {
      const txData = {
        items: cart.map(c => ({
          productId: c.id, name: c.name, qty: c.qty,
          price: c.price, itemDiscount: c.itemDiscount || 0, subtotal: c.subtotal
        })),
        discount, total: subtotal, grandTotal, paymentMethod
      };
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(txData)
      });
      const transaction = await res.json();
      if (transaction.error) throw new Error(transaction.error);

      if (print) {
        await fetch("/api/printer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transaction, printerName: "POS-58" })
        });
      }

      alert("Transaksi Berhasil!");
      setCart([]);
      setDiscount(0);
      fetch("/api/products").then(r => r.json()).then(data => { if (!data.error) setProducts(data); });
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsProcessing(false);
      searchInputRef.current?.focus();
    }
  };

  return (
    <div className="p-5 max-w-7xl mx-auto space-y-5">
      {/* Search Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-3 relative">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Ketik atau scan kode / nama produk..."
              className="w-full text-xl pl-12 pr-4 py-4 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all uppercase font-medium"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            {isDropdownOpen && searchResults.length > 0 && (
              <ul className="absolute z-50 w-full mt-2 bg-white border-2 border-slate-200 rounded-2xl shadow-2xl overflow-hidden max-h-[380px] overflow-y-auto">
                {searchResults.map((prod, idx) => (
                  <li key={prod.id} onClick={() => handleSelectProduct(prod)}
                    className={`px-5 py-4 cursor-pointer border-b last:border-0 flex justify-between items-center transition-colors ${
                      idx === selectedIndex ? "bg-blue-50 text-blue-900" : "hover:bg-slate-50 text-slate-700"
                    }`}>
                    <div className="flex items-center gap-3">
                      <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-base font-bold">{prod.code}</span>
                      <span className="text-xl font-semibold">{prod.name}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-green-700 font-bold text-lg">Rp {prod.price.toLocaleString("id-ID")}</span>
                      <span className={`px-3 py-1.5 text-base font-bold rounded-lg border ${
                        prod.stock <= (prod.minStock ?? 5) ? "bg-red-50 text-red-700 border-red-200" : "bg-green-50 text-green-700 border-green-200"
                      }`}>Stok: {prod.stock}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-7 py-4 rounded-xl text-xl font-bold shadow-sm transition-colors flex items-center gap-2 shrink-0">
            <ShoppingCart className="w-5 h-5" /> Tambah
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Keranjang */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
            <ShoppingCart className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-800">Daftar Belanjaan</h2>
            {cart.length > 0 && (
              <span className="ml-auto bg-blue-100 text-blue-700 text-base font-bold px-3 py-1 rounded-full">{cart.length} item</span>
            )}
          </div>
          <div className="flex-1 overflow-x-auto min-h-[420px]">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 py-24 gap-4">
                <ShoppingCart className="w-20 h-20" />
                <p className="text-2xl font-semibold text-slate-400">Keranjang masih kosong</p>
                <p className="text-lg text-slate-400">Masukkan kode produk di atas</p>
              </div>
            ) : (
              <table id="cart-table" className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-100 text-base text-slate-500 bg-slate-50">
                    <th className="px-5 py-3 font-semibold">Nama Produk</th>
                    <th className="px-5 py-3 font-semibold text-center">Qty</th>
                    <th className="px-5 py-3 font-semibold">Harga/Satuan</th>
                    <th className="px-5 py-3 font-semibold">Diskon/Item</th>
                    <th className="px-5 py-3 font-semibold text-right">Subtotal</th>
                    <th className="px-5 py-3 font-semibold text-center">Hapus</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map(item => (
                    <tr key={item.cartItemId} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4 font-semibold text-lg text-slate-800">{item.name}</td>
                      <td className="px-5 py-4 text-center">
                        <input type="text" inputMode="numeric"
                          className="w-16 py-2 text-center text-xl font-bold border-2 border-slate-200 rounded-xl focus:border-blue-400 outline-none"
                          value={item.qty === 0 ? "" : item.qty}
                          onKeyDown={cartArrowNav}
                          onChange={e => {
                            const val = e.target.value.replace(/\D/g, "");
                            const parsedQty = val === "" ? 0 : parseInt(val);
                            let finalPrice = item.originalPrice;
                            if (item.tierPrices && item.tierPrices.length > 0) {
                              const sorted = [...item.tierPrices].sort((a, b) => b.minQty - a.minQty);
                              const matched = sorted.find(t => t.minQty <= parsedQty);
                              if (matched) finalPrice = matched.price;
                            }
                            updateCartItem(item.cartItemId, parsedQty, finalPrice, item.itemDiscount || 0);
                          }} />
                      </td>
                      <td className="px-5 py-4">
                        <input type="text" inputMode="numeric"
                          className="w-28 py-2 px-3 text-lg border-2 border-slate-200 rounded-xl focus:border-blue-400 outline-none"
                          value={item.price === 0 ? "" : item.price}
                          onKeyDown={cartArrowNav}
                          onChange={e => {
                            const val = e.target.value.replace(/\D/g, "");
                            updateCartItem(item.cartItemId, item.qty, val === "" ? 0 : parseInt(val), item.itemDiscount || 0);
                          }} />
                      </td>
                      <td className="px-5 py-4">
                        <input type="text" inputMode="numeric" placeholder="0"
                          className="w-24 py-2 px-3 text-lg border-2 border-slate-200 rounded-xl focus:border-red-400 outline-none text-red-600"
                          value={!item.itemDiscount ? "" : item.itemDiscount}
                          onKeyDown={cartArrowNav}
                          onChange={e => {
                            const val = e.target.value.replace(/\D/g, "");
                            updateCartItem(item.cartItemId, item.qty, item.price, val === "" ? 0 : parseInt(val));
                          }} />
                      </td>
                      <td className="px-5 py-4 text-right font-bold text-xl text-slate-800">Rp {item.subtotal.toLocaleString("id-ID")}</td>
                      <td className="px-5 py-4 text-center">
                        <button onClick={() => removeCartItem(item.cartItemId)}
                          className="p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                          <Trash2 className="w-6 h-6" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Panel Pembayaran */}
        <div id="payment-panel" className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-800">Pembayaran</h2>
          </div>
          <div className="p-5 flex-1 flex flex-col gap-4">
            <div className="flex justify-between items-center text-lg text-slate-600">
              <span>Subtotal</span>
              <span className="font-bold text-slate-800">Rp {subtotal.toLocaleString("id-ID")}</span>
            </div>
            <div className="space-y-1.5">
              <label className="text-base font-semibold text-slate-600">Potongan / Diskon (Rp)</label>
              <input type="text" inputMode="numeric" placeholder="0"
                className="w-full text-xl p-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                value={discount === 0 ? "" : discount}
                onKeyDown={paymentArrowNav}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, "");
                  setDiscount(val === "" ? 0 : parseInt(val));
                }} />
            </div>
            <hr className="border-slate-100" />
            <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
              <p className="text-sm font-bold text-green-700 uppercase tracking-wider mb-1">Total Bayar</p>
              <p className="text-4xl font-black text-green-600 leading-none">Rp {grandTotal.toLocaleString("id-ID")}</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-base font-semibold text-slate-600">Metode Pembayaran</label>
              <select className="w-full text-xl p-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all bg-white cursor-pointer"
                value={paymentMethod}
                onKeyDown={paymentArrowNav}
                onChange={e => setPaymentMethod(e.target.value)}>
                <option value="TUNAI">TUNAI / CASH</option>
                <option value="QRIS">QRIS</option>
                <option value="TRANSFER">TRANSFER BANK</option>
                <option value="BELUM LUNAS">BELUM LUNAS</option>
              </select>
            </div>
            <div className="mt-auto space-y-3 pt-2">
              <button disabled={isProcessing || cart.length === 0} onClick={() => handleCheckout(false)}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm">
                <CheckCircle className="w-6 h-6" /> BAYAR SAJA
              </button>
              <button disabled={isProcessing || cart.length === 0} onClick={() => handleCheckout(true)}
                className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm">
                <Printer className="w-6 h-6" /> BAYAR & CETAK STRUK
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
