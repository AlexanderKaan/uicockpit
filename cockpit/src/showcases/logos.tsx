/**
 * BrandLogo — designed monogram marks for the showcase cast companies.
 *
 * The point (flagship-billing-pilot): a real app shows real LOGOS, not rainbow
 * letter-tiles. These are small, restrained geometric marks on a white tile with
 * a hairline — the Tuple / "Re" / "S" look from the Tailwind reference. One muted
 * tint per brand; the tile uses the kit's radius token so it tracks the theme.
 *
 * Pure content (inline SVG) — no kit classes, so it doesn't touch provenance.
 */

type Mark = { tint: string; glyph: React.ReactNode }

// Muted, confident brand tints (not neon — restraint). Each glyph is a simple
// distinct geometric mark so the cast reads as real, different companies.
const MARKS: Record<string, Mark> = {
  tuple: {
    tint: '#4f46e5',
    glyph: (
      <>
        <rect x="7" y="7" width="7" height="7" rx="1.6" fill="currentColor" opacity="0.55" />
        <rect x="11" y="11" width="7" height="7" rx="1.6" fill="currentColor" />
      </>
    ),
  },
  savvy: {
    tint: '#ea7317',
    glyph: <circle cx="12.5" cy="12.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeDasharray="20 8" strokeLinecap="round" />,
  },
  reform: {
    tint: '#0f172a',
    glyph: <path d="M9 17V8h4a2.6 2.6 0 0 1 0 5.2H9.6M13 13l3.4 4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />,
  },
  loomis: {
    tint: '#0d9488',
    glyph: <path d="M12.5 7.5a5 5 0 1 0 0 10 5 5 0 0 1 0-10z" fill="currentColor" />,
  },
  vantage: {
    tint: '#7c3aed',
    glyph: <path d="M7.5 15.5l5-7 5 7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />,
  },
  cedar: {
    tint: '#16a34a',
    glyph: <path d="M12.5 7l4 5h-2.4l2.4 3.5H8l2.4-3.5H8z" fill="currentColor" />,
  },
}

const FALLBACK: Mark = { tint: '#4f46e5', glyph: <rect x="8" y="8" width="9" height="9" rx="2" fill="currentColor" /> }

export function BrandLogo({ id, size = 40 }: { id: string; size?: number }) {
  const mark: Mark = MARKS[id] ?? FALLBACK
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-grid',
        placeItems: 'center',
        width: size,
        height: size,
        flex: 'none',
        background: 'var(--k-surface)',
        border: 'var(--k-hairline, 1px solid var(--k-border))',
        borderRadius: 'var(--k-radius-md)',
        color: mark.tint,
        boxShadow: 'var(--k-shadow-xs)',
      }}
    >
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 25 25" fill="none">{mark.glyph}</svg>
    </span>
  )
}
