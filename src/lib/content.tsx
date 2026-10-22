import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  certificates as staticCerts, journey as staticJourney, owner as staticOwner,
  projects as staticProjects, skillCategories as staticSkills,
} from '../data/content'
import { fetchContent, type ContentData } from './db'

const fallback: ContentData = {
  projects: staticProjects, certificates: staticCerts,
  skills: staticSkills, journey: staticJourney, owner: staticOwner,
}

const Ctx = createContext<ContentData>(fallback)

export function ContentProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<ContentData>(fallback)
  useEffect(() => {
    let alive = true
    fetchContent().then(remote => { if (alive && remote) setData(remote) }).catch(() => {})
    return () => { alive = false }
  }, [])
  return <Ctx.Provider value={data}>{children}</Ctx.Provider>
}

export function useContent(): ContentData {
  return useContext(Ctx)
}
