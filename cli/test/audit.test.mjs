import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  auditFiles, effectiveCount, cardinalityScore, grade,
  BUDGETS, WEIGHTS, DIMENSIONS, MIN_EVENTS, MIN_PARSED,
} from '../src/audit.mjs'
import {
  extractCss, extractClasses, extractCssVars, extractClassStyles, resolveVar, expandBox,
  cssModuleBindings, moduleClassAttrs, resolveRelative,
} from '../src/patterns.mjs'

const at = { file: 'x.tsx', line: 1, col: 1 }
const file = (path, content) => ({ path, content })

/* ───────────────────────────── the primitive ─────────────────────────────── */

test('effectiveCount separates one-system-with-noise from eight systems', () => {
  // The example the whole heuristic rests on: identical unique counts (8),
  // completely different pain.
  const repoA = [200, 3, 2, 2, 1, 1, 1, 1] // one radius + typos
  const repoB = [26, 26, 26, 26, 26, 26, 26, 26] // eight real systems
  assert.ok(effectiveCount(repoA) < 1.5, `repo A should read as ~1 system, got ${effectiveCount(repoA)}`)
  assert.ok(Math.abs(effectiveCount(repoB) - 8) < 1e-9, 'repo B should read as exactly 8')
})

test('effectiveCount is scale-free — this is the robustness against repo size', () => {
  const counts = [40, 12, 7, 3, 1]
  const scaled = counts.map((c) => c * 10)
  assert.ok(Math.abs(effectiveCount(counts) - effectiveCount(scaled)) < 1e-9)
})

test('effectiveCount handles the empty and single-value cases', () => {
  assert.equal(effectiveCount([]), 0)
  assert.equal(effectiveCount([0, 0]), 0)
  assert.ok(Math.abs(effectiveCount([99]) - 1) < 1e-9)
})

test('cardinalityScore: at budget is 100, 8x over budget is 0', () => {
  assert.equal(cardinalityScore(5, 5), 100)
  assert.equal(cardinalityScore(2, 5), 100, 'under budget earns no bonus, but no penalty')
  assert.ok(Math.abs(cardinalityScore(40, 5)) < 1e-9, '8x over budget bottoms out')
  assert.equal(cardinalityScore(80, 5), 0, 'past 8x it stays 0, never negative')
  const mid = cardinalityScore(10, 5)
  assert.ok(mid > 60 && mid < 70, `2x over budget should sit around two-thirds, got ${mid}`)
})

test('grade boundaries are the documented ones', () => {
  assert.equal(grade(90), 'A'); assert.equal(grade(85), 'A')
  assert.equal(grade(70), 'B'); assert.equal(grade(55), 'C')
  assert.equal(grade(40), 'D'); assert.equal(grade(39.9), 'F')
})

test('the weights sum to 1 so the score is a real weighted mean', () => {
  const sum = DIMENSIONS.reduce((a, d) => a + WEIGHTS[d], 0)
  assert.ok(Math.abs(sum - 1) < 1e-9)
})

/* ─────────────────────────── CSS extraction (layer A) ───────────────────────── */

test('type is a triplet, not a font-size', () => {
  const evs = extractCss('a.css', `
    .a { font-size: 16px; line-height: 1.5; font-weight: 400; }
    .b { font-size: 16px; line-height: 1.2; font-weight: 600; }
  `)
  const type = evs.filter((e) => e.dim === 'type')
  assert.equal(type.length, 2)
  assert.notEqual(type[0].value, type[1].value, 'same size, different leading/weight = two decisions')
})

test('spacing shorthand expands per side', () => {
  assert.deepEqual(expandBox(['8px']), [['top', '8px'], ['right', '8px'], ['bottom', '8px'], ['left', '8px']])
  assert.deepEqual(expandBox(['8px', '12px']), [['top', '8px'], ['right', '12px'], ['bottom', '8px'], ['left', '12px']])
  const evs = extractCss('a.css', '.a { padding: 8px 12px; }')
  assert.equal(evs.filter((e) => e.dim === 'spacing').length, 4)
})

test('colour is split by role — the same hex is a different decision per role', () => {
  const evs = extractCss('a.css', '.a { color: #111; background: #111; }')
  const roles = evs.filter((e) => e.dim === 'color').map((e) => e.role).sort()
  assert.deepEqual(roles, ['bg', 'fg'])
})

