"use client";
import { useState, useEffect } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import { TrendingUp, ShoppingBag, CreditCard, BarChart2 } from "lucide-react";

type ChartPoint = { label: string; pendapatan: number; transaksi: number };
type PaymentPoint = { name: string; value: number };

type DashboardData = {
  chartData: ChartPoint[];
  paymentData: PaymentPoint[];
  totalPendapatan: number;
  totalTransaksi: number;
  rataRata: number;
};

const PAYMENT_COLORS: Record<string, string> = {
  TUNAI: "#22c55e",
  QRIS: "#3b82f6",
  TRANSFER: "#a855f7",
  "BELUM LUNAS": "#ef4444",
};

const PERIOD_OPTIONS = [
  { value: "minggu", label: "7 Hari" },
  { value: "bulan", label: "30 Hari" },
  { value: "tahun", label: "12 Bulan" },
];

function formatRpAxis(val: number): string {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}jt`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(0)}rb`;
  return String(val);
}

// Custom tooltip untuk pendapatan
function TooltipPendapatan({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-lg text-sm">
      <p className="font-bold text-slate-600 mb-1">{label}</p>
      <p className="text-blue-600 font-bold">Rp {Number(payload[0]?.value || 0).toLocaleString("id-ID")}</p>
    </div>
  );
}

// Custom tooltip untuk transaksi
function TooltipTransaksi({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-lg text-sm">
      <p className="font-bold text-slate-600 mb-1">{label}</p>
      <p className="text-green-600 font-bold">{payload[0]?.value} transaksi</p>
    </div>
  );
}

// Custom tooltip untuk pie
function TooltipPie({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-lg text-sm">
      <p className="font-bold text-slate-600 mb-1">{payload[0]?.name}</p>
      <p className="font-bold" style={{ color: payload[0]?.payload?.fill }}>
        Rp {Number(payload[0]?.value || 0).toLocaleString("id-ID")}
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const [period, setPeriod] = useState<"minggu" | "bulan" | "tahun">("minggu");
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/transactions/chart?period=${period}`)
      .then(r => r.json())
      .then(d => { if (!d.error) setData(d); })
      .finally(() => setIsLoading(false));
  }, [period]);

  return (
    <div className="p-5 max-w-7xl mx-auto space-y-5">

      {/* Header + Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Dashboard</h1>
          <p className="text-slate-500 text-base">Ringkasan performa penjualan</p>
        </div>
        <div className="flex gap-2 bg-white border-2 border-slate-200 rounded-xl p-1">
          {PERIOD_OPTIONS.map(opt => (
            <button key={opt.value}
              onClick={() => setPeriod(opt.value as "minggu" | "bulan" | "tahun")}
              className={`px-4 py-2 rounded-lg font-bold text-base transition-colors ${
                period === opt.value
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading || !data ? (
        <div className="bg-white rounded-2xl p-16 text-center text-xl text-slate-400 shadow-sm border border-slate-200">
          Memuat data...
        </div>
      ) : (
        <>
          {/* Kartu Ringkasan */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <StatCard
              icon={<TrendingUp className="w-7 h-7 text-green-600" />}
              bg="bg-green-100"
              label="Total Pendapatan"
              value={`Rp ${data.totalPendapatan.toLocaleString("id-ID")}`}
              valueClass="text-green-600"
            />
            <StatCard
              icon={<ShoppingBag className="w-7 h-7 text-blue-600" />}
              bg="bg-blue-100"
              label="Total Transaksi"
              value={`${data.totalTransaksi} Nota`}
              valueClass="text-blue-600"
            />
            <StatCard
              icon={<CreditCard className="w-7 h-7 text-purple-600" />}
              bg="bg-purple-100"
              label="Rata-rata / Transaksi"
              value={`Rp ${data.rataRata.toLocaleString("id-ID")}`}
              valueClass="text-purple-600"
            />
          </div>

          {/* Grafik Tren Pendapatan */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-5">
              <BarChart2 className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-800">Tren Pendapatan</h2>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data.chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#64748b" }} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={formatRpAxis} tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} width={60} />
                <Tooltip content={<TooltipPendapatan />} />
                <Line type="monotone" dataKey="pendapatan" stroke="#3b82f6" strokeWidth={3}
                  dot={{ fill: "#3b82f6", r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Grafik Jumlah Transaksi */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-5">
              <ShoppingBag className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-bold text-slate-800">Jumlah Transaksi</h2>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#64748b" }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                <Tooltip content={<TooltipTransaksi />} />
                <Bar dataKey="transaksi" fill="#22c55e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart Metode Pembayaran */}
          {data.paymentData.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-5">
                <CreditCard className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg font-bold text-slate-800">Metode Pembayaran</h2>
              </div>
              <div className="flex flex-col md:flex-row items-center gap-6">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={data.paymentData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%" cy="50%"
                      outerRadius={100} innerRadius={55}
                      paddingAngle={3}
                    >
                      {data.paymentData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={PAYMENT_COLORS[entry.name] || "#94a3b8"}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<TooltipPie />} />
                    <Legend
                      formatter={(val) => (
                        <span style={{ fontSize: "14px", fontWeight: 600, color: "#475569" }}>{val}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Tabel breakdown */}
                <div className="w-full md:w-72 shrink-0 space-y-3">
                  {data.paymentData.map(p => (
                    <div key={p.name} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full shrink-0"
                          style={{ background: PAYMENT_COLORS[p.name] || "#94a3b8" }} />
                        <span className="font-semibold text-slate-700 text-base">{p.name}</span>
                      </div>
                      <span className="font-bold text-slate-800 text-base">
                        Rp {p.value.toLocaleString("id-ID")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ icon, bg, label, value, valueClass }: {
  icon: React.ReactNode; bg: string; label: string; value: string; valueClass: string;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex items-center gap-4">
      <div className={`w-14 h-14 ${bg} rounded-2xl flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-base font-semibold text-slate-500 mb-1">{label}</p>
        <p className={`text-2xl font-black ${valueClass} leading-tight`}>{value}</p>
      </div>
    </div>
  );
}
