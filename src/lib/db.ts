// Lapisan baca konten dari Supabase (REST, tanpa SDK agar bundle publik tetap ringan).
// Bila env belum diisi atau jaringan gagal -> null, pemanggil memakai data statis.
import type { Certificate, JourneyItem, Project, SkillCategory } from '../data/content'
import { owner as staticOwner } from '../data/content'

const SB_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const SB_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabaseConfigured = Boolean(SB_URL && SB_ANON)
export const supabaseUrl = SB_URL ?? ''
export const supabaseAnon = SB_ANON ?? ''

export interface ContentData {
  projects: Project[]
  certificates: Certificate[]
  skills: SkillCategory[]
  journey: JourneyItem[]
  owner: typeof staticOwner
}

async function rest<T>(path: string): Promise<T | null> {
  if (!supabaseConfigured) return null
  try {
    const ctrl = new AbortController()
    const to = setTimeout(() => ctrl.abort(), 6000)
    const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
      headers: { apikey: SB_ANON!, Authorization: `Bearer ${SB_ANON}` },
      signal: ctrl.signal,
    })
    clearTimeout(to)
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

interface ProjectRow {
  slug: string; name: string; difficulty: 1 | 2 | 3; grad: string; hue: string
  short_id: string; short_en: string; role_id: string; role_en: string
  duration_id: string; duration_en: string; stack: string[]
  features: { id: string; en: string }[]
  boss: { title: { id: string; en: string }; body: { id: string; en: string } }[]
  demo: string; repo: string
}
interface CertRow { title_id: string; title_en: string; issuer: string; year: number; pages: number }
interface SkillRow { icon: string; title_id: string; title_en: string; items: { name: string; level: number }[] }
interface JourneyRow { period: string; title_id: string; title_en: string; body_id: string; body_en: string; active: boolean }
interface SettingsRow { data: Partial<typeof staticOwner> }

export async function fetchContent(): Promise<ContentData | null> {
  if (!supabaseConfigured) return null
  const [projects, certs, skills, journey, settings] = await Promise.all([
    rest<ProjectRow[]>('projects?select=*&published=eq.true&order=sort.asc'),
    rest<CertRow[]>('certificates?select=*&order=sort.asc'),
    rest<SkillRow[]>('skill_categories?select=*&order=sort.asc'),
    rest<JourneyRow[]>('journey?select=*&order=sort.asc'),
    rest<SettingsRow[]>('site_settings?select=data&id=eq.1'),
  ])
  if (!projects || projects.length === 0) return null
  return {
    projects: projects.map(p => ({
      slug: p.slug, name: p.name, difficulty: p.difficulty, grad: p.grad, hue: p.hue,
      short: { id: p.short_id, en: p.short_en }, role: { id: p.role_id, en: p.role_en },
      duration: { id: p.duration_id, en: p.duration_en }, stack: p.stack ?? [],
      features: p.features ?? [], boss: p.boss ?? [], demo: p.demo ?? '', repo: p.repo ?? '',
    })),
    certificates: (certs ?? []).map(c => ({ title: { id: c.title_id, en: c.title_en }, issuer: c.issuer, year: c.year, pages: c.pages })),
    skills: (skills ?? []).map(s => ({
      icon: s.icon, title: { id: s.title_id, en: s.title_en },
      items: (s.items ?? []).map(i => i.name), levels: (s.items ?? []).map(i => i.level),
    })),
    journey: (journey ?? []).map(j => ({
      period: j.period, title: { id: j.title_id, en: j.title_en },
      body: { id: j.body_id, en: j.body_en }, active: j.active,
    })),
    owner: { ...staticOwner, ...(settings?.[0]?.data ?? {}) },
  }
}
