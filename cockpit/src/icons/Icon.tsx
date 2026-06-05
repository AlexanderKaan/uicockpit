import { createContext, useContext, useEffect, useState } from 'react'
import type { IconAdapter, IconMap, IconName } from './concepts'
import type { IconSet } from '../tokens/types'

const loaders: Record<IconSet, () => Promise<{ default: IconAdapter }>> = {
  hairline: () => import('./adapters/iconoir'),
  line: () => import('./adapters/lucide'),
  rounded: () => import('./adapters/phosphor-regular'),
  bold: () => import('./adapters/phosphor-bold'),
  solid: () => import('./adapters/heroicons-solid'),
}

const cache = new Map<IconSet, Promise<IconMap>>()

function loadMap(set: IconSet): Promise<IconMap> {
  let p = cache.get(set)
  if (!p) {
    p = loaders[set]().then((m) => m.default.map)
    cache.set(set, p)
  }
  return p
}

const IconMapContext = createContext<IconMap | null>(null)

interface IconProviderProps {
  set: IconSet
  children: React.ReactNode
}

export function IconProvider({ set, children }: IconProviderProps) {
  const [map, setMap] = useState<IconMap | null>(null)

  useEffect(() => {
    let cancelled = false
    loadMap(set).then((m) => {
      if (!cancelled) setMap(m)
    })
    return () => {
      cancelled = true
    }
  }, [set])

  return <IconMapContext.Provider value={map}>{children}</IconMapContext.Provider>
}

interface IconElementProps {
  name: IconName
  size?: number
  className?: string
}

export function Icon({ name, size = 15, className }: IconElementProps) {
  const map = useContext(IconMapContext)
  if (!map) {
    // Library still loading — render an invisible placeholder of the same size
    return (
      <span
        aria-hidden
        style={{
          display: 'inline-block',
          width: size,
          height: size,
          flex: 'none',
        }}
      />
    )
  }
  const Cmp = map[name]
  return <Cmp size={size} className={className} />
}
