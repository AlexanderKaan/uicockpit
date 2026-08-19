/* node --test test.mjs — the meter for the two catalogs and the four bindings.
 * Every assertion here is a thing that broke once while building this. */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { applyStream, buildTree, childRefs, parseStream, propsOf, requiredOf, actionsOf, walk, resolve, FUNCTIONS } from './core.mjs'
import { BINDINGS, emit } from './bindings.mjs'
import { check, catalogGaps, describeBinding } from './check.mjs'
import { emitSchema } from './schema.mjs'
import { readVocabulary, audit } from './vocab.mjs'

const json = (f) => JSON.parse(readFileSync(f, 'utf8'))
const BASIC = json('catalogs/a2ui-basic.catalog.json')
const BASIC_A11Y = json('catalogs/a2ui-basic.a11y.json')
const BASIC_DEMOS = json('catalogs/a2ui-basic.demos.json').demos
const OURS = json('catalog.json')
const OUR_DEMOS = json('demos.json')

/** Build a real surface out of a list of demo names, exactly as the page does. */
function surfaceOf(catalog, demos, names) {
  const dataModel = {}
  for (const n of names) for (const [k, v] of Object.entries(demos[n].data ?? {})) {
    dataModel[k] = (v && typeof v === 'object' && !Array.isArray(v)) ? { ...(dataModel[k] ?? {}), ...v } : v
  }
  const components = [
    { id: 'root', component: 'Card', child: 'body' },
    { id: 'body', component: 'Column', children: names.map((n) => 'n_' + n) },
    ...names.flatMap((n) => [{ id: 'n_' + n, ...structuredClone(demos[n].node) }, ...structuredClone(demos[n].extra ?? [])]),
  ]
  const s = applyStream([
    JSON.stringify({ createSurface: { surfaceId: 's', dataModel } }),
    JSON.stringify({ updateComponents: { surfaceId: 's', components } }),
  ]).get('s')
  return { surface: s, tree: buildTree(s.components, 'root', { refs: childRefs(catalog), model: s.model }) }
}
const pickable = (demos) => Object.keys(demos).filter((n) => !demos[n].layout)

test('every component of both catalogs has a demo, and every demo a component', () => {
  for (const [label, cat, demos] of [['basic', BASIC, BASIC_DEMOS], ['ours', OURS, OUR_DEMOS]]) {
    assert.deepEqual(Object.keys(cat.components).filter((n) => !demos[n]), [], `${label}: component without a demo`)
    assert.deepEqual(Object.keys(demos).filter((n) => !cat.components[n]), [], `${label}: demo without a component`)
  }
})

test('every component carries semantics — from the catalog, or from a sidecar', () => {
  for (const n of Object.keys(OURS.components)) assert.ok(OURS.components[n]['x-a11y'], `${n} has no x-a11y`)
  for (const n of Object.keys(OURS.components)) assert.ok(OURS.components[n]['x-source'], `${n} has no provenance`)
  for (const n of Object.keys(BASIC.components)) assert.ok(BASIC_A11Y.components[n], `${n} missing from the sidecar`)
})

test("the sidecar only names properties the published schema actually has", () => {
  const propsOf = (d) => Object.assign({}, ...(d.allOf ?? []).map((p) => p.properties ?? {}), d.properties ?? {})
  for (const [name, a] of Object.entries(BASIC_A11Y.components)) {
    const props = propsOf(BASIC.components[name])
    for (const key of ['name', 'items', 'decorativeWhen']) {
      if (a[key]) assert.ok(props[a[key]], `${name}.${a[key]} (declared as ${key}) is not in the catalog`)
    }
  }
})

test('child ids are read from the schema, including the ones with odd names', () => {
  const refs = childRefs(BASIC)
  assert.deepEqual(refs.get('Modal').map((r) => r.prop), ['trigger', 'content'])
  assert.deepEqual(refs.get('Tabs'), [{ prop: 'tabs', item: 'child' }])
  assert.deepEqual(refs.get('Button').map((r) => r.prop), ['child'])
})

test('a collection template renders one copy per item, each in its own scope', () => {
  const { surface, tree } = surfaceOf(BASIC, BASIC_DEMOS, ['List'])
  const out = walk(tree, (n, k, r) => (n.component === 'Text' ? `[${r(n.text)}]` : k), surface.model)
  assert.match(out, /\[Kralingen — Mon–Sat, 08:00–17:00\]/)
  assert.match(out, /\[Bospolder — Mon–Fri, 08:00–15:00\]/)
  assert.equal(out.split('[').length - 1, 3)
})

