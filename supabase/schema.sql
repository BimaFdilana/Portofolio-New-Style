-- ============================================================
-- Skema konten Portofolio New Style (Supabase / PostgreSQL)
-- Jalankan SELURUH file ini di: Supabase Dashboard -> SQL Editor
-- Aman dijalankan ulang (idempotent sebisa mungkin).
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  difficulty int not null default 2 check (difficulty between 1 and 3),
  grad text not null default '',
  hue text not null default '',
  short_id text not null default '', short_en text not null default '',
  role_id text not null default '', role_en text not null default '',
  duration_id text not null default '', duration_en text not null default '',
  stack text[] not null default '{}',
  features jsonb not null default '[]',
  boss jsonb not null default '[]',
  demo text not null default '', repo text not null default '',
  sort int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  title_id text not null default '', title_en text not null default '',
  issuer text not null default '', year int not null default 2026,
  pages int not null default 1, sort int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.skill_categories (
  id uuid primary key default gen_random_uuid(),
  icon text not null default '', title_id text not null default '', title_en text not null default '',
  items jsonb not null default '[]',  -- [{"name":"React","level":88}]
  sort int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.journey (
  id uuid primary key default gen_random_uuid(),
  period text not null default '', title_id text not null default '', title_en text not null default '',
  body_id text not null default '', body_en text not null default '',
  active boolean not null default false, sort int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  id int primary key,
  data jsonb not null default '{}'
);

-- Keamanan: publik hanya membaca; menulis wajib login (user admin).
alter table public.projects enable row level security;
alter table public.certificates enable row level security;
alter table public.skill_categories enable row level security;
alter table public.journey enable row level security;
alter table public.site_settings enable row level security;

do $$
declare t text;
begin
  foreach t in array array['projects','certificates','skill_categories','journey','site_settings'] loop
    execute format('drop policy if exists "public read" on public.%I', t);
    execute format('create policy "public read" on public.%I for select using (true)', t);
    execute format('drop policy if exists "admin write" on public.%I', t);
    execute format('create policy "admin write" on public.%I for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;

-- ==================== DATA AWAL (seed) ====================
-- Sama dengan konten bawaan situs; jalankan sekali. Baris lama dengan slug sama ditimpa.
insert into public.projects (slug,name,difficulty,grad,hue,short_id,short_en,role_id,role_en,duration_id,duration_en,stack,features,boss,demo,repo,sort) values ('lkpm-monitor','LKPM Monitor',3,'linear-gradient(135deg,#7fa3c0,#4e7396)','LKPM','Sistem monitoring laporan investasi (LKPM Non-UMK) untuk DPMPTSP dengan skor prioritas perusahaan dan tindak lanjut PIC.','Investment report (LKPM Non-UMK) monitoring system for a government agency with company priority scoring and PIC follow-up.','Full Stack Developer (solo)','Full Stack Developer (solo)','Berjalan','Ongoing',array['Laravel','MySQL','JavaScript','Bootstrap'],'[{"id": "Impor 4 file Excel OSS dengan deduplikasi & aturan validasi", "en": "Import of 4 OSS Excel files with deduplication & validation rules"}, {"id": "Mesin skor prioritas 100 perusahaan (bobot dapat diatur)", "en": "Priority scoring engine for 100 companies (configurable weights)"}, {"id": "Dashboard capaian per triwulan & perbandingan YoY", "en": "Quarterly achievement dashboard & YoY comparison"}, {"id": "Modul follow-up PIC dengan log kontak perusahaan", "en": "PIC follow-up module with company contact logs"}]'::jsonb,'[{"title": {"id": "Data ganda antar-file impor", "en": "Duplicate data across import files"}, "body": {"id": "Dirancang aturan dedup berlapis (kunci logis + tanggal lapor terbaru + status) agar satu laporan tidak terhitung dua kali.", "en": "Designed layered dedup rules (logical key + latest report date + status) so one report is never double-counted."}}, {"title": {"id": "Pengguna awam teknologi", "en": "Non-technical users"}, "body": {"id": "Antarmuka disederhanakan: kartu info anti salah-info dan alur impor terpandu langkah demi langkah.", "en": "Simplified UI: mistake-proof info cards and a guided step-by-step import flow."}}]'::jsonb,'','https://github.com/BimaFdilana/Lkpm-Sistem',1) on conflict (slug) do update set name=excluded.name, difficulty=excluded.difficulty, grad=excluded.grad, hue=excluded.hue, short_id=excluded.short_id, short_en=excluded.short_en, role_id=excluded.role_id, role_en=excluded.role_en, duration_id=excluded.duration_id, duration_en=excluded.duration_en, stack=excluded.stack, features=excluded.features, boss=excluded.boss, demo=excluded.demo, repo=excluded.repo, sort=excluded.sort;
insert into public.projects (slug,name,difficulty,grad,hue,short_id,short_en,role_id,role_en,duration_id,duration_en,stack,features,boss,demo,repo,sort) values ('rumah-cahaya','Rumah Cahaya-bks',2,'linear-gradient(135deg,#d9a7b8,#b5533c)','EBOOK','Marketplace Ebook anak & MiniApp HTML5 (PWA) dengan checkout QRIS dan verifikasi admin.','Children''s Ebook & HTML5 MiniApp marketplace (PWA) with QRIS checkout and admin verification.','Full Stack Developer (solo)','Full Stack Developer (solo)','±2 bulan','±2 months',array['Laravel','MySQL','PWA','QRIS'],'[{"id": "Katalog produk & bundle dengan halaman promo / iklan", "en": "Product & bundle catalog with promo / ad landing pages"}, {"id": "Checkout QRIS manual + verifikasi admin", "en": "Manual QRIS checkout + admin verification"}, {"id": "MiniApp terpasang sebagai PWA per produk (install token)", "en": "Per-product installable MiniApp PWA (install tokens)"}, {"id": "Panel admin lengkap: order, backup, log aktivitas", "en": "Full admin panel: orders, backups, activity logs"}]'::jsonb,'[{"title": {"id": "PWA di iOS tanpa login ulang", "en": "PWA on iOS without re-login"}, "body": {"id": "Entitlement memakai install token per perangkat agar MiniApp tetap bisa dibuka dari Home Screen iOS.", "en": "Entitlement via per-device install tokens so MiniApps open straight from the iOS Home Screen."}}]'::jsonb,'https://rumahcahaya.web.id','https://github.com/BimaFdilana/Teman-Bermain',2) on conflict (slug) do update set name=excluded.name, difficulty=excluded.difficulty, grad=excluded.grad, hue=excluded.hue, short_id=excluded.short_id, short_en=excluded.short_en, role_id=excluded.role_id, role_en=excluded.role_en, duration_id=excluded.duration_id, duration_en=excluded.duration_en, stack=excluded.stack, features=excluded.features, boss=excluded.boss, demo=excluded.demo, repo=excluded.repo, sort=excluded.sort;
insert into public.projects (slug,name,difficulty,grad,hue,short_id,short_en,role_id,role_en,duration_id,duration_en,stack,features,boss,demo,repo,sort) values ('oss-scraper','OSS Data Scraper',2,'linear-gradient(135deg,#a7c4a0,#5f7f52)','AUTO','Alat otomasi penarikan data OSS: login, OTP, pencarian NIB, dan ekspor laporan.','OSS data extraction automation: login, OTP, NIB search, and report export.','Developer (solo)','Developer (solo)','±1 bulan','±1 month',array['Python','Playwright','Pandas'],'[{"id": "Login otomatis dengan penanganan OTP", "en": "Automated login with OTP handling"}, {"id": "Pencarian & penarikan data berbasis NIB", "en": "NIB-based data search & extraction"}, {"id": "Ekspor hasil ke Excel siap olah", "en": "Export results to ready-to-use Excel"}]'::jsonb,'[{"title": {"id": "Halaman OSS yang lambat & berubah-ubah", "en": "Slow, ever-changing OSS pages"}, "body": {"id": "Selector dibuat tangguh dengan fallback berlapis dan retry cerdas.", "en": "Resilient selectors with layered fallbacks and smart retries."}}]'::jsonb,'','',3) on conflict (slug) do update set name=excluded.name, difficulty=excluded.difficulty, grad=excluded.grad, hue=excluded.hue, short_id=excluded.short_id, short_en=excluded.short_en, role_id=excluded.role_id, role_en=excluded.role_en, duration_id=excluded.duration_id, duration_en=excluded.duration_en, stack=excluded.stack, features=excluded.features, boss=excluded.boss, demo=excluded.demo, repo=excluded.repo, sort=excluded.sort;

delete from public.certificates;
insert into public.certificates (title_id,title_en,issuer,year,pages,sort) values ('Sertifikat Kompetensi Web Development','Web Development Competency Certificate','BNSP',2024,1,1);
insert into public.certificates (title_id,title_en,issuer,year,pages,sort) values ('Pelatihan Laravel & REST API','Laravel & REST API Training','Dicoding Indonesia',2024,2,2);
insert into public.certificates (title_id,title_en,issuer,year,pages,sort) values ('Sertifikat Dasar Pemrograman Web','Web Programming Fundamentals Certificate','Dicoding Indonesia',2023,1,3);

delete from public.skill_categories;
insert into public.skill_categories (icon,title_id,title_en,items,sort) values ('🗡️','SENJATA · FRONTEND','WEAPONS · FRONTEND','[{"name": "React", "level": 88}, {"name": "TypeScript", "level": 84}, {"name": "JavaScript", "level": 92}, {"name": "Tailwind CSS", "level": 90}, {"name": "HTML5 / CSS3", "level": 94}]'::jsonb,1);
insert into public.skill_categories (icon,title_id,title_en,items,sort) values ('🛡️','PERISAI · BACKEND','SHIELDS · BACKEND','[{"name": "Laravel", "level": 93}, {"name": "PHP", "level": 92}, {"name": "Node.js", "level": 74}, {"name": "REST API", "level": 88}]'::jsonb,2);
insert into public.skill_categories (icon,title_id,title_en,items,sort) values ('🗺️','PETA & GULUNGAN · DATABASE','MAPS & SCROLLS · DATABASE','[{"name": "MySQL", "level": 90}, {"name": "PostgreSQL", "level": 76}, {"name": "SQLite", "level": 84}]'::jsonb,3);
insert into public.skill_categories (icon,title_id,title_en,items,sort) values ('🧰','PERKAKAS · DEVOPS & CLOUD','TOOLS · DEVOPS & CLOUD','[{"name": "Git & GitHub", "level": 90}, {"name": "Linux / cPanel", "level": 82}, {"name": "Vercel", "level": 85}, {"name": "Docker (dasar)", "level": 60}]'::jsonb,4);
insert into public.skill_categories (icon,title_id,title_en,items,sort) values ('🤝','DAGANG · BISNIS','TRADE · BUSINESS','[{"name": "Analisis Kebutuhan", "level": 86}, {"name": "Dokumentasi PRD", "level": 90}, {"name": "Manajemen Proyek Kecil", "level": 78}]'::jsonb,5);
insert into public.skill_categories (icon,title_id,title_en,items,sort) values ('✨','SIHIR · OTOMASI & SEO','MAGIC · AUTOMATION & SEO','[{"name": "Python Scraping", "level": 80}, {"name": "Web Automation", "level": 78}, {"name": "Technical SEO", "level": 84}, {"name": "Web Performance", "level": 88}]'::jsonb,6);

delete from public.journey;
insert into public.journey (period,title_id,title_en,body_id,body_en,active,sort) values ('2025 — SEKARANG','Developer — DPMPTSP (LKPM Monitor)','Developer — DPMPTSP (LKPM Monitor)','Membangun ulang sistem monitoring LKPM Non-UMK: impor data OSS, skor prioritas perusahaan, dan tindak lanjut PIC.','Rebuilding the Non-UMK LKPM monitoring system: OSS data imports, company priority scoring, and PIC follow-ups.',true,1);
insert into public.journey (period,title_id,title_en,body_id,body_en,active,sort) values ('2025','Freelance — Rumah Cahaya-bks','Freelance — Rumah Cahaya-bks','Marketplace Ebook anak & MiniApp PWA: 6 fase selesai, live di rumahcahaya.web.id.','Children''s Ebook & MiniApp PWA marketplace: 6 phases done, live at rumahcahaya.web.id.',false,2);
insert into public.journey (period,title_id,title_en,body_id,body_en,active,sort) values ('2024','Memulai petualangan Full Stack','The Full Stack adventure begins','Fokus Laravel + JavaScript modern; proyek otomasi data dan aplikasi web dinas.','Focus on Laravel + modern JavaScript; data automation tools and agency web apps.',false,3);

insert into public.site_settings (id, data) values (1, '{"name": "Bima Fadi Lana", "brand": "BIMA.", "role": "Full Stack Developer", "location": "Indonesia", "available": true, "hp": 99, "level": 12, "expYears": "4+", "mastery": "Web App Forging", "weakness": "BUGS", "resistance": "ERRORS", "email": "bima.fadilana@gmail.com", "whatsapp": "6281234567890", "github": "https://github.com/BimaFdilana", "linkedin": "https://www.linkedin.com/", "instagram": "https://www.instagram.com/", "cvUrl": "/assets/cv-bima-fadi-lana.pdf"}'::jsonb) on conflict (id) do update set data=excluded.data;
