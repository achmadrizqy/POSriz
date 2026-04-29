# POSriz — Sistem Kasir Toko Rizqy

Aplikasi Point of Sale (POS) berbasis web modern untuk Toko Rizqy, dibangun dengan Next.js 14, Prisma ORM, PostgreSQL (Neon), dan NextAuth.js.

**Live Demo:** [po-sriz.vercel.app](https://po-sriz.vercel.app)

---

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | Next.js 14 (App Router), React 18, Tailwind CSS |
| Backend | Next.js API Routes (REST) |
| Database | PostgreSQL via Neon (cloud) |
| ORM | Prisma v5 |
| Auth | NextAuth.js v4 (JWT + Credentials) |
| Charts | Recharts |
| Deployment | Vercel |

---

## Fitur Utama

- **Kasir / POS** — Transaksi penjualan, keranjang dinamis, tier pricing (harga grosir), diskon per item & total
- **Master Data** — CRUD produk, import/export CSV
- **Stok Kritis** — Monitoring stok dengan badge notifikasi real-time di sidebar
- **Laporan** — Riwayat transaksi, filter tanggal & metode bayar, produk terlaris
- **Dashboard** — Grafik tren pendapatan, jumlah transaksi, breakdown metode pembayaran (filter 7 hari / 30 hari / 12 bulan)
- **RBAC** — Role Kasir (akses POS) dan Admin (akses back office)

---

## Pengujian Fungsional

Pengujian dilakukan berdasarkan use case diagram aplikasi dengan metode **Black Box Testing**.

### UC-01: Proses Transaksi Penjualan

| No | Skenario Uji | Input | Expected Output | Status |
|----|-------------|-------|-----------------|--------|
| 1.1 | Cari produk dengan nama | Ketik "plastik" di kolom pencarian | Dropdown menampilkan produk yang mengandung kata "plastik" | ✅ Pass |
| 1.2 | Cari produk dengan kode | Scan/ketik kode "OPP8X8" | Produk ditemukan dan bisa ditambah ke keranjang | ✅ Pass |
| 1.3 | Tambah produk ke keranjang | Pilih produk dari dropdown | Produk masuk keranjang dengan qty=1 dan harga otomatis | ✅ Pass |
| 1.4 | Ubah qty di keranjang | Ganti qty menjadi 5 | Subtotal otomatis terhitung ulang, tier pricing aktif jika ada | ✅ Pass |
| 1.5 | Tambah diskon per item | Input diskon Rp 500 di kolom diskon/item | Subtotal berkurang sesuai diskon | ✅ Pass |
| 1.6 | Tambah diskon total | Input diskon Rp 2000 di panel pembayaran | Grand total berkurang sesuai diskon | ✅ Pass |
| 1.7 | Pilih metode pembayaran | Pilih "QRIS" dari dropdown | Metode pembayaran tersimpan di transaksi | ✅ Pass |
| 1.8 | Proses bayar tanpa cetak | Klik "BAYAR SAJA" | Transaksi tersimpan, keranjang dikosongkan, stok berkurang | ✅ Pass |
| 1.9 | Checkout keranjang kosong | Klik "BAYAR SAJA" saat keranjang kosong | Muncul alert "Keranjang kosong!" | ✅ Pass |
| 1.10 | Tambah produk melebihi stok | Tambah produk yang stoknya 0 | Muncul alert "Melebihi stok yang ada!" | ✅ Pass |

### UC-02: Manajemen Data Produk

| No | Skenario Uji | Input | Expected Output | Status |
|----|-------------|-------|-----------------|--------|
| 2.1 | Tambah produk baru | Isi semua field lalu klik "Simpan Produk" | Produk tersimpan dan muncul di tabel | ✅ Pass |
| 2.2 | Tambah produk dengan kode duplikat | Kode yang sudah ada | Muncul error "Kode produk sudah digunakan" | ✅ Pass |
| 2.3 | Tambah produk tanpa field wajib | Kosongkan nama produk | Muncul alert "Lengkapi semua data!" | ✅ Pass |
| 2.4 | Edit data produk | Klik Edit, ubah harga, klik Simpan | Data produk terupdate di database | ✅ Pass |
| 2.5 | Hapus produk | Klik ikon hapus, konfirmasi | Produk terhapus dari daftar | ✅ Pass |
| 2.6 | Kalkulasi harga otomatis | Input harga modal + margin % | Harga jual otomatis terhitung dan dibulatkan | ✅ Pass |
| 2.7 | Tambah harga grosir (tier pricing) | Tambah tier: min 10 pcs = Rp 1.500 | Harga grosir tersimpan dan aktif saat qty memenuhi | ✅ Pass |
| 2.8 | Cari produk di tabel | Ketik nama di kolom pencarian | Tabel memfilter produk secara real-time | ✅ Pass |
| 2.9 | Export produk ke CSV | Klik "Export CSV" | File CSV terunduh berisi semua data produk | ✅ Pass |
| 2.10 | Import produk dari CSV | Upload file CSV valid | Produk terimport, muncul laporan jumlah berhasil/gagal | ✅ Pass |

### UC-03: Monitoring Stok

| No | Skenario Uji | Input | Expected Output | Status |
|----|-------------|-------|-----------------|--------|
| 3.1 | Lihat halaman stok kritis | Buka menu "Stok Kritis" | Menampilkan produk dengan stok ≤ batas minimum | ✅ Pass |
| 3.2 | Badge notifikasi stok kritis | Produk dengan stok habis (stok=0, minStock=5) | Badge merah dengan angka muncul di sidebar sebelah "Stok Kritis" | ✅ Pass |
| 3.3 | Stok aman (tidak ada kritis) | Semua produk stok > minStock | Halaman menampilkan banner hijau "Stok Aman", badge tidak muncul | ✅ Pass |
| 3.4 | Stok otomatis berkurang | Proses transaksi dengan qty 3 | Stok produk berkurang 3 setelah transaksi berhasil | ✅ Pass |
| 3.5 | Badge refresh otomatis | Tunggu 15 detik setelah stok berubah | Badge terupdate tanpa reload halaman | ✅ Pass |

### UC-04: Laporan Penjualan

| No | Skenario Uji | Input | Expected Output | Status |
|----|-------------|-------|-----------------|--------|
| 4.1 | Lihat riwayat transaksi hari ini | Buka halaman Laporan | Menampilkan transaksi hari ini dengan total pendapatan | ✅ Pass |
| 4.2 | Filter berdasarkan rentang tanggal | Set tanggal awal dan akhir | Tabel menampilkan transaksi dalam rentang tersebut | ✅ Pass |
| 4.3 | Filter berdasarkan metode bayar | Pilih "QRIS" | Hanya transaksi QRIS yang ditampilkan | ✅ Pass |
| 4.4 | Lihat produk terlaris | Klik tab "Produk Terlaris" | Ranking produk berdasarkan qty terjual dengan medal 🥇🥈🥉 | ✅ Pass |
| 4.5 | Ringkasan total pendapatan | Filter tanggal tertentu | Kartu menampilkan total pendapatan dan jumlah nota yang akurat | ✅ Pass |

### UC-05: Dashboard & Grafik

| No | Skenario Uji | Input | Expected Output | Status |
|----|-------------|-------|-----------------|--------|
| 5.1 | Lihat dashboard default | Buka menu Dashboard | Menampilkan grafik 7 hari terakhir | ✅ Pass |
| 5.2 | Filter periode 30 hari | Klik "30 Hari" | Grafik berubah menampilkan data 30 hari terakhir | ✅ Pass |
| 5.3 | Filter periode 12 bulan | Klik "12 Bulan" | Grafik berubah ke tampilan per bulan | ✅ Pass |
| 5.4 | Grafik tren pendapatan | - | Line chart menampilkan pendapatan per hari/bulan | ✅ Pass |
| 5.5 | Grafik jumlah transaksi | - | Bar chart menampilkan jumlah transaksi per hari/bulan | ✅ Pass |
| 5.6 | Pie chart metode pembayaran | - | Donut chart menampilkan breakdown per metode bayar | ✅ Pass |

### UC-06: Autentikasi & RBAC

| No | Skenario Uji | Input | Expected Output | Status |
|----|-------------|-------|-----------------|--------|
| 6.1 | Login sebagai kasir | Username: kasir, Password: benar | Redirect ke halaman /pos (kasir) | ✅ Pass |
| 6.2 | Login sebagai admin | Username: admin, Password: benar | Redirect ke halaman /admin/dashboard | ✅ Pass |
| 6.3 | Login dengan password salah | Password: salah | Muncul pesan "Username atau password salah" | ✅ Pass |
| 6.4 | Kasir akses halaman admin | Akses /admin secara langsung | Redirect ke halaman login dengan pesan "Akses ditolak" | ✅ Pass |
| 6.5 | Akses halaman tanpa login | Akses /pos atau /admin tanpa session | Redirect otomatis ke halaman login | ✅ Pass |
| 6.6 | Logout | Klik tombol "Keluar" | Session dihapus, redirect ke landing page | ✅ Pass |

---

## Struktur Folder

```
├── app/
│   ├── admin/              # Back office (role: admin)
│   │   ├── dashboard/      # Grafik & ringkasan
│   │   ├── laporan/        # Riwayat & produk terlaris
│   │   ├── master-data/    # CRUD produk + import/export
│   │   └── stok-kritis/    # Monitor stok
│   ├── pos/                # Kasir (role: kasir + admin)
│   │   └── stok-kritis/    # Monitor stok (view kasir)
│   ├── api/                # REST API routes
│   │   ├── products/       # CRUD, search, export, import, low-stock
│   │   └── transactions/   # Transaksi, chart, best-seller
│   ├── components/         # Shared components
│   ├── hooks/              # Custom hooks
│   └── login/              # Halaman login
├── lib/
│   ├── auth.ts             # NextAuth config
│   └── prisma.ts           # Prisma client
├── prisma/
│   └── schema.prisma       # Database schema
├── types/
│   └── next-auth.d.ts      # Type extensions
└── middleware.ts           # Route protection
```

---

## Setup Lokal

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local dengan DATABASE_URL dari Neon

# Push schema ke database
npx prisma db push

# Jalankan development server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

---

## Environment Variables

| Variable | Keterangan |
|----------|-----------|
| `DATABASE_URL` | PostgreSQL connection string (dari Neon) |
| `NEXTAUTH_SECRET` | Random string untuk enkripsi JWT |
| `NEXTAUTH_URL` | URL aplikasi (http://localhost:3000 atau URL Vercel) |
| `KASIR_USERNAME` | kasir |
| `KASIR_PASSWORD` | kasir123 |
| `ADMIN_USERNAME` | admin |
| `ADMIN_PASSWORD` | admin123 |