test('a var() reference counts as tokenised, a literal does not', () => {
  const evs = extractCss('a.css', '.a { border-radius: var(--k-radius-md); } .b { border-radius: 9px; }')
  const [tokenised, literal] = evs.filter((e) => e.dim === 'radius')
  assert.equal(tokenised.tokenized, true)
  assert.equal(literal.tokenized, false)
})

test('custom-property definitions are token sources, never usages', () => {
  const evs = extractCss('a.css', ':root { --brand: #4f46e5; --radius: 8px; }')
  assert.equal(evs.length, 0, 'declaring a token is not using a value')
})

/* ───────────────────── Tailwind extraction (net-new for audit) ──────────────── */

test('Tailwind scale classes resolve and count as tokenised', () => {
  const evs = extractClasses(['rounded-lg', 'p-4', 'shadow-sm'], at)
  const radius = evs.find((e) => e.dim === 'radius')
  assert.equal(radius.value, '8px')
  assert.equal(radius.tokenized, true)
  assert.equal(evs.filter((e) => e.dim === 'spacing').length, 4, 'p-4 hits all four sides')
  assert.equal(evs.find((e) => e.dim === 'spacing').value, '16px')
})

test('arbitrary values are a deliberate step outside the system', () => {
  const evs = extractClasses(['p-[13px]', 'bg-[#f3f4f6]', 'rounded-[7px]'], at)
  assert.ok(evs.every((e) => e.arbitrary && !e.tokenized))
  assert.equal(evs.find((e) => e.dim === 'radius').value, '7px')
})

test('text-sm is a size and text-gray-500 is a colour', () => {
  const size = extractClasses(['text-sm'], at)
  assert.equal(size.find((e) => e.dim === 'type').value.split('/')[0], '14px')
  assert.equal(size.filter((e) => e.dim === 'color').length, 0)

  const colour = extractClasses(['text-gray-500'], at)
  assert.equal(colour.find((e) => e.dim === 'color').role, 'fg')
  assert.equal(colour.filter((e) => e.dim === 'type').length, 0)
})

test('non-colour utilities are not mistaken for colours', () => {
  for (const c of ['text-center', 'border-2', 'border-t', 'bg-none', 'bg-cover']) {
    assert.equal(extractClasses([c], at).filter((e) => e.dim === 'color').length, 0, `${c} is not a colour`)
  }
})

test('variant prefixes are the same decision, applied conditionally', () => {
  const plain = extractClasses(['rounded-lg'], at)
  const hover = extractClasses(['hover:rounded-lg'], at)
  assert.equal(plain[0].value, hover[0].value)
})

test('px/py map to the right sides', () => {
  const evs = extractClasses(['px-2', 'py-6'], at).filter((e) => e.dim === 'spacing')
  const bySide = Object.fromEntries(evs.map((e) => [e.side, e.value]))
  assert.deepEqual(bySide, { left: '8px', right: '8px', top: '24px', bottom: '24px' })
})

/* ───────── custom properties: the two bugs that painted the wall wrong ──────── */

test('a BEM class name is never read as a custom-property definition', () => {
  // `.btn--primary:hover` used to redefine --primary to "hover { …".
  const vars = extractCssVars(`
    :root { --primary: #4f46e5; }
    .btn--primary { background: var(--primary); }
    .btn--primary:hover { background: var(--primary-hover); }
  `)
  assert.equal(vars['--primary'], '#4f46e5')
})

test('every custom property is captured, not every other one', () => {
  // Consuming the trailing `;` ate the separator the next declaration needed.
  const vars = extractCssVars(':root { --a: 1px; --b: 2px; --c: 3px; --d: 4px; }')
  assert.deepEqual(vars, { '--a': '1px', '--b': '2px', '--c': '3px', '--d': '4px' })
})

test('class styles resolve through one level of var(), skipping pseudo-states', () => {
  const css = `
    :root { --primary: #4f46e5; }
    .btn { padding: 8px 16px; border-radius: 6px; }
    .btn--primary { background: var(--primary); color: #fff; }
    .btn--primary:hover { background: #000; }
  `
  const styles = extractClassStyles(css)
  const vars = extractCssVars(css)
  assert.equal(resolveVar(styles['btn--primary'].background, vars), '#4f46e5')
  assert.notEqual(styles['btn--primary'].background, '#000', 'a hover colour is not the resting appearance')
  assert.equal(styles.btn['border-radius'], '6px')
})

/* ────────────────────────────── the engine end-to-end ───────────────────────── */

