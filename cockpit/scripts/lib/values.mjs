/**
 * values.mjs — the value judgement of audit:values, as a function.
 *
 * Extracted from scripts/audit-values.mjs (Sprint L, 2026-08-16) so that the
 * SAME rules that gate the kit can be run over CSS the forge generates: "the
 * scaffold passes the value gate" is then a test that imports this, not a
 * regex that resembles it. The script keeps the file walk, the ratchets and
 * the report; this file owns the eight axes and nothing else.
 *
 *   judgeText(cssText, fileLabel) → { spacing, fontSize, radius, color, border, shadow, fontFamily, motion }
 */

/* ── shared parsing (was duplicated in tokens + cascade) ───────────────────── */
const DECL_RE = /([a-z-]+)\s*:\s*([^;{}]+)/gi
const SEL_RE = /([^{}]+?)\s*\{/
const PX_RE = /(-?\d+(?:\.\d+)?)px/g
/* A px inside `var(--x, 12px)` is a fallback that only applies when the token is
 * missing — a safety net, not a literal. Strip before judging. */
const stripFallbacks = (v) => v.replace(/var\(\s*--[\w-]+\s*,\s*[^()]*?\)/g, 'var()')

/* Strip comments but KEEP THEIR NEWLINES, so a reported line number is the line
 * in the file. audit:craft replaced /* … *\/ with nothing before splitting, and
 * every multi-line comment above an offender shifted its number — the report said
 * marketing.css:45 and line 45 was a comment. Same trick kit-model uses. */
export const stripComments = (raw) => raw
  .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ''))
  .replace(/^[ \t]*\/\/.*$/gm, '')

