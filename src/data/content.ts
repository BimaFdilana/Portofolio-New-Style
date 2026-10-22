// ==================== DATA PORTOFOLIO (data statis v1) ====================
// Ganti isi file ini untuk memperbarui konten situs. Teks dwibahasa: { id, en }.

export interface Bi { id: string; en: string }

export const owner = {
  name: 'Bima Fadi Lana',
  brand: 'BIMA.',
  role: 'Full Stack Developer',
  location: 'Indonesia',
  available: true,
  hp: 99,
  level: 12,
  expYears: '4+',
  mastery: 'Web App Forging',
  weakness: 'BUGS',
  resistance: 'ERRORS',
  email: 'bima.fadilana@gmail.com', // TODO: pastikan alamat email publik final
  whatsapp: '6281234567890',        // TODO: ganti nomor WhatsApp publik final (format 62...)
  github: 'https://github.com/BimaFdilana',
  linkedin: 'https://www.linkedin.com/',  // TODO: ganti URL LinkedIn final
  instagram: 'https://www.instagram.com/', // TODO: ganti URL Instagram final
  cvUrl: '/assets/cv-bima-fadi-lana.pdf',
}

export interface SkillCategory { icon: string; title: Bi; items: string[]; levels: number[] }
export const skillCategories: SkillCategory[] = [
  { icon: '🗡️', title: { id: 'SENJATA · FRONTEND', en: 'WEAPONS · FRONTEND' },
    items: ['React', 'TypeScript', 'JavaScript', 'Tailwind CSS', 'HTML5 / CSS3'],
    levels: [88, 84, 92, 90, 94] },
  { icon: '🛡️', title: { id: 'PERISAI · BACKEND', en: 'SHIELDS · BACKEND' },
    items: ['Laravel', 'PHP', 'Node.js', 'REST API'],
    levels: [93, 92, 74, 88] },
  { icon: '🗺️', title: { id: 'PETA & GULUNGAN · DATABASE', en: 'MAPS & SCROLLS · DATABASE' },
    items: ['MySQL', 'PostgreSQL', 'SQLite'],
    levels: [90, 76, 84] },
  { icon: '🧰', title: { id: 'PERKAKAS · DEVOPS & CLOUD', en: 'TOOLS · DEVOPS & CLOUD' },
    items: ['Git & GitHub', 'Linux / cPanel', 'Vercel', 'Docker (dasar)'],
    levels: [90, 82, 85, 60] },
  { icon: '🤝', title: { id: 'DAGANG · BISNIS', en: 'TRADE · BUSINESS' },
    items: ['Analisis Kebutuhan', 'Dokumentasi PRD', 'Manajemen Proyek Kecil'],
    levels: [86, 90, 78] },
  { icon: '✨', title: { id: 'SIHIR · OTOMASI & SEO', en: 'MAGIC · AUTOMATION & SEO' },
    items: ['Python Scraping', 'Web Automation', 'Technical SEO', 'Web Performance'],
    levels: [80, 78, 84, 88] },
]

export interface Project {
  slug: string; name: string; difficulty: 1 | 2 | 3; grad: string; hue: string
  short: Bi; role: Bi; duration: Bi; stack: string[]
  features: Bi[]; boss: { title: Bi; body: Bi }[]; featuresLong?: Bi
  demo?: string; repo?: string
}
const B = (id: string, en: string): Bi => ({ id, en })