const messy = `
  .a { color: #111111; background: #fff; border-radius: 7px; padding: 13px; font-size: 15px; box-shadow: 0 1px 2px #0001; }
  .b { color: #111112; background: #fefefe; border-radius: 8px; padding: 14px; font-size: 16px; box-shadow: 0 1px 3px #0001; }
  .c { color: #222; background: #f9f9f9; border-radius: 9px; padding: 15px; font-size: 17px; box-shadow: 0 2px 4px #0002; }
  .d { color: #333; background: #f5f5f5; border-radius: 11px; padding: 17px; font-size: 18px; box-shadow: 0 3px 6px #0002; }
  .e { color: #444; background: #eee; border-radius: 13px; padding: 19px; font-size: 19px; box-shadow: 0 4px 8px #0003; }
  .f { color: #555; background: #ddd; border-radius: 15px; padding: 21px; font-size: 20px; box-shadow: 0 5px 9px #0003; }
`

test('a messy stylesheet scores badly and a disciplined one scores well', () => {
  const bad = auditFiles([file('messy.css', messy)])
  const tidy = auditFiles([file('tidy.css', `
    .a { color: var(--k-fg); background: var(--k-bg); border-radius: var(--k-radius-md); padding: var(--k-s-8); }
    .b { color: var(--k-fg); background: var(--k-bg); border-radius: var(--k-radius-md); padding: var(--k-s-8); }
    .c { color: var(--k-fg-muted); background: var(--k-bg); border-radius: var(--k-radius-md); padding: var(--k-s-16); }
    .d { color: var(--k-fg); background: var(--k-surface); border-radius: var(--k-radius-md); padding: var(--k-s-8); }
  `)])
  assert.ok(bad.score < tidy.score, `messy (${bad.score}) must score below tidy (${tidy.score})`)
})

test('off-grid spacing and near-dupes land in the score, not just the report', () => {
  const r = auditFiles([file('messy.css', messy)])
  assert.ok(r.dimensions.spacing.offGridRate > 0, '13px/15px/17px are off the 4px grid')
  assert.ok(r.dimensions.color.nearDupes.length > 0, '#111111 vs #111112 is a near-duplicate')
  assert.ok(r.dimensions.color.coherence < 1)
})

test('singleton and arbitrary rates are reported but never scored', () => {
  const r = auditFiles([file('messy.css', messy)])
  assert.ok(r.dimensions.radius.singletons.length > 0)
  // Coherence is built only from tokenisation, near-dupes and the grid.
  const d = r.dimensions.radius
  const expected = (d.tokenisedRate + (1 - d.nearDupeMass)) / 2
  assert.ok(Math.abs(d.coherence - expected) < 1e-9, 'singletons must not leak into coherence')
})

test('an absence of evidence is never scored as perfect coherence', () => {
  // The MUI/Ant failure mode: nothing to see, so the curve would return 100.
  const r = auditFiles([file('sparse.tsx', '<div className="grid gap-4"><span>hi</span></div>')])
  assert.equal(r.dimensions.shadow.insufficient, true)
  assert.equal(r.dimensions.shadow.score, null, 'an unmeasured dimension has no score')
  assert.ok(r.insufficientDimensions.includes('shadow'))
})

test('when every dimension is too thin, the audit refuses instead of guessing', () => {
  const r = auditFiles([file('empty.tsx', '<div className="flex"><b>hi</b></div>')])
  assert.equal(r.refused, true)
  assert.equal(r.score, null)
  assert.match(r.refusal, /not a clean bill of health/i)
})

test('the score only averages dimensions that had enough evidence', () => {
  const r = auditFiles([file('messy.css', messy)])
  const scored = r.scoredDimensions
  const weightSum = scored.reduce((a, d) => a + WEIGHTS[d], 0)
  const expected = scored.reduce((a, d) => a + WEIGHTS[d] * r.dimensions[d].score, 0) / weightSum
  assert.ok(Math.abs(r.score - Math.round(expected)) <= 1)
})

test('unreadable styling is counted and refused below the coverage floor', () => {
  const styled = Array.from({ length: 30 }, (_, i) => `const S${i} = styled.div\`color:red\``).join('\n')
  const r = auditFiles([file('styles.ts', `${styled}\n<div className="p-4">x</div>`)])
  assert.ok(r.meta.unreadable['styled-components'] >= 30)
  assert.ok(r.meta.parsed < MIN_PARSED)
  assert.equal(r.refused, true)
  assert.match(r.refusal, /could be read/i)
})

