/* The static half of the recurring sweep: the two findings that were not about
 * rendering at all, locked as invariants. The rendered half is `npm run sweep`. */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

test('the bake matches the door: every builder seeds the brand the page opens with', () => {
  /* Ant Design opened teal because build-page baked with one brand while the
     page's default state held another. Nothing renders twice to check this —
     the literals just have to agree. */
  const stateBrand = /values: \{ brand: '([^']+)'/.exec(readFileSync('page.template.html', 'utf8'))?.[1]
  const pageSeed = /const SEED = \{ brand: '([^']+)'/.exec(readFileSync('build-page.mjs', 'utf8'))?.[1]
  const homeSeed = /const VALUES = \{ brand: '([^']+)'/.exec(readFileSync('build-home.mjs', 'utf8'))?.[1]
  const wallSeed = /brand: '([^']+)'/.exec(readFileSync('preview.mjs', 'utf8'))?.[1]
  assert.ok(stateBrand, 'the page state declares a default brand')
  for (const [who, got] of [['build-page', pageSeed], ['build-home', homeSeed], ['preview', wallSeed]]) {
    assert.equal(got?.toLowerCase(), stateBrand.toLowerCase(),
      `${who} bakes with ${got}, but the page opens with ${stateBrand} — whatever is compiled at build time opens wrong`)
  }
})

test('mantine variant classes survive the fetch', () => {
  /* Their module maps name variants with double hyphens — tab--default — and a
     reader whose pattern has no hyphen silently drops every one. The tabs
     rendered as base boxes for exactly that reason. */
  const tabs = JSON.parse(readFileSync('kits/mantine.json', 'utf8')).classes?.Tabs ?? {}
  assert.ok(Object.keys(tabs).some((k) => k.includes('--')),
    `kits/mantine.json Tabs has ${Object.keys(tabs).join(', ')} — no variant class in sight, so the fetch regex lost its hyphen again`)
})
