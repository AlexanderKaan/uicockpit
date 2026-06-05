#!/usr/bin/env node
/**
 * audit-cascade.mjs — control-cascade hardcode detector (all non-spacing/type axes).
 *
 * WHY: a setting only fails to propagate to components/app when a component HARDCODES
 * a literal that bypasses its `--k-*` token. buildTokens emits a token for every control,
 * so the cascade is guaranteed except for such bypasses. This finds them across the axes
 * that audit-tokens (spacing) and audit-type (font-size) don't cover:
 *   - color   → hex/rgb/hsl/oklch literals that should be --k-* (else ignore brand/
 *               palette/neutral/mode). Allow: neutral black/white/grey overlays,
 *               .grade--* semantic scale, transparent/currentColor.
 *   - shadow  → box-shadow not via --k-shadow-* / --k-ring (else ignore Surface depth).
 *   - border  → border with a literal color not via --k-* (else ignore Borders).
 *   - font    → font-family literal stack not via --k-font-* (else ignore font controls).
 *   - motion  → transition/animation literal ms/easing not via the --k-dur / --k-ease tokens.
 *
 * Scans preview.css + componentRecipes.ts. Reports grouped by axis with selector context.
 * Exit 1 on HARD axes (font, motion — those have no legit literal use here); color/
 * shadow/border are reported for review (many legit content/overlay cases).
 *
 * Usage: node scripts/audit-cascade.mjs [--all-hard] [--axis=color|shadow|border|font|motion]
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..')
const FILES = ['src/kit/recipes/index.ts', 'src/styles/preview-only.css', 'src/kit/globalLayer.ts']

const args = new Set(process.argv.slice(2))
const ALL_HARD = args.has('--all-hard')
const ONLY = [...args].find((a) => a.startsWith('--axis='))?.split('=')[1]

const COLOR_PROPS = new Set([
  'color', 'background', 'background-color', 'border-color', 'border-top-color',
  'border-right-color', 'border-bottom-color', 'border-left-color', 'outline-color',
  'fill', 'stroke', 'caret-color', 'text-decoration-color', 'column-rule-color',
  'accent-color', 'stop-color', 'flood-color',
])
const BORDER_PROPS = new Set([
  'border', 'border-top', 'border-right', 'border-bottom', 'border-left',
  'border-inline', 'border-block',
])
// literal color: hex, rgb(a), hsl(a), oklch/oklab, named-ish — but we only catch funcs+hex
const COLOR_LITERAL = /#[0-9a-f]{3,8}\b|\b(rgba?|hsla?|oklch|oklab|color)\s*\([^)]*\)/gi
// neutral black/white/grey overlay: rgb/hsl that is 0,0,0 / 255,255,255 / 0 0% N%
const isNeutralOverlay = (lit) => {
  const s = lit.toLowerCase().replace(/\s+/g, '')
  return /^rgba?\(0,0,0[,)/]/.test(s) || /^rgba?\(255,255,255[,)/]/.test(s) ||
    /^hsla?\(0,?0%,?\d/.test(s) || /^hsla?\(00%\d/.test(s) || /hsl\(00%/.test(s)
}

const DECL_RE = /([a-z-]+)\s*:\s*([^;{}]+)/gi
const SEL_RE = /([^{}]+?)\s*\{/
const findings = { color: [], shadow: [], border: [], font: [], motion: [] }

for (const rel of FILES) {
  let text
  try { text = readFileSync(resolve(ROOT, rel), 'utf8') } catch { continue }
  const lines = text.split('\n')
  let sel = '?'
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const sm = line.match(SEL_RE)
    if (sm && /^[.#:\[a-zA-Z]/.test(sm[1].trim())) sel = sm[1].split(',')[0].trim().slice(0, 50)
    const inGrade = /grade--/.test(sel)
    for (const m of line.matchAll(DECL_RE)) {
      const prop = m[1].toLowerCase()
      const val = m[2].trim()
      const push = (axis, note) => findings[axis].push({ file: rel.split('/').pop(), line: i + 1, sel, prop, val: val.slice(0, 56), note })

      // strip `var(--x, fallback)` so a fallback literal isn't counted as primary.
      const valNoFb = val.replace(/var\(\s*--[\w-]+\s*,\s*[^()]*\)/g, 'var()')
      // media-chrome / content selectors whose colours are intentionally fixed
      // (always-dark video player + phone frame, overlay buttons on media, grade
      // chip text, glass scrims) — not theme-driven UI.
      const isContentColor = /\b(video|mp-frame|lightbox|herod__play|dailymix|ecom-thumb|grade|glass|poster)/.test(sel)

      // COLOR
      if (COLOR_PROPS.has(prop) || BORDER_PROPS.has(prop)) {
        for (const lm of valNoFb.matchAll(COLOR_LITERAL)) {
          const lit = lm[0]
          if (/^color\(/i.test(lit)) continue          // color-mix() etc, wraps a var
          if (inGrade || isContentColor) continue       // semantic / media content
          if (isNeutralOverlay(lit)) continue           // black/white/grey overlay/scrim
          findings[BORDER_PROPS.has(prop) ? 'border' : 'color'].push(
            { file: rel.split('/').pop(), line: i + 1, sel, prop, val: val.slice(0, 56), lit })
        }
      }

      // SHADOW — only a propagation bug if it's an ELEVATION shadow with a LITERAL
      // colour and no token. Focus rings / structural insets / var-coloured / neutral
      // drawer-overlay shadows correctly do NOT follow Surface depth.
      if (prop === 'box-shadow' || prop === '-webkit-box-shadow') {
        const ok = val === 'none' || /var\(--k-/.test(val) || /\binset\b/.test(val) ||
          /hsla?\(0\s*0%|rgba?\(0,\s*0,\s*0|rgba?\(255/.test(val) || isContentColor
        if (!ok && /#[0-9a-f]{3,8}|rgba?\(|hsla?\(/i.test(val)) push('shadow', 'literal elevation shadow (bypasses Surface depth)')
      }
      // FONT
      if (prop === 'font-family') {
        if (!/var\(--k-font/.test(valNoFb) && !/inherit|initial/.test(valNoFb)) push('font', 'literal font stack (bypasses font controls)')
      }
      // MOTION — TRANSITIONS must use the tokens (they follow the Motion control).
      // Keyframe `animation:` (loaders/entrances) have intrinsic timing + the
      // reduced-motion `0.01ms` guard is intentional — both excluded.
      if (prop === 'transition' || prop === 'transition-duration') {
        if (/0\.01ms/.test(val)) { /* reduced-motion guard */ }
        else {
          // check against valNoFb so easing/duration INSIDE a var(…, fallback) isn't counted.
          const hasLiteralDur = /(^|\s|,)\d*\.?\d+m?s\b/.test(valNoFb) && !/var\(--k-dur/.test(valNoFb)
          const hasLiteralEase = /cubic-bezier\(|\b(ease-in-out|ease-in|ease-out|ease|linear)\b/.test(valNoFb) && !/var\(--k-ease/.test(valNoFb)
          if ((hasLiteralDur || hasLiteralEase) && val !== 'none') push('motion', 'literal transition timing (bypasses Motion control)')
        }
      }
    }
  }
}

const HARD_AXES = new Set(['font', 'motion'])
const order = ['color', 'border', 'shadow', 'motion', 'font']
let hardCount = 0
console.log('=== control-cascade hardcode audit ===')
console.log(`scanned: ${FILES.join(', ')}\n`)
for (const axis of order) {
  if (ONLY && ONLY !== axis) continue
  const list = findings[axis]
  const hard = HARD_AXES.has(axis) || ALL_HARD
  if (hard) hardCount += list.length
  const tag = list.length === 0 ? 'clean' : (hard ? `HARD ${list.length}` : `review ${list.length}`)
  console.log(`--- ${axis.toUpperCase()} (${tag}) ---`)
  for (const f of list.slice(0, 50)) console.log(`  ${f.file}:${f.line}  ${f.sel}  ${f.prop}: ${f.val}`)
  if (list.length > 50) console.log(`  … +${list.length - 50} more`)
  console.log('')
}
console.log(`${hardCount ? 'FAIL' : 'OK'}: ${hardCount} hard (font+motion) · color/border/shadow = review`)
process.exit(hardCount ? 1 : 0)
