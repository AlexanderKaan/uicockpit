/* node --test wall.test.mjs — the wall's completeness gate.
 * A hole in a wall whose job is confidence is worse than a missing feature. */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { PARTS, render, gaps } from './parts.mjs'
import { WALL } from './wall-bindings.mjs'
import { SCENES } from './scenes.mjs'

const KITS = Object.keys(WALL)

test('every kit answers every part — no kit gets to be half a wall', () => {
  for (const id of KITS) assert.deepEqual(gaps(WALL[id]), [], `${id} has no answer for these`)
})

test('every scene renders in every kit with nothing missing', () => {
  for (const scene of SCENES) {
    for (const id of KITS) {
      const html = render(scene.node, WALL[id])
      assert.doesNotMatch(html, /data-missing/, `${scene.id} has a hole in ${id}`)
      assert.ok(html.length > 200, `${scene.id} rendered almost nothing in ${id}`)
    }
  }
})

test('a scene never knows which kit it is in', () => {
  const text = JSON.stringify(SCENES)
  for (const word of ['class', 'tailwind', 'daisy', 'bootstrap', 'shadcn', 'material', '#', 'oklch', 'var(--']) {
    assert.ok(!text.toLowerCase().includes(word.toLowerCase()),
      `a scene mentions "${word}" — the moment scenes know about kits, adding a kit stops being a table`)
  }
})

test('a scene only uses parts the vocabulary has', () => {
  const used = new Set()
  const walk = (n) => { if (n && typeof n === 'object') { used.add(n.p); (n.kids ?? []).forEach(walk) } }
  SCENES.forEach((s) => walk(s.node))
  for (const p of used) assert.ok(PARTS.includes(p), `"${p}" is used by a scene but is not in PARTS`)
})

test('each kit renders in its OWN classes, not a shared blob', () => {
  const dash = SCENES[0].node
  assert.match(render(dash, WALL.daisyui), /class="btn btn-primary"/)
  assert.match(render(dash, WALL.bootstrap), /class="btn btn-primary"/)
  assert.match(render(dash, WALL.bootstrap), /class="table"/)
  assert.match(render(dash, WALL.tailwind), /bg-brand/)
  assert.match(render(dash, WALL.shadcn), /bg-primary text-primary-foreground/)
  assert.match(render(dash, WALL.material), /--md-sys-color-primary/)
  /* and the five are genuinely different output, not one table wearing hats */
  const all = KITS.map((id) => render(dash, WALL[id]))
  assert.equal(new Set(all).size, KITS.length, 'two kits produced identical markup')
})

test('every control in the wall clears the 24px target floor', () => {
  /* 2.5.8 again. The wall is a promise about what you will ship, so a specimen
     that fails it is a promise we cannot keep. Checked on the markup we emit. */
  for (const id of KITS) {
    const html = render(SCENES[3].node, WALL[id])
    const buttons = html.match(/<button[^>]*>/g) ?? []
    assert.ok(buttons.length >= 4, `${id} rendered no buttons`)
    for (const b of buttons) {
      assert.ok(/min-h-9|min-height:40px|btn/.test(b), `${id}: a button with no height floor — ${b.slice(0, 70)}`)
    }
  }
})
