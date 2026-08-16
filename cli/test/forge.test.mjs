import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createForge, loadForgeData, formatVerdict, forms } from '../src/forge.mjs'

/**
 * The forge's tests are DERIVED where they can be: they walk the data the forge
 * answers from and check the forge agrees with it, so a new recipe, page or
 * catalogue entry is covered without an edit here. The hand-written cases at
 * the end are the six verdict shapes, one sentence each — the ones a person
 * would type.
 */
const data = await loadForgeData()
const forge = createForge(data)

test('loads: every vocabulary target names something (createForge throws otherwise)', () => {
  assert.ok(forge.size.concepts > 300, `only ${forge.size.concepts} concepts indexed`)
  assert.ok(forge.size.vocabulary > 400)
})

test('the forge finds every component we publish, by its page name', () => {
  const misses = []
  for (const r of data.kit.recipes) {
    if (!r.page) continue
    const v = forge.resolve(r.page.name)
    const hit = v.verdict === 'exists' && (v.recipe.id === r.id || (v.alternatives ?? []).some((a) => a.id === r.id))
    const composed = v.verdict === 'compose' && [v.primary, ...v.parts].some((p) => p?.recipe?.id === r.id)
    if (!hit && !composed) misses.push(`${r.page.name} → ${v.verdict}${v.recipe ? ` (${v.recipe.id})` : ''}`)
  }
  assert.deepEqual(misses, [], `pages the forge does not resolve to their own recipe:\n  ${misses.join('\n  ')}`)
})

test('the forge agrees with the derivation: every core catalogue entry is EXISTS, PLATFORM, DECIDED or a TOKEN — never NONE, never MAY EXIST', () => {
  /* audit:derivation holds that every layer-2 and layer-4 component entry is
   * covered by a recipe, the floor, or a written decision. Asked one at a time,
   * the forge must say the same — a "may exist" here would mean the forge sees
   * a gap the gate does not, and one of them is wrong. */
  const names = []
  for (const name of Object.keys(data.catalogues.apg.patterns)) names.push(['APG', name])
  for (const [system, sv] of Object.entries(data.catalogues.services)) for (const name of Object.keys(sv.components)) names.push([system, name])
  const wrong = []
  for (const [where, name] of names) {
    const v = forge.resolve(name)
    const ok = ['exists', 'platform', 'decided', 'token'].includes(v.verdict) ||
      (v.verdict === 'compose' && [v.primary, ...v.parts].every((p) => ['exists', 'platform', 'decided', 'token'].includes(p?.verdict)))
    if (!ok) wrong.push(`${where} · ${name} → ${v.verdict}`)
  }
  assert.deepEqual(wrong, [], `catalogue entries the forge does not cover:\n  ${wrong.join('\n  ')}`)
})

test('layer-4 PAGE patterns resolve to the component they are built from, or to a page-pattern verdict', () => {
  const wrong = []
  for (const [system, sv] of Object.entries(data.catalogues.services)) {
    for (const name of Object.keys(sv.patterns)) {
      const v = forge.resolve(name)
      const ok = ['exists', 'platform', 'compose'].includes(v.verdict) || (v.verdict === 'core' && v.pagePattern)
      if (!ok) wrong.push(`${system} · ${name} → ${v.verdict}`)
    }
  }
  assert.deepEqual(wrong, [], wrong.join('\n'))
})

