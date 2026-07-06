import { useMemo, useState, type CSSProperties } from 'react'
import { decode } from './hash'
import { buildTokens } from '../tokens/buildTokens'
import { DEFAULT_CONFIG } from '../tokens/defaults'
import type { Config } from '../tokens/types'

const LS_KEY = 'uicockpit:last-kit'

/**
 * IA-3 — the kit bridge. The site's reference surfaces (/components, /showcases)
 * can render in the VISITOR'S own kit, not just the default — the one claim only
 * a generator can make ("reference docs, themed by your kit").
 *
 * The signal is the URL hash: the configurator persists the config there, and the
 * SPA router preserves the hash across navigation, so a visitor who tuned a kit at
 * /app keeps #<hash> when they move to /components. We also mirror it to
 * localStorage so a returning visitor (fresh tab, no hash) still gets their kit.
 *
 * `showKit` lets the page toggle Default ↔ Your kit; when there is no kit at all,
 * `hasKit` is false and the toggle is hidden.
 */
export function useVisitorKit() {
  const visitorCfg = useMemo<Config | null>(() => {
    if (typeof window === 'undefined') return null
    // A kit only counts if it both decodes AND builds — a malformed or stale
    // hash (a truncated paste, an old link, a hand-edited URL) must fall back to
    // the default kit, never blank the page. buildTokens is the real gate.
    const validate = (cfg: Config | null): Config | null => {
      if (!cfg) return null
      try { buildTokens(cfg); return cfg } catch { return null }
    }
    const fromHash = validate(decode(window.location.hash))
    if (fromHash) {
      try { localStorage.setItem(LS_KEY, window.location.hash.replace(/^#/, '')) } catch { /* ignore */ }
      return fromHash
    }
    try {
      const saved = localStorage.getItem(LS_KEY)
      if (saved) return validate(decode(saved))
    } catch { /* ignore */ }
    return null
  }, [])

  const hasKit = visitorCfg != null
  const [showKit, setShowKit] = useState(hasKit)
  const cfg = showKit && visitorCfg ? visitorCfg : DEFAULT_CONFIG

  const tokens = useMemo(() => buildTokens(cfg).vars as CSSProperties, [cfg])

  return { cfg, tokens, iconSet: cfg.iconSet, hasKit, showKit, setShowKit }
}
