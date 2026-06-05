import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'
import { DEFAULT_CONFIG } from '../tokens/defaults'
import type { Config } from '../tokens/types'

const V2_PREFIX = 'v2:'

export function encode(cfg: Config): string {
  return V2_PREFIX + compressToEncodedURIComponent(JSON.stringify(cfg))
}

export function decode(hash: string): Config | null {
  if (!hash) return null
  const trimmed = hash.startsWith('#') ? hash.slice(1) : hash
  if (!trimmed) return null

  let json: string | null = null
  if (trimmed.startsWith(V2_PREFIX)) {
    json = decompressFromEncodedURIComponent(trimmed.slice(V2_PREFIX.length))
  } else {
    // legacy base64-JSON from reference HTML
    try {
      json = atob(decodeURIComponent(trimmed))
    } catch {
      json = null
    }
  }
  if (!json) return null

  try {
    const parsed = JSON.parse(json) as Partial<Config>
    // Migrate dropped 'pill' radius → 'round'. Pill made every surface
    // unbalanced; always-round elements now hardcode 999px independently.
    if ((parsed.radius as string) === 'pill') {
      parsed.radius = 'round'
    }
    return { ...DEFAULT_CONFIG, ...parsed }
  } catch {
    return null
  }
}

export function readHash(): Config | null {
  if (typeof window === 'undefined') return null
  return decode(window.location.hash)
}

export function writeHash(cfg: Config): void {
  if (typeof window === 'undefined') return
  const next = '#' + encode(cfg)
  if (window.location.hash !== next) {
    history.replaceState(null, '', next)
  }
}