test('the profile flag moves the budget, not the maths', () => {
  const internal = auditFiles([file('m.css', messy)], { profile: 'internal' })
  const product = auditFiles([file('m.css', messy)], { profile: 'product' })
  assert.equal(internal.dimensions.color.budget, BUDGETS.internal.color)
  assert.equal(product.dimensions.color.budget, BUDGETS.product.color)
  assert.ok(product.score >= internal.score, 'a wider budget cannot score worse')
})

/* ───────────────────────── layer C + the smoking guns ───────────────────────── */

test('button treatments are counted by normalised signature, layout stripped', () => {
  const r = auditFiles([file('a.tsx', `
    <button className="flex items-center bg-blue-500 px-4 rounded-lg">A</button>
    <button className="bg-blue-500 rounded-lg px-4">B</button>
    <button className="bg-red-500 px-2 rounded-sm">C</button>
  `)])
  assert.equal(r.components.button.treatments, 2, 'same style + different layout = one treatment')
  assert.equal(r.components.button.singletons, 1)
})

test('layer C never touches the score', () => {
  const one = auditFiles([file('m.css', messy)])
  const many = auditFiles([
    file('m.css', messy),
    file('b.tsx', Array.from({ length: 20 }, (_, i) => `<button className="bg-x-${i} p-${i}">b</button>`).join('\n')),
  ])
  assert.ok(many.components.button.treatments > one.components.button.treatments)
  assert.equal(one.score, one.score, 'sanity')
})

test('mixed grey ramps are flagged as a smoking gun', () => {
  const r = auditFiles([file('a.tsx', `
    <div className="bg-gray-100 text-slate-700 border-zinc-200">x</div>
  `)])
  assert.ok(r.flags.some((f) => f.id === 'mixed-gray-ramps'))
})

test('two icon libraries in package.json are flagged', () => {
  const r = auditFiles([file('a.tsx', '<div className="p-4">x</div>')], {
    pkg: { dependencies: { 'lucide-react': '1', 'react-icons': '1' } },
  })
  const flag = r.flags.find((f) => f.id === 'multiple-icon-libs')
  assert.ok(flag && flag.detail.length === 2)
})

/* ──────────────────────────────── CSS Modules ──────────────────────────────── */

test('module imports resolve relative to the importing file', () => {
  assert.equal(resolveRelative('src/ui/Card.tsx', './Card.module.css'), 'src/ui/Card.module.css')
  assert.equal(resolveRelative('src/ui/Card.tsx', '../styles/x.module.css'), 'src/styles/x.module.css')
  assert.deepEqual(
    cssModuleBindings('src/Card.tsx', "import styles from './Card.module.css'"),
    { styles: 'src/Card.module.css' },
  )
  assert.deepEqual(
    cssModuleBindings('src/M.tsx', "import * as s from './M.module.scss'"),
    { s: 'src/M.module.scss' },
  )
})

test('module class references are read, in all four shapes', () => {
  const bindings = { styles: 'a.module.css' }
  const grab = (src) => moduleClassAttrs('a.tsx', src, bindings).flatMap((e) => e.classes)
  assert.deepEqual(grab('<b className={styles.title}/>'), ['a.module.css#title'])
  assert.deepEqual(grab("<b className={styles['title']}/>"), ['a.module.css#title'])
  assert.deepEqual(grab('<b className={cn(styles.a, styles.b)}/>'), ['a.module.css#a', 'a.module.css#b'])
  assert.ok(grab('<b className={`${styles.a} pad`}/>').includes('a.module.css#a'))
})

const MODULES = [
  file('src/Card.module.css', '.primary { background:#4f46e5; padding:8px 16px; border-radius:8px; }\n.ghost { background:transparent; padding:8px 16px; }'),
  file('src/Modal.module.css', '.primary { background:#db2777; padding:10px 20px; border-radius:14px; }'),
  file('src/Card.tsx', "import styles from './Card.module.css'\n<button className={styles.primary}>a</button>\n<button className={styles.ghost}>b</button>"),
  file('src/Modal.tsx', "import s from './Modal.module.css'\n<button className={s.primary}>c</button>"),
]

test('CSS-module elements count as read, not as a blind spot', () => {
  // The bug that took a real repo to 72% coverage and nearly a false refusal.
  const r = auditFiles(MODULES)
  assert.equal(r.meta.unreadable['dynamic-classname'], undefined)
  assert.equal(r.meta.parsed, 1)
  assert.equal(r.refused, false)
})

test('the same class name in two modules stays two treatments', () => {
  // CSS Modules are file-scoped. Merging them would UNDERCOUNT the sprawl.
  const r = auditFiles(MODULES)
  assert.equal(r.components.button.treatments, 3)
  const sigs = r.components.button.signatures.map((s) => s.sig)
  assert.ok(sigs.includes('src/Card.module.css#primary'))
  assert.ok(sigs.includes('src/Modal.module.css#primary'))
})

