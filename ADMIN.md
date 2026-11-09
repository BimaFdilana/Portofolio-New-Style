# Panduan Admin — Panel CRUD Konten (Vercel Serverless + Turso)

Panel admin ada di **`/admin`**. Desainnya sengaja **sederhana & polos**
(bukan tema game): dashboard ringkasan + menu **Proyek, Sertifikat, Keahlian,
Perjalanan, Pengaturan**.

Backend-nya berjalan **sepenuhnya di Vercel**, tanpa PHP/cPanel:
**Serverless Functions** (Node, folder `api/`) + database **Turso**
(SQLite cloud, paket gratis: 100 database, 5 GB, tanpa kartu kredit).
Semua logika API adalah port 1:1 dari backend PHP lama (`server/api.php`) —
rute, bentuk JSON, dan aturan yang sama.

## Cara kerja

- Situs publik (React) memanggil `GET /api/content` untuk mengambil konten.
  Bila API/database belum terpasang, situs otomatis memakai data bawaan
  (`src/data/content.ts`) — situs tidak pernah kosong.
- Panel admin login (email + password), lalu mengelola data lewat API yang
  sama. Password tersimpan sebagai hash (bcrypt); sesi berupa token (7 hari).
- Perubahan di panel **langsung live** di situs (tanpa build ulang).
- Skema + data awal dibuat otomatis saat API pertama kali diakses
  (dari `api/_lib/seedData.ts` — salinan `server/seed.json`).

## Penyiapan (sekali saja)

### 1. Buat database Turso (gratis)

1. Daftar/masuk di [turso.tech](https://turso.tech) (bisa login dengan GitHub).
2. Buat database baru, mis. nama `portofolio-bima`.
3. Di halaman database, salin **Database URL** (`libsql://...`) dan buat
   **Auth Token** (menu Tokens → Create Token) lalu salin tokennya.
   > Token ini seperti password database — jangan dibagikan atau di-commit.

### 2. Isi Environment Variables di Vercel

Vercel Dashboard → proyek ini → **Settings → Environment Variables**,
tambahkan (untuk Production):

| Nama | Isi |
| --- | --- |
| `TURSO_DATABASE_URL` | Database URL dari Turso (`libsql://...`) |
| `TURSO_AUTH_TOKEN` | Auth Token dari Turso |
| `ADMIN_EMAIL` | Email login admin (mis. email kamu) |
| `ADMIN_PASSWORD` | Password awal admin |

Lalu **Deployments → ⋯ → Redeploy** (atau push commit baru) agar
variabelnya aktif.

### 3. Login

Buka `https://portofolio-bima-six.vercel.app/admin` → login dengan
`ADMIN_EMAIL` / `ADMIN_PASSWORD` tadi. Selesai! Data awal (3 proyek,
sertifikat, keahlian, perjalanan, pengaturan) sudah terisi otomatis.

> **Catatan:** akun admin dibuat dari env hanya saat tabel admin masih
> kosong. Password yang sudah tersimpan di database **tidak** berubah bila
> env diganti — ganti password berarti buat admin baru di database
> (atau kosongkan tabel `admins` lewat `turso db shell` lalu redeploy).

## Menguji API di komputer lokal

```bash
# 1. Pakai SQLite file lokal sebagai pengganti Turso:
export TURSO_DATABASE_URL='file:./data-test.db'
export ADMIN_EMAIL='admin@test.id'
export ADMIN_PASSWORD='rahasia123'
# 2. Jalankan functions + frontend:
npx vercel dev   # butuh login Vercel CLI; atau uji handler langsung (lihat bawah)
# buka http://localhost:3000  dan  http://localhost:3000/admin
```

Uji otomatis handler (tanpa `vercel dev`): kompilasi `api/` lalu jalankan
harness Node terhadap file SQLite lokal — 27 cek (konten publik, login,
CRUD, settings, logout, rute salah). Simpan harness di luar repo bila perlu.

## Yang bisa diubah dari panel

- **Proyek:** nama, slug, kesulitan, warna sampul, deskripsi/peran/durasi
  (dwibahasa ID/EN), tech stack, fitur (Loot), tantangan & solusi (Boss
  Battle), link demo/GitHub, urutan, status tayang/draf.
- **Sertifikat:** judul (ID/EN), penerbit, tahun, jumlah halaman.
- **Keahlian:** kategori + ikon, item skill dan levelnya.
- **Perjalanan:** periode, judul & isi (ID/EN), tanda quest aktif.
- **Pengaturan:** nama, peran, lokasi, email, nomor WhatsApp, tautan
  GitHub/LinkedIn/Instagram, URL CV, panel hero (HP, level, badge).

## Keamanan & cadangan

- Endpoint tulis (tambah/ubah/hapus) selalu memeriksa token login.
- Jangan bagikan `TURSO_AUTH_TOKEN` atau password admin — keduanya hanya
  ada di Environment Variables Vercel, tidak di-commit ke repo.
- **Cadangan data:** Turso menyimpan database di cloud; ekspor manual via
  CLI: `turso db shell portofolio-bima .dump > backup.sql`
  (butuh [Turso CLI](https://docs.turso.tech/cli/installation)).
- Rute API: `GET /api/content` (publik), `POST /api/login|logout`,
  CRUD `GET/POST /api/{tabel}`, `PUT/DELETE /api/{tabel}/{id}`,
  `GET/PUT /api/settings`. Tabel: projects, certificates,
  skill_categories, journey.

## Alternatif: hosting PHP sendiri (cPanel)

Backend PHP lama (`server/api.php` + SQLite, tanpa layanan eksternal) masih
ada di repo dan tetap berfungsi bila suatu hari API ingin dipindah ke
shared hosting. Caranya: build (`npm run build`), upload isi `dist/` +
folder `server/` ke folder web, salin `server/config.example.php` →
`config.php` dan isi email/password admin, lalu arahkan frontend dengan
`VITE_API_BASE` ke alamat API itu. Folder `server/` terlindung `.htaccess`
(hanya `api.php` yang bisa diakses web).