test('all four bindings render every component of both catalogs', () => {
  for (const [cat, demos] of [[BASIC, BASIC_DEMOS], [OURS, OUR_DEMOS]]) {
    const names = pickable(demos)
    const { surface, tree } = surfaceOf(cat, demos, names)
    for (const b of Object.values(BINDINGS)) {
      const html = walk(tree, (n, k, r, ka) => b.h(n, k, r, ka) ?? `MISSING:${n.component}`, surface.model)
      assert.doesNotMatch(html, /MISSING:/, `${b.id} has no case for ${(html.match(/MISSING:(\w+)/g) ?? []).join()}`)
    }
  }
})

test('the kit binding only emits classes the kit stylesheets define', () => {
  const css = ['kit/kit.css', 'kit/global.css', 'kit/platform.css'].map((f) => readFileSync(f, 'utf8')).join('\n')
  const defined = new Set([...css.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((m) => m[1]))
  for (const [cat, demos] of [[BASIC, BASIC_DEMOS], [OURS, OUR_DEMOS]]) {
    const { surface, tree } = surfaceOf(cat, demos, pickable(demos))
    const html = walk(tree, (n, k, r, ka) => BINDINGS.kit.h(n, k, r, ka) ?? '', surface.model)
    for (const m of html.matchAll(/class="([^"]+)"/g)) for (const c of m[1].split(/\s+/)) {
      assert.ok(defined.has(c), `.${c} is emitted but no stylesheet defines it`)
    }
  }
})

test('the catalog gaps are the ones the published schema really has', () => {
  const ann = new Map(Object.entries(BASIC_A11Y.components))
  const gaps = catalogGaps(ann)
  assert.deepEqual(gaps.filter((g) => g.kind === 'name').map((g) => g.component).sort(), ['Modal', 'Video'])
  assert.equal(gaps.filter((g) => g.kind === 'structure').length, 1, 'the Basic Catalog has no heading component')
  const ours = catalogGaps(new Map(Object.entries(OURS.components).map(([n, d]) => [n, d['x-a11y']])))
  assert.deepEqual(ours, [], 'our own catalog should have no gaps')
})

test('a gap in the catalog is never charged to the answer, and never counted twice', () => {
  const { tree } = surfaceOf(BASIC, BASIC_DEMOS, ['Video'])
  const rep = check(tree, { catalog: BASIC, a11y: BASIC_A11Y, binding: { id: 'kit', certified: true } })
  assert.deepEqual(rep.findings.filter((f) => f.severity === 'fail'), [], 'the answer cannot fix Video')
  assert.equal(rep.gapsUsed.length, 1)
  assert.equal(rep.verdict, 'partial', 'an answer that runs into a gap is not AA either')
})

test('an answer that stays inside what the catalog can express reaches AA', () => {
  const { tree } = surfaceOf(BASIC, BASIC_DEMOS, ['Text', 'Image', 'Button', 'TextField'])
  const rep = check(tree, { catalog: BASIC, a11y: BASIC_A11Y, binding: { id: 'kit', certified: true } })
  assert.equal(rep.verdict, 'AA', rep.why + ' — ' + JSON.stringify(rep.findings))
})

test('a Button is named by its child, and an unnamed one fails', () => {
  const comps = new Map([
    ['root', { id: 'root', component: 'Button', child: 'ic' }],
    ['ic', { id: 'ic', component: 'Icon', name: 'send' }],
  ])
  const tree = buildTree(comps, 'root', { refs: childRefs(BASIC) })
  const rep = check(tree, { catalog: BASIC, a11y: BASIC_A11Y, binding: { id: 'kit', certified: true } })
  assert.ok(rep.findings.some((f) => f.rule === 'control-has-name'), 'an icon-only button has no accessible name')
})

test('the shadcn artefact imports every name exactly once', () => {
  const { surface, tree } = surfaceOf(BASIC, BASIC_DEMOS, pickable(BASIC_DEMOS))
  const code = emit(BINDINGS.shadcn, tree, (t, fn) => walk(t, fn, surface.model))
  const names = code.split('\n').filter((l) => l.startsWith('import {'))
    .flatMap((l) => l.slice(l.indexOf('{') + 1, l.indexOf('}')).split(',').map((s) => s.trim()))
  assert.equal(new Set(names).size, names.length, 'a duplicate import is a file that does not compile')
  assert.doesNotMatch(code, /not in this binding/)
})

