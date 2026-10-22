# Portofolio New Style — Portofolio Bima Fadi Lana (Tema Adventure RPG)

Portofolio personal bertema game adventure RPG generik (aman lisensi, "ala Zelda"):
pemilik = Hero, proyek = Dungeons, skill = Inventory, sertifikat = Hall of Relics,
kontak = Final Quest. Dibangun mengikuti **PRD v1.4** & **mockup v3** yang disetujui pemilik.

**Syarat utama:** ringan & cepat (anggaran: muatan awal ≤ 600 KB di luar musik),
setiap klik menu/tombol berbunyi (SFX WebAudio, 0 KB file), start + loading screen dipertahankan.

## Menjalankan

```bash
npm install
npm run dev      # pengembangan
npm run build    # produksi -> dist/
npm run preview  # pratinjau build
```

Konten situs bisa diubah lewat **panel admin `/admin`** (Supabase) — lihat `ADMIN.md`.

Deploy: hubungkan repo ini ke **Vercel** (preset Vite) — `vercel.json` sudah berisi
rewrite SPA + header cache/keamanan. Atau hosting statis apa pun dari folder `dist/`.

## Struktur

```
src/
  data/content.ts     <- SEMUA konten situs (proyek, skill, sertifikat, kontak)
  lib/audio.ts        <- mesin SFX 8-bit + BGM chiptune (WebAudio, tanpa file)
  lib/i18n.ts         <- kamus dwibahasa ID/EN
  lib/store.tsx       <- state global (bahasa, tema gelap, mute, BGM)
  components/         <- Boot (start/loading), Navbar, Hero, Sections, ui
  pages/              <- Home, ProjectDetail, MiniDungeon (mini-game)
public/assets/        <- bg-sky.webp (background pixel, 17 KB), og-image.jpg, CV
```

## Mengedit konten

- **Proyek / skill / sertifikat / perjalanan / kontak:** `src/data/content.ts`
  (teks dwibahasa `{ id, en }`).
- **Terjemahan UI:** `src/lib/i18n.ts`.
- **Background:** ganti `public/assets/bg-sky.webp` (jaga ≤ 60 KB, rasio lebar).

## Status & TODO

- [x] Start screen + loading screen (sekali per sesi)
- [x] Hero + panel karakter, Inventory, Dungeons + detail (Quest Log)
- [x] Hall of Relics (viewer sertifikat), Adventure Log, Final Quest (form + modal)
- [x] Mini-game Mini Dungeon — 3 dungeon, bisa dimainkan (peta terverifikasi BFS)
- [x] SFX semua klik, BGM toggle, easter egg ketik `coin`, dwibahasa ID/EN (default ID), dark mode
- [ ] Ganti **nomor WhatsApp, email, LinkedIn, Instagram** final di `src/data/content.ts` (sekarang placeholder)
- [ ] Ganti screenshot proyek (sekarang blok placeholder berlabel) & foto/avatar Hero
- [ ] Ganti CV dummy (`public/assets/cv-bima-fadi-lana.pdf`) dengan CV final
- [ ] Form kontak: v1 memakai `mailto:` — sambungkan EmailJS/Formspree bila ingin kirim tanpa klien email
- [x] Panel admin CRUD konten di `/admin` (Supabase) — setup sekali oleh pemilik, lihat `ADMIN.md`
- [ ] Domain final (ubah canonical/OG di `index.html`)

Semua aset & nama di tema ini orisinal/generik — tanpa aset Nintendo.
