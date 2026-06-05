import { useEffect, useMemo, useReducer, useRef } from 'react'
import { DEFAULT_CONFIG } from '../tokens/defaults'
import { buildTokens } from '../tokens/buildTokens'
import type { Config } from '../tokens/types'
import type { Tokens } from '../tokens/types'
import { readHash, writeHash } from './hash'
import { configReducer, type ConfigAction } from './configReducer'

const HASH_DEBOUNCE_MS = 150

interface UseConfigResult {
  cfg: Config
  tokens: Tokens
  dispatch: (action: ConfigAction) => void
}

function initFromHash(): Config {
  return readHash() ?? DEFAULT_CONFIG
}

export function useConfig(): UseConfigResult {
  const [cfg, dispatch] = useReducer(configReducer, undefined, initFromHash)
  const writeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // sync to URL hash with debounce
  useEffect(() => {
    if (writeTimer.current) clearTimeout(writeTimer.current)
    writeTimer.current = setTimeout(() => {
      writeHash(cfg)
    }, HASH_DEBOUNCE_MS)
    return () => {
      if (writeTimer.current) clearTimeout(writeTimer.current)
    }
  }, [cfg])

  // listen for hash changes from back/forward navigation
  useEffect(() => {
    const onHashChange = () => {
      const next = readHash()
      if (next) dispatch({ type: 'REPLACE', cfg: next })
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const tokens = useMemo(() => buildTokens(cfg), [cfg])

  return { cfg, tokens, dispatch }
}