test('pointers inside a collection are absolute in the generated artefact', () => {
  const { surface, tree } = surfaceOf(BASIC, BASIC_DEMOS, ['List'])
  const code = emit(BINDINGS.shadcn, tree, (t, fn) => walk(t, fn, surface.model))
  assert.match(code, /"\/centres\/2"/, 'each unrolled copy carries the scope it was resolved in')
})

test('the certificate is never rounded up', () => {
  const cert = json('binding.json')
  const d = describeBinding(cert)
  assert.equal(cert.certified, cert.failures.length === 0)
  if (!cert.certified) assert.ok(d.partial && d.line.includes(String(cert.failures.length)), 'the failures must be said out loud')
  assert.ok(cert.certifiedCombinations <= cert.combinations)
})

test('a stream is read in every form someone might paste', () => {
  const one = { version: 'v1.0', createSurface: { surfaceId: 's' } }
  const two = { version: 'v1.0', updateComponents: { surfaceId: 's', components: [] } }
  const jsonl = [one, two].map((m) => JSON.stringify(m)).join('\n')
  assert.deepEqual(parseStream(jsonl), [one, two], 'JSONL, the form A2UI sends')
  assert.deepEqual(parseStream(JSON.stringify([one, two], null, 2)), [one, two], 'a pretty-printed array')
  assert.deepEqual(parseStream(JSON.stringify(one, null, 2)), [one], 'a single message out of a log')
  assert.deepEqual(parseStream('  \n '), [], 'nothing is not an error')
  assert.deepEqual(parseStream(jsonl + '\n\n'), [one, two], 'blank lines are not messages')
})

test('a broken paste names the line, not just "invalid JSON"', () => {
  const bad = '{"version":"v1.0"}\n{"createSurface": oops}'
  assert.throws(() => parseStream(bad), /Line 2 is not valid JSON/)
})

test('the file the probe reads and the page renders are the same stream', () => {
  const fromFile = parseStream(readFileSync('message.jsonl', 'utf8'))
  const surfaces = applyStream(fromFile.map((m) => JSON.stringify(m)))
  const s = surfaces.get('permit_1')
  const tree = buildTree(s.components, 'root', { refs: childRefs(OURS), model: s.model })
  const rep = check(tree, { catalog: OURS, binding: { id: 'kit', certified: true } })
  assert.equal(rep.verdict, 'AA', rep.why)
})

test('every demo carries what the published schema says is required', () => {
  for (const [label, cat, demos] of [['basic', BASIC, BASIC_DEMOS], ['ours', OURS, OUR_DEMOS]]) {
    for (const [name, demo] of Object.entries(demos)) {
      if (demo.layout) continue
      for (const req of requiredOf(cat.components[name])) {
        if (req === 'component') continue
        assert.ok(req in demo.node, `${label}: ${name} demo has no "${req}", which the catalog requires`)
      }
    }
  }
})