export const projects: Project[] = [
  {
    slug: 'lkpm-monitor', name: 'LKPM Monitor', difficulty: 3, grad: 'linear-gradient(135deg,#7fa3c0,#4e7396)', hue: 'LKPM',
    short: B('Sistem monitoring laporan investasi (LKPM Non-UMK) untuk DPMPTSP dengan skor prioritas perusahaan dan tindak lanjut PIC.',
              'Investment report (LKPM Non-UMK) monitoring system for a government agency with company priority scoring and PIC follow-up.'),
    role: B('Full Stack Developer (solo)', 'Full Stack Developer (solo)'),
    duration: B('Berjalan', 'Ongoing'),
    stack: ['Laravel', 'MySQL', 'JavaScript', 'Bootstrap'],
    features: [
      B('Impor 4 file Excel OSS dengan deduplikasi & aturan validasi', 'Import of 4 OSS Excel files with deduplication & validation rules'),
      B('Mesin skor prioritas 100 perusahaan (bobot dapat diatur)', 'Priority scoring engine for 100 companies (configurable weights)'),
      B('Dashboard capaian per triwulan & perbandingan YoY', 'Quarterly achievement dashboard & YoY comparison'),
      B('Modul follow-up PIC dengan log kontak perusahaan', 'PIC follow-up module with company contact logs'),
    ],
    boss: [
      { title: B('Data ganda antar-file impor', 'Duplicate data across import files'),
        body: B('Dirancang aturan dedup berlapis (kunci logis + tanggal lapor terbaru + status) agar satu laporan tidak terhitung dua kali.', 'Designed layered dedup rules (logical key + latest report date + status) so one report is never double-counted.') },
      { title: B('Pengguna awam teknologi', 'Non-technical users'),
        body: B('Antarmuka disederhanakan: kartu info anti salah-info dan alur impor terpandu langkah demi langkah.', 'Simplified UI: mistake-proof info cards and a guided step-by-step import flow.') },
    ],
    demo: '', repo: 'https://github.com/BimaFdilana/Lkpm-Sistem',
  },
  {
    slug: 'rumah-cahaya', name: 'Rumah Cahaya-bks', difficulty: 2, grad: 'linear-gradient(135deg,#d9a7b8,#b5533c)', hue: 'EBOOK',
    short: B('Marketplace Ebook anak & MiniApp HTML5 (PWA) dengan checkout QRIS dan verifikasi admin.',
              "Children's Ebook & HTML5 MiniApp marketplace (PWA) with QRIS checkout and admin verification."),
    role: B('Full Stack Developer (solo)', 'Full Stack Developer (solo)'),
    duration: B('±2 bulan', '±2 months'),
    stack: ['Laravel', 'MySQL', 'PWA', 'QRIS'],
    features: [
      B('Katalog produk & bundle dengan halaman promo / iklan', 'Product & bundle catalog with promo / ad landing pages'),
      B('Checkout QRIS manual + verifikasi admin', 'Manual QRIS checkout + admin verification'),
      B('MiniApp terpasang sebagai PWA per produk (install token)', 'Per-product installable MiniApp PWA (install tokens)'),
      B('Panel admin lengkap: order, backup, log aktivitas', 'Full admin panel: orders, backups, activity logs'),
    ],
    boss: [
      { title: B('PWA di iOS tanpa login ulang', 'PWA on iOS without re-login'),
        body: B('Entitlement memakai install token per perangkat agar MiniApp tetap bisa dibuka dari Home Screen iOS.', 'Entitlement via per-device install tokens so MiniApps open straight from the iOS Home Screen.') },
    ],
    demo: 'https://rumahcahaya.web.id', repo: 'https://github.com/BimaFdilana/Teman-Bermain',
  },
  {
    slug: 'oss-scraper', name: 'OSS Data Scraper', difficulty: 2, grad: 'linear-gradient(135deg,#a7c4a0,#5f7f52)', hue: 'AUTO',
    short: B('Alat otomasi penarikan data OSS: login, OTP, pencarian NIB, dan ekspor laporan.',
              'OSS data extraction automation: login, OTP, NIB search, and report export.'),
    role: B('Developer (solo)', 'Developer (solo)'),
    duration: B('±1 bulan', '±1 month'),
    stack: ['Python', 'Playwright', 'Pandas'],
    features: [
      B('Login otomatis dengan penanganan OTP', 'Automated login with OTP handling'),
      B('Pencarian & penarikan data berbasis NIB', 'NIB-based data search & extraction'),
      B('Ekspor hasil ke Excel siap olah', 'Export results to ready-to-use Excel'),
    ],
    boss: [
      { title: B('Halaman OSS yang lambat & berubah-ubah', 'Slow, ever-changing OSS pages'),
        body: B('Selector dibuat tangguh dengan fallback berlapis dan retry cerdas.', 'Resilient selectors with layered fallbacks and smart retries.') },
    ],
    demo: '', repo: '',
  },
]

export interface Certificate { title: Bi; issuer: string; year: number; pages: number }
export const certificates: Certificate[] = [
  { title: B('Sertifikat Kompetensi Web Development', 'Web Development Competency Certificate'), issuer: 'BNSP', year: 2024, pages: 1 },
  { title: B('Pelatihan Laravel & REST API', 'Laravel & REST API Training'), issuer: 'Dicoding Indonesia', year: 2024, pages: 2 },
  { title: B('Sertifikat Dasar Pemrograman Web', 'Web Programming Fundamentals Certificate'), issuer: 'Dicoding Indonesia', year: 2023, pages: 1 },
]

export interface JourneyItem { period: string; title: Bi; body: Bi; active?: boolean }
export const journey: JourneyItem[] = [
  { period: '2025 — SEKARANG', active: true,
    title: B('Developer — DPMPTSP (LKPM Monitor)', 'Developer — DPMPTSP (LKPM Monitor)'),
    body: B('Membangun ulang sistem monitoring LKPM Non-UMK: impor data OSS, skor prioritas perusahaan, dan tindak lanjut PIC.', 'Rebuilding the Non-UMK LKPM monitoring system: OSS data imports, company priority scoring, and PIC follow-ups.') },
  { period: '2025',
    title: B('Freelance — Rumah Cahaya-bks', 'Freelance — Rumah Cahaya-bks'),
    body: B('Marketplace Ebook anak & MiniApp PWA: 6 fase selesai, live di rumahcahaya.web.id.', "Children's Ebook & MiniApp PWA marketplace: 6 phases done, live at rumahcahaya.web.id.") },
  { period: '2024',
    title: B('Memulai petualangan Full Stack', 'The Full Stack adventure begins'),
    body: B('Fokus Laravel + JavaScript modern; proyek otomasi data dan aplikasi web dinas.', 'Focus on Laravel + modern JavaScript; data automation tools and agency web apps.') },
]
