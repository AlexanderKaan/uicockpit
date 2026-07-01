#!/usr/bin/env node
/**
 * audit-role-treatments.mjs — the Role Canvas ENFORCE rail (the treatment gates).
 *
 * audit:contract verifies the contract DATA is consistent + complete. This gate
 * verifies the kit actually DELIVERS each role's ROLE_GUARANTEE — so "the role
 * guarantees its treatment" is true, not aspirational. It closes the worklist
 * audit:contract prints (the declared-not-yet-enforced roles):
 *
 *   selectable  → the generative binding exists: one zero-specificity :where()
 *                 floor in globalLayer.ts binds --k-selected-edge to the ARIA
 *                 selected state + [data-role="selectable"], so UNKNOWN markup
 *                 inherits the role (the first Role-Canvas generative binding)
 *   surface     → the generative binding exists: a zero-specificity
 *                 :where([data-role="surface"]) floor delivers surface bg +
 *                 elevation, so an unknown container reads as "off the ground".
 *                 (The surface-vs-bg CONTRAST is separately guarded by the
 *                 foundation coherence rail — see coherence.ts.)
 *   control     → the generative binding exists: a zero-specificity
 *                 :where([data-role="control"]) floor delivers the height
 *                 invariant (min-height: var(--k-control-h-*)), and
 *                 [data-role="control"] is in the coarse-pointer hit-target
 *                 floor — so an unknown control inherits height + touch target
 *                 (focus is already universal via :focus-visible).
 *   tone-bearer → every tinted *-soft token carries a paired AA-derived *-soft-fg
 *                 (so text on any tint is guaranteed legible — the badge/aaInk law)
 *   text-slot   → the global .truncate utility exists (single-line clamp) AND
 *                 its generative binding: a :where([data-role="text-slot"]) floor
 *                 delivers the same clamp, so unknown text inherits the role
 *   overlay     → the floating list surfaces cap their height + scroll (can't run
 *                 off-screen)
 *   surface     → enforced by the FOUNDATION coherence guard (surface ≠ bg +
 *                 elevation); see coherence.ts + its tests — not re-checked here.
 *
 * Exit 1 on any unmet guarantee. Usage: node scripts/audit-role-treatments.mjs
 */
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..')
const recipes = readFileSync(resolve(ROOT, 'src/kit/recipes/index.ts'), 'utf8')
const globalLayerSrc = readFileSync(resolve(ROOT, 'src/kit/globalLayer.ts'), 'utf8')
const snap = readFileSync(resolve(ROOT, 'src/export/__tests__/__snapshots__/gen.test.ts.snap'), 'utf8')

const fails = []

// --- the GENERATIVE bindings exist (Role Canvas zero-specificity floors) -----
// Each role's treatment must be bound ONCE, globally, in a zero-specificity
// :where() floor — so UNKNOWN markup that tags the role (via ARIA state and/or a
// thin [data-role]) inherits the treatment and no component has to re-roll it.
// (Per-recipe legibility is a separate gate: audit:state-edge / Invariant I2.)
const whereFloors = [...globalLayerSrc.matchAll(/:where\(([\s\S]*?)\)\s*\{([\s\S]*?)\}/g)].map(
  (m) => ({ sel: m[1], body: m[2] }),
)
const floorFor = (needleInSel) => whereFloors.find((f) => f.sel.includes(needleInSel))

// selectable — ARIA-named state (aria-selected/aria-checked) + [data-role] →
// the selected-edge treatment inherited by unknown selectable markup.
const selectable = floorFor('[data-role="selectable"]')
if (
  !selectable ||
  !/aria-selected="true"/.test(selectable.sel) ||
  !/aria-checked="true"/.test(selectable.sel) ||
  !/--k-selected-edge/.test(selectable.body)
) {
  fails.push(
    'selectable · no generative binding in globalLayer.ts — expected a zero-specificity :where(…) floor keyed to [data-role="selectable"] + aria-selected/aria-checked that delivers var(--k-selected-edge), so unknown selectable markup inherits the role',
  )
}

