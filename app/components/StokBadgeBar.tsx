"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function StokBadgeBar() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const fetch_ = () => {
      fetch("/api/products/low-stock")
        .then(r => r.json())
        .then(d => { if (!d.error && Array.isArray(d)) setCount(d.length); })
        .catch(() => {});
    };
    fetch_();
    const interval = setInterval(fetch_, 15000);
    return () => clearInterval(interval);
  }, []);

  if (count === 0) return null;

  return (
    <Link href="/admin/stok-kritis">
      <div className="flex items-center gap-2 px-3 py-2.5 bg-red-500/15 border border-red-500/30 rounded-xl hover:bg-red-500/25 transition-colors cursor-pointer">
        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
        <span className="text-sm font-semibold text-red-300 flex-1">Stok menipis</span>
        <span className="bg-red-500 text-white text-xs font-black px-2 py-0.5 rounded-full min-w-[22px] text-center animate-pulse">
          {count}
        </span>
      </div>
    </Link>
  );
}
