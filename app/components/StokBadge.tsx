"use client";
import { useEffect, useState } from "react";

export default function StokBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Basic polling or one-time fetch
    const fetchLowStockCount = () => {
      fetch("/api/products/low-stock")
        .then(res => res.json())
        .then(data => {
          if (!data.error && Array.isArray(data)) {
            setCount(data.length);
          }
        })
        .catch(() => {});
    };

    fetchLowStockCount();
    const interval = setInterval(fetchLowStockCount, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, []);

  if (count === 0) return null;

  return (
    <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full ml-auto animate-pulse shadow-sm shadow-red-300">
      {count}
    </span>
  );
}