// surface — a perceptual role ARIA can't name, so bound to [data-role="surface"]
// → the separation treatment (surface bg + elevation) inherited by unknown
// containers.
const surface = floorFor('[data-role="surface"]')
if (
  !surface ||
  !/--k-surface\b/.test(surface.body) ||
  !/box-shadow[^;]*--k-shadow/.test(surface.body)
) {
  fails.push(
    'surface · no generative binding in globalLayer.ts — expected a zero-specificity :where([data-role="surface"]) floor delivering var(--k-surface) + a box-shadow elevation, so an unknown container reads as "off the ground"',
  )
}

// control — a perceptual role ARIA can't name, bound to [data-role="control"]
// → the HEIGHT invariant (--k-control-h-*) inherited by unknown controls. (Focus
// is universal via :focus-visible; the hit-target floor picks it up in the
// coarse-pointer block — both checked below.)
const control = floorFor('[data-role="control"]')
if (!control || !/min-height:\s*var\(--k-control-h/.test(control.body)) {
  fails.push(
    'control · no generative binding in globalLayer.ts — expected a zero-specificity :where([data-role="control"]) floor delivering min-height: var(--k-control-h-*), so an unknown control inherits the kit height invariant',
  )
}
if (!/\[data-role="control"\][^{]*\{\s*min-height:\s*var\(--k-touch-target/.test(globalLayerSrc)) {
  fails.push(
    'control · [data-role="control"] is not in the coarse-pointer hit-target floor (min-height: var(--k-touch-target)) — an unknown control wouldn\'t clear the 44px touch minimum',
  )
}

// --- tone-bearer: every emitted *-soft tint has a paired AA-derived *-soft-fg ---
const SOFT_FG_EXEMPT = new Set(['ring']) // focus halo — never holds text
const softs = [...new Set([...snap.matchAll(/--k-([a-z0-9-]+)-soft:/g)].map((m) => m[1]))]
for (const x of softs) {
  if (SOFT_FG_EXEMPT.has(x)) continue
  if (!snap.includes(`--k-${x}-soft-fg:`)) {
    fails.push(`tone-bearer · --k-${x}-soft has no AA-derived --k-${x}-soft-fg — text on the tint isn't guaranteed legible`)
  }
}

// --- text-slot: the .truncate utility AND its generative role binding --------
if (!/\.truncate\s*\{[^}]*overflow:\s*hidden[^}]*text-overflow:\s*ellipsis[^}]*white-space:\s*nowrap/.test(recipes)) {
  fails.push('text-slot · no global .truncate utility (overflow:hidden + text-overflow:ellipsis + white-space:nowrap)')
}
const textSlot = floorFor('[data-role="text-slot"]')
if (
  !textSlot ||
  !/overflow:\s*hidden/.test(textSlot.body) ||
  !/text-overflow:\s*ellipsis/.test(textSlot.body) ||
  !/white-space:\s*nowrap/.test(textSlot.body)
) {
  fails.push(
    'text-slot · no generative binding in globalLayer.ts — expected a zero-specificity :where([data-role="text-slot"]) floor delivering the single-line clamp (overflow:hidden + text-overflow:ellipsis + white-space:nowrap), so unknown text inherits the role',
  )
}

// --- overlay: floating list surfaces cap height + scroll -------------------
const ruleBody = (css, sel) => {
  const at = css.indexOf(`${sel} {`) >= 0 ? css.indexOf(`${sel} {`) : css.indexOf(`${sel}{`)
  return at < 0 ? null : css.slice(at, css.indexOf('}', at))
}
for (const sel of ['.menu', '.cmdp__list']) {
  const b = ruleBody(recipes, sel)
  if (!b || !/max-(?:height|block-size)/.test(b) || !/overflow/.test(b)) {
    fails.push(`overlay · ${sel} lacks max-height + overflow — a long list would run off-screen`)
  }
}

if (fails.length) {
  console.error('=== audit:role-treatments — role guarantees (Role Canvas ENFORCE) ===')
  for (const f of fails) console.error(`  ✗ ${f}`)
  console.error(`\n${fails.length} role guarantee(s) not delivered. Every role in contracts.ts must carry its ROLE_GUARANTEE treatment.`)
  process.exit(1)
}
console.log('audit:role-treatments — clean · selectable + surface + control + text-slot (generative bindings) · tone-bearer (AA-ink paired) · overlay (scroll-capped) all enforced')
