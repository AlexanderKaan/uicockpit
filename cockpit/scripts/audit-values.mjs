#!/usr/bin/env node
/**
 * audit:values — is this value a token?
 *
 *   node scripts/audit-values.mjs                 the gate (exit 1 on any breach)
 *   node scripts/audit-values.mjs --report        every offender, never exits 1
 *   node scripts/audit-values.mjs --report=px     one axis
 *
 * ONE QUESTION, EIGHT AXES. Five gates asked it under five names — audit:tokens
 * (spacing), audit:type (font-size), audit:cascade (colour · border · shadow ·
 * font-family · motion), audit:craft (any raw px, per file) and
 * audit:structural-inline (a kit property smuggled into a JSX style prop). They
 * read the same files with the same declaration regex and the same var()-fallback
 * stripper, differed only in WHICH property they looked at, and each printed its
 * own verdict. Five entries in the build chain, five places to look when one goes
 * red, and every component change paying its ratchet tax five times.
 *
 * WHAT MERGED AND WHAT DID NOT. The rules are NOT blended — a spacing px on the
 * 4px grid is a different fact from a literal transition duration, and each axis
 * below keeps the exact test the original gate applied. What merged is everything
 * around the rules: one file walk, one parser, one report shape, one exit code,
 * and one place for the ratchets.
 *
 * THE RATCHETS ARE CARRIED VERBATIM. Seven magic-px baselines (the kit and six
 * chrome stylesheets) and one structural-inline baseline, at the numbers the old
 * gates held on the day of the merge. The contract is unchanged and exact in both
 * directions: above the baseline is a regression, below it is a win that must be
 * locked in the same commit, and NEITHER passes silently. Do not raise a baseline
 * to make a build pass.
 *
 * ⚠️ WHAT WAS DROPPED, on purpose and named so it is not rediscovered as a loss:
 *   · audit:type printed a "typography role map" — resolved px per --k-type token
 *     at S/M/L/XL, from a hand-mirrored table that its own comment said to "keep
 *     in sync if TS changes". A mirror of buildTokens is the thing this repo
 *     keeps getting bitten by, and the map was a diagnostic for a sweep that is
 *     done. The GATE (no raw font-size) is here; the map is not.
 *   · audit:tokens carried a --fix auto-rewriter. A gate that rewrites source is
 *     two things, and the sweep it served finished at 0 hard.
 *   · --json and --axis= had no consumers.
 *
 * Every absorbed axis was observed FAILING under a mutation before the old gates
 * were removed — see the commit. A merge that is not mutation-tested per axis
 * deletes coverage silently, which is the only way a merge like this can do harm.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..')
const argv = process.argv.slice(2)
const REPORT = argv.find((a) => a.startsWith('--report'))
const ONLY = REPORT && REPORT.includes('=') ? REPORT.split('=')[1] : null

/* ── the exported surfaces the token axes read ─────────────────────────────── */
const KIT_FILES = ['src/kit/recipes/index.ts', 'src/styles/preview-only.css', 'src/kit/globalLayer.ts']

/* ── shared parsing (was duplicated in tokens + cascade) ───────────────────── */
const DECL_RE = /([a-z-]+)\s*:\s*([^;{}]+)/gi
const SEL_RE = /([^{}]+?)\s*\{/
const PX_RE = /(-?\d+(?:\.\d+)?)px/g
/* A px inside `var(--x, 12px)` is a fallback that only applies when the token is
 * missing — a safety net, not a literal. Strip before judging. */
const stripFallbacks = (v) => v.replace(/var\(\s*--[\w-]+\s*,\s*[^()]*?\)/g, 'var()')

const read = (rel) => { try { return readFileSync(resolve(ROOT, rel), 'utf8') } catch { return null } }
/* Strip comments but KEEP THEIR NEWLINES, so a reported line number is the line
 * in the file. audit:craft replaced /* … *\/ with nothing before splitting, and
 * every multi-line comment above an offender shifted its number — the report said
 * marketing.css:45 and line 45 was a comment. Same trick kit-model uses. */
const stripComments = (raw) => raw
  .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ''))
  .replace(/^[ \t]*\/\/.*$/gm, '')

