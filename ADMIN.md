# Panduan Admin — Panel CRUD Konten

Panel admin ada di **`/admin`** (mis. `http://localhost:5173/admin` saat dev).
Desainnya sengaja **sederhana & polos** (bukan tema game) supaya cepat dipakai:
dashboard ringkasan, lalu menu **Proyek, Sertifikat, Keahlian, Perjalanan, Pengaturan**.

Konten dikelola lewat **Supabase** (gratis). Situs publik membaca dari Supabase;
bila Supabase belum terhubung, situs otomatis memakai data bawaan di
`src/data/content.ts` — jadi situs tidak pernah tampil kosong.

## Setup (sekali saja, ±10 menit)

1. **Buat proyek Supabase** di https://supabase.com (tombol *New project*, pilih
   region Singapore). Tunggu proyek selesai dibuat.
2. **Jalankan skema + data awal:** buka **SQL Editor** → *New query* →
   salin seluruh isi file `supabase/schema.sql` → **Run**.
   Ini membuat 5 tabel (projects, certificates, skill_categories, journey,
   site_settings), aturan keamanan (publik hanya bisa membaca; menulis wajib
   login), dan mengisi data awal yang sama dengan situs saat ini.
3. **Buat akun admin:** menu **Authentication → Users → Add user** —
   isi email + password yang akan dipakai login di `/admin`.
   (Matikan pendaftaran publik di Authentication → Providers → Email bila diminta.)
4. **Hubungkan situs:** salin `.env.example` menjadi `.env`, lalu isi dari
   **Project Settings → API**:
   - `VITE_SUPABASE_URL` = Project URL
   - `VITE_SUPABASE_ANON_KEY` = anon public key
5. **Build ulang** (`npm run build`) — atau restart `npm run dev`.
   Buka `/admin`, login, selesai. Setiap perubahan langsung live di situs.

## Yang bisa diubah dari panel

- **Proyek:** nama, slug, kesulitan, warna sampul, deskripsi/peran/durasi
  (dwibahasa ID/EN), tech stack, fitur (Loot), tantangan & solusi (Boss Battle),
  link demo/GitHub, urutan, status tayang/draf.
- **Sertifikat:** judul (ID/EN), penerbit, tahun, jumlah halaman (untuk viewer).
- **Keahlian:** kategori + ikon, item skill dan levelnya.
- **Perjalanan:** periode, judul & isi (ID/EN), tanda quest aktif.
- **Pengaturan:** nama, peran, lokasi, email, nomor WhatsApp, tautan
  GitHub/LinkedIn/Instagram, URL CV, dan panel karakter hero (HP, level,
  pengalaman, badge ketersediaan).

## Catatan keamanan

- Key yang dipakai situs hanyalah **anon key** (aman untuk publik) — keamanan
  dijaga aturan RLS: tanpa login admin, data hanya bisa **dibaca**.
- Jangan pernah memasukkan **service_role key** ke file `.env` frontend.
- File `.env` asli sudah masuk `.gitignore` (tidak ikut ter-commit).
