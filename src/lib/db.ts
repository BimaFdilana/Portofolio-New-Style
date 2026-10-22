// Lapisan baca konten dari API PHP+SQLite (folder server/ di repo ini).
// Bila API tidak terjangkau (mis. situs statis murni), pemanggil memakai data statis.
import type { Certificate, JourneyItem, Project, SkillCategory } from '../data/content'
import { owner as staticOwner } from '../data/content'

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? ''

export interface ContentData {
  projects: Project[]
  certificates: Certificate[]
  skills: SkillCategory[]
  journey: JourneyItem[]
  owner: typeof staticOwner
}

interface ApiContent {
  projects: Project[]
  certificates: Certificate[]
  skills: SkillCategory[]
  journey: JourneyItem[]
  settings: Partial<typeof staticOwner>
}

export async function fetchContent(): Promise<ContentData | null> {
  try {
    const ctrl = new AbortController()
    const to = setTimeout(() => ctrl.abort(), 6000)
    const res = await fetch(`${API_BASE}/api/content`, { signal: ctrl.signal })
    clearTimeout(to)
    if (!res.ok) return null
    const data = (await res.json()) as ApiContent
    if (!data.projects || data.projects.length === 0) return null
    return {
      projects: data.projects,
      certificates: data.certificates ?? [],
      skills: data.skills ?? [],
      journey: data.journey ?? [],
      owner: { ...staticOwner, ...(data.settings ?? {}) },
    }
  } catch {
    return null
  }
}

export { API_BASE }
