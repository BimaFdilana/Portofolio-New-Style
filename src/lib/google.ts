// Google Identity Services (tombol "Masuk dengan Google") — dimuat dinamis
// supaya halaman yang tidak butuh login tidak ikut memuat skrip Google.
// Catatan: ini hanya membaca identitas dari ID token untuk tampilan;
// PEMERIKSAAN token yang sesungguhnya dilakukan server (api/reviews.ts).
export interface GoogleUser {
  name: string
  email: string
  picture: string
  credential: string
}

type GisId = {
  initialize: (opts: { client_id: string; callback: (res: { credential?: string }) => void }) => void
  renderButton: (el: HTMLElement, opts: Record<string, unknown>) => void
}

function gis(): GisId | null {
  const w = window as unknown as { google?: { accounts?: { id?: GisId } } }
  return w.google?.accounts?.id ?? null
}

let scriptPromise: Promise<void> | null = null

export function loadGis(): Promise<void> {
  if (gis()) return Promise.resolve()
  if (!scriptPromise) {
    scriptPromise = new Promise<void>((resolve, reject) => {
      const s = document.createElement('script')
      s.src = 'https://accounts.google.com/gsi/client'
      s.async = true
      s.defer = true
      s.onload = () => resolve()
      s.onerror = () => {
        scriptPromise = null
        reject(new Error('Gagal memuat Google Identity Services.'))
      }
      document.head.appendChild(s)
    })
  }
  return scriptPromise
}

export function initGoogleButton(
  el: HTMLElement,
  clientId: string,
  onCredential: (credential: string) => void,
): void {
  const id = gis()
  if (!id) return
  el.innerHTML = ''
  id.initialize({ client_id: clientId, callback: (res) => { if (res.credential) onCredential(res.credential) } })
  id.renderButton(el, { theme: 'outline', size: 'large', text: 'signin_with', width: 280 })
}

/** Decode payload ID token (tanpa verifikasi — hanya untuk tampilan nama/foto). */
export function decodeCredential(credential: string): { name: string; email: string; picture: string } | null {
  try {
    const part = credential.split('.')[1]
    const payload = JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/'))) as Record<string, unknown>
    if (typeof payload.name !== 'string') return null
    return {
      name: payload.name,
      email: typeof payload.email === 'string' ? payload.email : '',
      picture: typeof payload.picture === 'string' ? payload.picture : '',
    }
  } catch {
    return null
  }
}