test('the generated schema carries every component and every property', () => {
  for (const [label, cat] of [['basic', BASIC], ['ours', OURS]]) {
    const ts = emitSchema(cat)
    for (const [name, def] of Object.entries(cat.components)) {
      assert.ok(ts.includes(`z.literal(${JSON.stringify(name)})`), `${label}: ${name} missing from the schema`)
      for (const prop of Object.keys(propsOf(def))) {
        if (prop === 'component') continue
        assert.match(ts, new RegExp(`\\n  ${prop}: `), `${label}: ${name}.${prop} was dropped by the generator`)
      }
    }
    assert.ok(ts.includes('discriminatedUnion'), `${label}: no union`)
    /* The whole point: it reports what it refused rather than returning an
       empty array. Checked against the CODE — the first version of this test
       matched the sentence in the doc comment that says so. */
    const code = ts.replace(/\/\*[\s\S]*?\*\//g, '')
    assert.match(code, /refused: Array<\{ index: number/, `${label}: the parse must report refusals`)
    assert.doesNotMatch(code, /return \[\]/, `${label}: a parse that returns [] makes the answer vanish`)
  }
})

test('required in the catalog is required in the schema, and optional is optional', () => {
  const ts = emitSchema(BASIC)
  const block = (name) => ts.slice(ts.indexOf(`z.literal(${JSON.stringify(name)})`)).split('\n})')[0]
  const req = new Set(requiredOf(BASIC.components.Button))
  for (const prop of Object.keys(propsOf(BASIC.components.Button))) {
    if (prop === 'component') continue
    const line = block('Button').split('\n').find((l) => l.trim().startsWith(prop + ':'))
    assert.ok(line, `Button.${prop} missing`)
    assert.equal(line.includes('.optional()'), !req.has(prop), `Button.${prop}: optionality does not match the catalog`)
  }
})

test('a catalog that enumerates its actions can be checked; one that does not is a gap', () => {
  const ours = actionsOf(OURS)
  assert.ok(ours.declared.length, 'our catalog should declare its actions')
  assert.deepEqual(actionsOf(BASIC).declared, [], "A2UI's Basic Catalog enumerates none")
  assert.ok(actionsOf(BASIC).props.some((p) => p.component === 'Button'), 'Button carries one all the same')

  const gaps = catalogGaps(new Map(Object.entries(BASIC_A11Y.components)), BASIC)
  assert.equal(gaps.filter((g) => g.kind === 'action').length, 1)
  const ourGaps = catalogGaps(new Map(Object.entries(OURS.components).map(([n, d]) => [n, d['x-a11y']])), OURS)
  assert.deepEqual(ourGaps, [], 'ours declares them, so there is nothing to report')
})

test('an answer may only ask for a side effect the catalog declares', () => {
  const one = (action) => {
    const comps = new Map([['root', { id: 'root', component: 'Button', label: 'Do it', action }]])
    return check(buildTree(comps, 'root', { refs: childRefs(OURS) }), { catalog: OURS, binding: { id: 'kit', certified: true } })
  }
  assert.equal(one('open_case').findings.length, 0)
  const bad = one('wipe_database')
  assert.equal(bad.verdict, 'fail')
  assert.ok(bad.findings.some((f) => f.rule === 'action-is-declared' && /wipe_database/.test(f.message)))
})

/* ── the front door's engine: what a vocabulary cannot say ────────────────── */
const ids = (r) => r.findings.map((f) => f.id).sort()

test('a vocabulary is read in all three shapes it ships in', () => {
  assert.equal(readVocabulary(JSON.stringify(BASIC)).kind, 'A2UI catalog')
  assert.equal(readVocabulary(readFileSync('sample.zod.ts', 'utf8')).kind, 'Zod schema')
  const union = "type UIBlock = | { type: 'cost-summary'; props: { period: string } } | { type: 'confirmation'; props: { message: string; actionId: string } };"
  const ts = readVocabulary(union)
  assert.equal(ts.kind, 'TypeScript union')
  assert.deepEqual(ts.components.map((c) => c.name), ['cost-summary', 'confirmation'])
})

test('it refuses to pretend it read something it did not', () => {
  for (const junk of ['hello world', '{ "nope": 1 }', '{ broken', '']) {
    const v = readVocabulary(junk)
    assert.equal(v.kind, null, `"${junk.slice(0, 12)}" should not parse as a vocabulary`)
    assert.ok(v.note, 'and it must say why')
    assert.deepEqual(v.components, [])
  }
})

test("Google's Basic Catalog: the four things it cannot say", () => {
  const r = audit(readVocabulary(JSON.stringify(BASIC)), BASIC_A11Y)
  assert.deepEqual(ids(r), ['no-heading', 'no-text', 'open-actions', 'optional-name'])
  const optional = r.findings.find((f) => f.id === 'optional-name')
  assert.deepEqual(optional.evidence.sort(),
    ['AudioPlayer.description', 'ChoicePicker.label', 'DateTimeInput.label', 'Image.description', 'Slider.label'])
  assert.deepEqual(r.findings.find((f) => f.id === 'open-actions').evidence, ['Button.action'])
})

test('a container is not mute — holding other components is what it is for', () => {
  const r = audit(readVocabulary(JSON.stringify(BASIC)), BASIC_A11Y)
  const mute = r.findings.find((f) => f.id === 'no-text').evidence
  for (const container of ['Row', 'Column', 'Card', 'List', 'Tabs', 'Modal']) {
    assert.ok(!mute.includes(container), `${container} holds components; it does not need text of its own`)
  }
  assert.ok(mute.includes('Video'), 'Video holds nothing and can say nothing')
})

test('a vocabulary that states its semantics is believed, including its silences', () => {
  const r = audit(readVocabulary(JSON.stringify(OURS)))
  assert.deepEqual(r.findings, [], 'ours declares its names, its actions and a heading')
  assert.equal(r.semantics, 'stated by the vocabulary')
  /* and where nothing is stated, the reading is named as a reading */
  const guessed = audit(readVocabulary(readFileSync('sample.zod.ts', 'utf8')))
  assert.equal(guessed.semantics, 'read from property names')
  assert.match(guessed.findings.find((f) => f.id === 'optional-name').detail, /property names/)
})
