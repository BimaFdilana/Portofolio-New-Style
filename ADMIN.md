# Panduan Admin — Panel CRUD Konten (PHP + SQLite)

Panel admin ada di **`/admin`**. Desainnya sengaja **sederhana & polos**
(bukan tema game): dashboard ringkasan + menu **Proyek, Sertifikat, Keahlian,
Perjalanan, Pengaturan**.

Backend-nya cukup **PHP + SQLite** di server milik sendiri — tanpa layanan
eksternal, tanpa database server. Semua logika ada di `server/api.php`
(satu file), data tersimpan di file SQLite yang dibuat otomatis.

## Cara kerja

- Situs publik (React) memanggil `GET /api/content` untuk mengambil konten.
  Bila API belum terpasang, situs otomatis memakai data bawaan
  (`src/data/content.ts`) — situs tidak pernah kosong.
- Panel admin login (email + password), lalu mengelola data lewat API yang
  sama. Password tersimpan sebagai hash; sesi berupa token (7 hari).
- Perubahan di panel **langsung live** di situs (tanpa build ulang).

## Pemasangan di server (sekali saja)

1. Build situs: `npm run build` → hasilnya di folder `dist/`.
2. Upload **isi `dist/`** ke folder web (mis. `public_html/`), **termasuk**
   file `.htaccess` di dalamnya.
3. Upload folder **`server/`** ke dalam folder web yang sama, sehingga ada
   `public_html/server/api.php`. File `data.sqlite` akan dibuat otomatis di
   folder ini saat API pertama kali diakses (pastikan folder bisa ditulis
   server). Folder ini terlindung `.htaccess` (hanya `api.php` yang bisa
   diakses web).
   - Lebih aman lagi (opsional): arahkan `db_path` di config ke folder
     di luar `public_html`.
4. Di folder `server/`, salin **`config.example.php` → `config.php`**, lalu
   isi `admin_email` dan `admin_password` dengan akun adminmu.
5. Buka `https://domain-kamu/admin` → login dengan email/password itu. Selesai!
   Data awal (3 proyek, sertifikat, keahlian, perjalanan, pengaturan) sudah
   terisi otomatis dari `server/seed.json` pada akses pertama.

## Menguji di komputer lokal

```bash
npm run build
cp -r server dist/server            # gabungkan API ke hasil build
cp server/config.example.php dist/server/config.php   # lalu isi password-nya
php -S localhost:8099 -t dist dist/server/api.php
# buka http://localhost:8099  dan  http://localhost:8099/admin
```

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
- Jangan bagikan `config.php` (berisi password awal) — file ini sudah masuk
  `.gitignore` dan terlindung `.htaccess`.
- **Cadangan data = salin file `data.sqlite`.** Mengembalikannya = timpa
  file itu kembali. Sesederhana itu.
- Ganti password admin: ubah `admin_password` di `config.php` lalu hapus isi
  tabel `admins` (atau hapus file `data.sqlite` — tapi data konten ikut
  tereset; lebih aman ubah hash lewat login ulang setelah mengosongkan tabel
  `admins` dengan sqlite3/phpMyAdmin bila tersedia).