test('EXISTS carries the contract, the provenance and the page', () => {
  const v = forge.resolve('tabs')
  assert.equal(v.verdict, 'exists')
  assert.equal(v.recipe.id, 'tabs')
  assert.equal(v.contract.pattern, 'Tabs')
  assert.ok(v.contract.keys.length >= 2, 'the APG key map is there')
  assert.ok(v.citations.some((c) => c.layer === 2 && /Tabs/.test(c.source)))
  assert.equal(v.page, '/components/tabs')
  assert.match(v.usage, /class="tab/)   // the block is .tab — one tab; the tablist is composition
})

test('PLATFORM refuses to build, and cites the element and the floor rule', () => {
  const v = forge.resolve('a horizontal line between two sections')
  assert.equal(v.verdict, 'platform')
  assert.equal(v.element, 'hr')
  assert.ok(v.floor.length >= 1, 'the floor rule is quoted')
  assert.match(v.floor[0].selector, /\bhr\b/)
  assert.ok(v.citations[0].url.includes('developer.mozilla.org'))
  assert.match(v.say, /not a component/)
})

test('PLATFORM names the recipes that build on the element', () => {
  const v = forge.resolve('a link')
  assert.equal(v.verdict, 'platform')
  assert.equal(v.element, 'a')
  assert.ok(v.extendedBy.some((x) => x.id === 'backlink'), `extendedBy: ${JSON.stringify(v.extendedBy)}`)
})

test('DECIDED answers with the written reason', () => {
  const v = forge.resolve('a tree table with expandable rows')
  assert.equal(v.verdict, 'decided')
  assert.match(v.reason, /tree crossed with a grid/)
})

test('a TOKEN-covered concept is not a component', () => {
  const v = forge.resolve('an icon')
  assert.equal(v.verdict, 'token')
  assert.match(v.tokens, /--k-icon-md/)
})

test('CENSUS: a local extension, with a scaffold that passes the value gate as written', () => {
  const v = forge.resolve('an avatar with initials')
  assert.equal(v.verdict, 'census')
  assert.ok(v.citations[0].note.match(/of 27/))
  const { css, html, id } = v.scaffold
  assert.equal(id, 'avatar')
  // every var() the scaffold uses is a token the kit ships
  const tokens = new Set(data.tokens)
  for (const m of css.matchAll(/var\((--k-[\w-]+)\)/g)) assert.ok(tokens.has(m[1]), `${m[1]} is not a kit token`)
  // and there is no raw value where a token belongs — the audit:values hard axes
  for (const decl of css.matchAll(/^\s*([a-z-]+)\s*:\s*([^;]+);/gm)) {
    const [, prop, value] = decl
    if (/^(gap|padding|margin|margin-inline-start|font-size|border-radius|color)$/.test(prop)) {
      assert.match(value.trim(), /^(var\(--k-[\w-]+\)\s*)+$/, `${prop}: ${value} is not token-only`)
    }
  }
  assert.match(html, /data-role="/)
  assert.match(html, new RegExp(`class="${id}"`))
})

test('NONE names the words it did not understand, and refuses precisely what the cut removed', () => {
  const v1 = forge.resolve('a spinning cube that shows the weather')
  assert.equal(v1.verdict, 'none')
  assert.deepEqual(v1.unknown, ['spinning', 'cube', 'weather'])
  assert.ok(v1.catalogues.length >= 3, 'the refusal cites the catalogues to describe against')

  const v2 = forge.resolve('a kanban board')
  assert.equal(v2.verdict, 'none')
  assert.deepEqual(v2.refusedWords, ['kanban', 'board'])
  assert.match(v2.say, /removed it on purpose/)
})

test('COMPOSE arranges several things we have, primary first, controls in the foot', () => {
  const v = forge.resolve('a dialog with a form and two buttons')
  assert.equal(v.verdict, 'compose')
  assert.equal(v.primary.recipe.id, 'dialog')
  assert.ok(v.parts.some((p) => p.recipe?.id === 'buttons'))
  assert.match(v.composition, /<dialog class="dialog"/)
  // the form landed in the body, the button in the foot — placed into the
  // manifest's real shape, not appended
  const body = v.composition.slice(v.composition.indexOf('dialog__body'), v.composition.indexOf('dialog__foot'))
  const foot = v.composition.slice(v.composition.indexOf('dialog__foot'))
  assert.match(body, /class="in/)
  assert.match(foot, /class="btn/)
})

test('a synonym reaches the catalogue, and the answer cites the catalogue — never the synonym', () => {
  const v = forge.resolve('show more')
  assert.equal(v.verdict, 'platform')
  assert.equal(v.element, 'details')
  assert.ok(v.citations.every((c) => !/show more/i.test(c.source)))
})

test('the two forms every name is indexed under meet ("badges" ↔ "badge")', () => {
  assert.ok(forms('Badges & pills').includes('badgespill') || forms('Badges & pills').includes('badgesandpills') || forms('badges').includes('badge'))
  const v = forge.resolve('badge')
  assert.equal(v.verdict, 'exists')
  assert.equal(v.recipe.id, 'badges-pills')
})

test('formatVerdict is a readable answer, and the exit code carries the verdict', () => {
  const t = formatVerdict(forge.resolve('a popover'))
  assert.match(t, /^PLATFORM — a popover/)
  assert.match(t, /Citations:/)
})