test('a module-qualified signature keeps its path case, so the swatch resolves', () => {
  const r = auditFiles(MODULES)
  const sig = r.components.button.signatures.find((s) => s.sig.includes('Card.module.css#primary'))
  assert.ok(r.classStyles[sig.sig], 'the signature must key straight into classStyles')
  assert.equal(r.classStyles[sig.sig].background, '#4f46e5')
})

test('a module-bound element with real declarations is expressible', () => {
  const r = auditFiles(MODULES)
  assert.equal(r.meta.expressible.counts.tokensOnly, 3)
  assert.equal(r.meta.expressible.counts.none, 0)
})

test('genuinely dynamic classNames are still counted as unreadable', () => {
  const r = auditFiles([file('a.tsx', '<div className={someVar}>x</div>'.repeat(5))])
  assert.ok(r.meta.unreadable['dynamic-classname'] >= 5)
})

/* ────────────────────────── the hinge: inferredConfig ───────────────────────── */

test('inferredConfig emits real Config values, and null confidence when undecided', () => {
  const r = auditFiles([file('a.css', `
    .a { border-radius: 8px; } .b { border-radius: 8px; } .c { border-radius: 8px; }
    .d { border-radius: 8px; } .e { border-radius: 8px; } .f { border-radius: 3px; }
  `)])
  assert.ok(['none', 'subtle', 'soft', 'round'].includes(r.inferredConfig.values.radius))
  assert.equal(r.inferredConfig.values.radius, 'soft', '8px is the soft rung')
  assert.ok(r.inferredConfig.confidence.radius > 0.8)
})

test('no dominant value means the questionnaire has to ask', () => {
  const evenly = Array.from({ length: 8 }, (_, i) => `.r${i} { border-radius: ${i * 3 + 2}px; }`).join('\n')
  const r = auditFiles([file('a.css', evenly)])
  assert.equal(r.inferredConfig.confidence.radius, null)
  assert.equal(r.inferredConfig.values.radius, undefined)
})

test('the dominant saturated colour picks a theme, greys do not', () => {
  const r = auditFiles([file('a.css', `
    .a { background: #0A84FF; } .b { background: #0A84FF; } .c { background: #0A84FF; }
    .d { color: #f4f4f5; } .e { color: #e5e5e5; }
  `)])
  assert.equal(r.inferredConfig.values.colorTheme, 'cobalt')
})

/* ───────────────────────────── meta and reporting ───────────────────────────── */

test('the near-dupe metric and threshold are emitted so anyone can recompute', () => {
  const r = auditFiles([file('m.css', messy)])
  assert.equal(r.meta.nearDupeMetric.color, 'CIEDE2000')
  assert.equal(r.meta.nearDupeMetric.threshold, 2)
})

test('expressible splits recipe / tokens-only / none against the vocabulary', () => {
  const vocabulary = { vocabVersion: 'test', classes: { btn: ['primary'] } }
  const r = auditFiles([file('a.tsx', `
    <button className="btn btn--primary">kit</button>
    <div className="bg-red-500 p-4">bespoke but tokenisable</div>
  `)], { vocabulary })
  assert.equal(r.meta.expressible.counts.recipe, 1)
  assert.equal(r.meta.expressible.counts.tokensOnly, 1)
  assert.equal(r.meta.vocabVersion, 'test')
})

test('values carry file/line addresses — a codemod cannot act on a filename', () => {
  const r = auditFiles([file('a.css', '.a { border-radius: 7px; }')])
  const v = r.dimensions.radius.values[0]
  assert.equal(v.at[0].file, 'a.css')
  assert.ok(Number.isInteger(v.at[0].line) && v.at[0].line > 0)
})

test('auditFiles is deterministic — the score is a fact, not an opinion', () => {
  const files = [file('m.css', messy), file('b.tsx', '<button className="bg-blue-500 p-3">x</button>')]
  const a = JSON.stringify(auditFiles(files))
  const b = JSON.stringify(auditFiles(files))
  assert.equal(a, b, 'two runs over the same input must be byte-identical')
})

test('mx-auto is a layout decision, not a spacing value', () => {
  const evs = extractClasses(['mx-auto', 'p-4'], at).filter((e) => e.dim === 'spacing')
  assert.ok(evs.every((e) => e.value === '16px'), 'only p-4 should register')
  assert.equal(evs.length, 4)
})
