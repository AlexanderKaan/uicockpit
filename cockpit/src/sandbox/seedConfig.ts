/* Sandbox · seed + summary — turn an Extraction into something the cockpit and
 * the "we read your app" UI can both consume.
 *
 *  seedConfig  — fold the extracted partial over a base Config → a full Config
 *                ready for dispatch({type:'REPLACE'}) (the same mechanism as
 *                Shuffle). Unread facets simply keep the base value.
 *  readSummary — a labelled, ordered row per facet (value + confidence + swatch)
 *                for the result panel. Reads the RESOLVED config so the chip shows
 *                what the cockpit will actually do, not the raw token. */

import type { Config } from '../tokens/types'
import type { Extraction, Facet, Confidence } from './extractFoundation'

/** Fold the extracted partial over a base config. The partial already uses real
 *  Config field names, so this is a shallow merge — but we keep it explicit (and
 *  testable) because the colour facet writes three coupled fields (color +
 *  colorTheme + cPrimary) that must travel together. */
export function seedConfig(extraction: Extraction, base: Config): Config {
  return { ...base, ...extraction.config }
}

export interface ReadRow {
  facet: Facet
  /** Short human label for the facet ("Brand", "Corners"…). */
  label: string
  /** The resolved value, formatted for display ("Cobalt", "Soft", "Inter"…). */
  value: string
  confidence: Confidence
  /** A colour to show as a chip swatch (brand row only). */
  swatch?: string
}

const TITLE = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const RADIUS_LABEL: Record<string, string> = { none: 'Sharp', subtle: 'Subtle', soft: 'Soft', round: 'Round' }
const TYPE_LABEL: Record<string, string> = { sm: 'Small', md: 'Medium', lg: 'Large', xl: 'X-Large' }
const DEPTH_LABEL: Record<string, string> = { flat: 'Flat', soft: 'Soft', deep: 'Deep' }
const DENSITY_LABEL: Record<string, string> = { compact: 'Compact', default: 'Default', comfortable: 'Comfortable' }

/* Display order = most-reliable / most-recognisable first ("that's mine" → detail). */
const ORDER: Facet[] = ['brand', 'font', 'radius', 'typeSize', 'density', 'neutral', 'elevation']

/** Turn an Extraction into the ordered set of rows the result panel renders.
 *  Only facets the extractor actually READ (confidence ≠ 'none') get a row —
 *  a gap reads more honestly than a confident default we never measured. */
export function readSummary(extraction: Extraction): ReadRow[] {
  const { config: c, confidence } = extraction
  const rows: ReadRow[] = []

  for (const facet of ORDER) {
    if (confidence[facet] === 'none') continue
    let label = ''
    let value = ''
    let swatch: string | undefined

    switch (facet) {
      case 'brand':
        label = 'Brand'
        if (c.color === 'mono' || c.colorTheme === 'mono') {
          value = 'Mono (greyscale)'
        } else {
          value = c.colorTheme ? TITLE(c.colorTheme) : 'Tone'
          swatch = c.cPrimary
        }
        break
      case 'font':
        label = 'Typeface'
        value = c.fontDisplay ?? ''
        break
      case 'radius':
        label = 'Corners'
        value = c.radius ? (RADIUS_LABEL[c.radius] ?? TITLE(c.radius)) : ''
        break
      case 'typeSize':
        label = 'Text size'
        value = c.typeScale ? (TYPE_LABEL[c.typeScale] ?? c.typeScale) : ''
        break
      case 'density':
        label = 'Density'
        value = c.scale ? (DENSITY_LABEL[c.scale] ?? TITLE(c.scale)) : ''
        break
      case 'neutral':
        label = 'Neutrals'
        value = c.neutral ? TITLE(c.neutral) : ''
        break
      case 'elevation':
        label = 'Elevation'
        value = c.surfaceDepth ? (DEPTH_LABEL[c.surfaceDepth] ?? TITLE(c.surfaceDepth)) : ''
        break
    }
    if (value) rows.push({ facet, label, value, confidence: confidence[facet], swatch })
  }
  return rows
}