/** Walk every `prop: value` in the kit files with the owning selector. */
function* declarations() {
  for (const rel of KIT_FILES) {
    const text = read(rel)
    if (text == null) continue
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

const F = { spacing: [], fontSize: [], radius: [], color: [], border: [], shadow: [], fontFamily: [], motion: [] }

for (const d of declarations()) {
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

/* ══ AXIS · magic px — the per-file ratchet. (audit:craft) ═══════════════════
 * Any raw Npx that is not a hairline (≤2px, borders and rings are device-tuned),
 * not the 999px pill idiom, not a breakpoint threshold, not SVG coordinate space
 * and not a token DEFINITION. Separate baselines per file on purpose: the chrome's
 * debt must not hide behind the kit's progress. */
const PX_TARGETS = [
  { src: 'src/kit/recipes/index.ts', baseline: 106, what: 'the kit' },
  { src: 'src/styles/panel.css', baseline: 169, what: 'the panel' },
  { src: 'src/styles/stage.css', baseline: 189, what: 'the stage + topbar' },
  { src: 'src/styles/chrome.css', baseline: 53, what: 'the app shell' },
  { src: 'src/styles/modal.css', baseline: 164, what: 'modals + toasts' },
  { src: 'src/styles/preview-only.css', baseline: 30, what: 'the gallery harness' },
  { src: 'src/styles/marketing.css', baseline: 696, what: 'the marketing site' },
]
const HAIRLINE = new Set(['0.5', '1', '1.5', '2'])
function magicPx(src) {
  const raw = stripComments(read(src) ?? '')
  const out = []
  raw.split('\n').forEach((line, i) => {
    if (/@(container|media)\b/.test(line) || /(mask|viewBox|data:image|url\()/i.test(line)) return
    if (/--k-[a-z0-9-]+\s*:/.test(line)) return
    let s = line
    for (let k = 0; k < 4; k++) s = s.replace(/var\([^()]*\)/g, '')
    for (const m of s.matchAll(/(?<![\w.])([0-9]+(?:\.[0-9]+)?)px/g)) {
      if (HAIRLINE.has(m[1]) || m[1] === '999') continue
      out.push({ line: i + 1, v: m[1], text: line.trim().slice(0, 100) })
    }
  })
  return out
}
const px = PX_TARGETS.map((t) => ({ ...t, offenders: magicPx(t.src) }))

/* ══ AXIS · structural inline — the app surface must COMPOSE recipes, never
 * re-roll a look in a style prop. padding / background / border / radius / shadow
 * in `style={{…}}` is a latent second version of a recipe; layout props (gap,
 * flex, width, --l-*) are the app's own job and are not counted. One ratchet on
 * the fixture. (audit:structural-inline) */
const INLINE = { src: 'src/showcases/sections.tsx', baseline: 26 }
const STRUCTURAL = ['paddingBlock', 'paddingInline', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight', 'padding',
  'backgroundColor', 'background', 'borderRadius', 'borderTop', 'borderBottom', 'borderLeft', 'borderRight', 'border', 'boxShadow']
const inlineOffenders = []
{
  const raw = stripComments(read(INLINE.src) ?? '')
  const KEY_RE = new RegExp(`\\b(${STRUCTURAL.join('|')})\\s*:`, 'g')
  raw.split('\n').forEach((line, i) => {
    for (const m of line.matchAll(KEY_RE)) inlineOffenders.push({ line: i + 1, key: m[1], text: line.trim().slice(0, 110) })
  })
}

/* ── verdict ─────────────────────────────────────────────────────────────── */
const line = (s = '') => console.log(s)
const HARD = ['spacing', 'fontSize', 'fontFamily', 'motion']
const REVIEW = ['color', 'border', 'shadow', 'radius']
const LABEL = { spacing: 'spacing px (must be --k-s-*)', fontSize: 'font-size px (must be --k-type-*)', fontFamily: 'font-family literal (must be --k-font-*)',
  motion: 'transition literal (must be --k-dur / --k-ease)', color: 'colour literal', border: 'border colour literal', shadow: 'elevation shadow literal', radius: 'radius px' }

if (REPORT) {
  const want = (k) => !ONLY || ONLY === k || (ONLY === 'px' && k === 'px') || (ONLY === 'inline' && k === 'inline')
  for (const k of [...HARD, ...REVIEW]) {
    if (!want(k)) continue
    line(`\n=== ${k} — ${F[k].length} · ${LABEL[k]} ===`)
    for (const f of F[k].slice(0, 60)) line(`  ${f.file}:${f.line}  ${f.sel}  ${f.prop}: ${f.val}`)
    if (F[k].length > 60) line(`  … +${F[k].length - 60} more`)
  }
  if (want('px')) for (const r of px) {
    line(`\n=== magic px · ${r.src} — ${r.offenders.length} (baseline ${r.baseline}) ===`)
    const byVal = {}
    for (const o of r.offenders) byVal[o.v] = (byVal[o.v] || 0) + 1
    line('  by value: ' + Object.entries(byVal).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k}px:${n}`).join('  '))
    for (const o of r.offenders.slice(0, 40)) line(`  ${r.src}:${o.line}\t${o.v}px\t${o.text}`)
  }
  if (want('inline')) {
    line(`\n=== structural inline · ${INLINE.src} — ${inlineOffenders.length} (baseline ${INLINE.baseline}) ===`)
    for (const o of inlineOffenders) line(`  ${INLINE.src}:${o.line}\t${o.key}\t${o.text}`)
  }
  process.exit(0)
}

let failed = false
line('=== audit:values — is this value a token? ===')
for (const k of HARD) {
  const n = F[k].length
  if (n) failed = true
  line(`  ${n ? '✗' : '✓'} ${k.padEnd(12)} ${String(n).padStart(4)}   ${LABEL[k]}`)
  for (const f of F[k].slice(0, 12)) line(`        ${f.file}:${f.line}  ${f.sel}  ${f.prop}: ${f.val}`)
}
line(`  · review       ${REVIEW.map((k) => `${k} ${F[k].length}`).join(' · ')}   (reported, never gated)`)
for (const r of px) {
  const n = r.offenders.length
  if (n === r.baseline) { line(`  ✓ magic px     ${String(n).padStart(4)} === baseline   ${r.what}`); continue }
  failed = true
  if (n > r.baseline) line(`  ✗ magic px     ${String(n).padStart(4)} — baseline ${r.baseline}, +${n - r.baseline}   ${r.what}  (${r.src})`)
  else line(`  ↓ magic px     ${String(n).padStart(4)} — you removed ${r.baseline - n}. LOCK IT: set baseline ${n} for ${r.what} in scripts/audit-values.mjs`)
}
{
  const n = inlineOffenders.length
  if (n === INLINE.baseline) line(`  ✓ inline       ${String(n).padStart(4)} === baseline   structural props in ${INLINE.src.split('/').pop()}`)
  else {
    failed = true
    if (n > INLINE.baseline) line(`  ✗ inline       ${String(n).padStart(4)} — baseline ${INLINE.baseline}, +${n - INLINE.baseline}. Compose a kit recipe instead of re-rolling it in a style prop.`)
    else line(`  ↓ inline       ${String(n).padStart(4)} — you removed ${INLINE.baseline - n}. LOCK IT: set INLINE.baseline = ${n} in scripts/audit-values.mjs`)
  }
}

if (failed) {
  line('\naudit:values — FAIL. A raw value desyncs the moment a control re-scales the kit;')
  line('a lowered ratchet is a win that must be locked in this commit. Do NOT raise a')
  line('baseline to make this pass. `npm run audit:values -- --report` lists everything.')
  process.exit(1)
}
line('audit:values — every axis holds.')
process.exit(0)