/** Walk every `prop: value` in ONE text with the owning selector. */
export function* declarationsIn(text, rel = '(text)') {
  const lines = text.split('\n')
  let sel = '?'
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const sm = line.match(SEL_RE)
    if (sm && !/^\s*(\/\/|\*|\/\*)/.test(line)) {
      const cand = sm[1].split(',')[0].trim()
      if (/^[.#:\[a-zA-Z]/.test(cand) && cand.length < 80) sel = cand.slice(0, 50)
    }
    for (const m of line.matchAll(DECL_RE)) {
      yield { file: rel, line: i + 1, sel, prop: m[1].toLowerCase(), raw: m[2].trim(), val: stripFallbacks(m[2].trim()) }
    }
  }
}

/* ══ AXIS · spacing ══════════════════════════════════════════════════════════
 * padding / margin / gap must be a --k-s-* token — no raw px at all, on-grid or
 * off. Sub-2px is a hairline nudge and legitimately below the scale. (audit:tokens) */
const SPACING_PROPS = new Set([
  'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'padding-inline', 'padding-block', 'padding-inline-start', 'padding-inline-end',
  'padding-block-start', 'padding-block-end',
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'margin-inline', 'margin-block',
  'gap', 'row-gap', 'column-gap', 'grid-gap', 'grid-row-gap', 'grid-column-gap',
])
/* ══ AXIS · radius (info only) — device frames, micro-radii on decorative dots,
 * concentric calc() offsets are reviewed and intentional. Reported, never gated.
 * (audit:tokens) */
const RADIUS_PROPS = new Set([
  'border-radius', 'border-top-left-radius', 'border-top-right-radius',
  'border-bottom-left-radius', 'border-bottom-right-radius',
  'border-start-start-radius', 'border-start-end-radius',
  'border-end-start-radius', 'border-end-end-radius',
])
/* ══ AXIS · colour / border / shadow (review only) — many legitimate content
 * colours; reported so a reviewer sees them, never gated. (audit:cascade) */
const COLOR_PROPS = new Set([
  'color', 'background', 'background-color', 'border-color', 'border-top-color',
  'border-right-color', 'border-bottom-color', 'border-left-color', 'outline-color',
  'fill', 'stroke', 'caret-color', 'text-decoration-color', 'column-rule-color',
  'accent-color', 'stop-color', 'flood-color',
])
const BORDER_PROPS = new Set(['border', 'border-top', 'border-right', 'border-bottom', 'border-left', 'border-inline', 'border-block'])
const COLOR_LITERAL = /#[0-9a-f]{3,8}\b|\b(rgba?|hsla?|oklch|oklab|color)\s*\([^)]*\)/gi
const isNeutralOverlay = (lit) => {
  const s = lit.toLowerCase().replace(/\s+/g, '')
  return /^rgba?\(0,0,0[,)/]/.test(s) || /^rgba?\(255,255,255[,)/]/.test(s) ||
    /^hsla?\(0,?0%,?\d/.test(s) || /^hsla?\(00%\d/.test(s) || /hsl\(00%/.test(s)
}
const isContentColor = (sel) => /\b(video|mp-frame|lightbox|herod__play|dailymix|ecom-thumb|grade|glass|poster)/.test(sel)

export const AXES = ['spacing', 'fontSize', 'radius', 'color', 'border', 'shadow', 'fontFamily', 'motion']
export const emptyFindings = () => Object.fromEntries(AXES.map((a) => [a, []]))

/** The eight axes over one text. `F` may be passed to accumulate across files. */
export function judgeText(text, rel = '(text)', F = emptyFindings()) {
for (const d of declarationsIn(text, rel)) {
  const { prop, val, raw, sel } = d
  const push = (axis, extra = {}) => F[axis].push({ file: d.file.split('/').pop(), line: d.line, sel, prop, val: raw.slice(0, 60), ...extra })

  if (SPACING_PROPS.has(prop)) {
    for (const pm of val.matchAll(PX_RE)) {
      const px = parseFloat(pm[1])
      if (px === 0 || Math.abs(px) < 2) continue
      push('spacing', { px })
    }
  } else if (RADIUS_PROPS.has(prop)) {
    for (const pm of val.matchAll(PX_RE)) {
      const px = parseFloat(pm[1])
      if (px === 0 || Math.abs(px) >= 999 || /var\(--k-radius/.test(raw)) continue
      push('radius', { px })
    }
  }

  /* ══ AXIS · font-size — must be a --k-type-* token. (audit:type, and the same
   * check audit:tokens ran as info; one axis now, hard.) */
  if (prop === 'font-size') {
    if (!/var\(\s*--k-type-/i.test(raw) && /(-?\d+(?:\.\d+)?)px/.test(raw) && !/^0(px)?$/.test(raw)) push('fontSize')
  }

  if (COLOR_PROPS.has(prop) || BORDER_PROPS.has(prop)) {
    for (const lm of val.matchAll(COLOR_LITERAL)) {
      const lit = lm[0]
      if (/^color\(/i.test(lit)) continue
      if (/grade--/.test(sel) || isContentColor(sel)) continue
      if (isNeutralOverlay(lit)) continue
      push(BORDER_PROPS.has(prop) ? 'border' : 'color', { lit })
    }
  }
  if (prop === 'box-shadow' || prop === '-webkit-box-shadow') {
    const ok = raw === 'none' || /var\(--k-/.test(raw) || /\binset\b/.test(raw) ||
      /hsla?\(0\s*0%|rgba?\(0,\s*0,\s*0|rgba?\(255/.test(raw) || isContentColor(sel)
    if (!ok && /#[0-9a-f]{3,8}|rgba?\(|hsla?\(/i.test(raw)) push('shadow')
  }
  /* ══ AXIS · font-family — must be a --k-font-* token; a literal stack bypasses
   * the font controls. (audit:cascade, hard) */
  if (prop === 'font-family') {
    if (!/var\(--k-font/.test(val) && !/inherit|initial/.test(val)) push('fontFamily')
  }
  /* ══ AXIS · motion — a transition must read --k-dur / --k-ease; a literal
   * duration or easing bypasses the Motion control. Keyframe `animation:` has
   * intrinsic timing and the 0.01ms reduced-motion guard is intentional — both
   * excluded, exactly as before. (audit:cascade, hard) */
  if (prop === 'transition' || prop === 'transition-duration') {
    if (!/0\.01ms/.test(raw) && raw !== 'none') {
      const dur = /(^|\s|,)\d*\.?\d+m?s\b/.test(val) && !/var\(--k-dur/.test(val)
      const ease = /cubic-bezier\(|\b(ease-in-out|ease-in|ease-out|ease|linear)\b/.test(val) && !/var\(--k-ease/.test(val)
      if (dur || ease) push('motion')
    }
  }
}
return F
}
