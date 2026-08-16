/**
 * What a screen reader actually encounters — the layer axe cannot reach.
 *
 *   npm run dev  &&  node scripts/a11y-tree.mjs
 *
 * axe checks rules against the DOM. It cannot tell you whether the task list
 * reads as a plan or as four loose links, whether the toggletip announces itself
 * or appears in silence, whether the error summary MOVES focus or merely sits
 * above the form, or whether the reading order matches what the eye sees. Those
 * are behaviours, and they are the ones the study's components live or die on.
 *
 * Read via CDP's real accessibility tree — the computed roles and names the
 * platform hands to assistive tech, not our markup's intentions.
 */
import { chromium } from '@playwright/test'
import { APP } from './lib/base.mjs'

const FAIL = []
const note = (ok, what, detail) => {
  console.log(`  ${ok ? '✓' : '✗'} ${what}${detail ? ` — ${detail}` : ''}`)
  if (!ok) FAIL.push(`${what}${detail ? `: ${detail}` : ''}`)
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
const cdp = await page.context().newCDPSession(page)
await cdp.send('Accessibility.enable')
await page.goto(APP, { waitUntil: 'networkidle' })
await page.waitForSelector('.cockpit-preview', { timeout: 20000 })
await page.waitForTimeout(1200)

const axTree = async () => {
  const { nodes } = await cdp.send('Accessibility.getFullAXTree')
  return nodes.map((n) => ({
    role: n.role?.value, name: n.name?.value, id: n.nodeId, backend: n.backendDOMNodeId,
    ignored: n.ignored,
    props: Object.fromEntries((n.properties || []).map((p) => [p.name, p.value?.value])),
  }))
}

// ── 1. heading structure ───────────────────────────────────────────────────
console.log('\n1. HEADING OUTLINE')
{
  const hs = await page.$$eval('.cockpit-preview :is(h1,h2,h3,h4,h5,h6)',
    (els) => els.map((e) => ({ lvl: +e.tagName[1], text: (e.textContent || '').trim().slice(0, 40) })))
  const skips = hs.filter((h, i) => i > 0 && h.lvl - hs[i - 1].lvl > 1)
  note(hs.length > 0, 'headings present', `${hs.length} found`)
  note(skips.length === 0, 'no skipped levels',
    skips.length ? skips.map((s) => `h${s.lvl} "${s.text}"`).join(', ') : 'contiguous')
}

// ── 2. the task list: a plan, or four loose links? ─────────────────────────
console.log('\n2. TASK LIST — plan or loose links?')
{
  const t = await page.$$eval('.tasklist', (els) => {
    const e = els[0]; if (!e) return null
    const items = [...e.querySelectorAll('.tasklist__item, li')]
    return {
      tag: e.tagName, role: e.getAttribute('role'),
      count: items.length,
      items: items.slice(0, 4).map((li) => ({
        tag: li.tagName,
        link: !!li.querySelector('a'),
        // the status must be TEXT, not only a colour or an icon
        status: (li.querySelector('.tasklist__status, [class*=status]')?.textContent || '').trim(),
        text: (li.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 46),
      })),
    }
  })
  if (!t) { note(false, 'task list rendered', 'not found in the gallery') }
  else {
    const list = t.tag === 'OL' || t.tag === 'UL' || t.role === 'list'
    note(list, 'container is a list', `<${t.tag.toLowerCase()}> role=${t.role || '—'}`)
    note(t.items.every((i) => i.status.length > 0), 'each item carries its status in TEXT',
      t.items.map((i) => i.status || '∅').join(' · '))
    const notLinked = t.items.filter((i) => !i.link)
    note(true, 'items that are deliberately NOT links', `${notLinked.length}/${t.items.length} (a task you cannot start must not be a link)`)
    for (const i of t.items) console.log(`      ${i.link ? 'link' : 'text'}  "${i.text}"`)
  }
}

// ── 3. the toggletip: does it announce, or appear in silence? ──────────────
console.log('\n3. TOGGLETIP — announced or silent?')
{
  const btn = await page.$('.toggletip__btn, .toggletip button, button.toggletip')
  if (!btn) note(false, 'toggletip rendered', 'not found')
  else {
    const before = await page.evaluate(() => {
      const l = document.querySelector('.toggletip [aria-live], .toggletip [role=status], .toggletip__bubble')
      return { live: l?.getAttribute('aria-live') || l?.getAttribute('role') || null, text: (l?.textContent || '').trim() }
    })
    /* Scoped INSIDE .toggletip. The first version fell through to a bare
     * `[role=status]`, matched the maintenance banner elsewhere on the wall and
     * reported the toggletip as pre-filled — a finding about my own selector.
     * Same lesson as the contrast work: check what the instrument is pointing at
     * before believing what it says. */
    note(!!before.live, 'a live region exists', before.live ? `aria-live/role = ${before.live}` : 'none — content would appear silently')
    note(before.text === '', 'live region starts EMPTY', before.text ? `already contains "${before.text.slice(0,30)}" — a screen reader hears nothing on open` : 'empty, so inserting text is an announcement')
    await btn.click(); await page.waitForTimeout(350)
    const after = await page.evaluate(() => {
      const l = document.querySelector('.toggletip [aria-live], .toggletip [role=status], .toggletip__bubble')
      return (l?.textContent || '').trim()
    })
    note(after.length > 0, 'content lands in the live region on open', after ? `"${after.slice(0, 46)}"` : 'nothing appeared')
    const named = await btn.evaluate((b) => b.getAttribute('aria-label') || b.textContent?.trim() || '')
    note(named.length > 0, 'trigger has an accessible name', named.slice(0, 40))
    await page.keyboard.press('Escape'); await page.waitForTimeout(200)
  }
}

// ── 4. the error summary: does it MOVE focus? ─────────────────────────────
console.log('\n4. ERROR SUMMARY — moves focus, or just sits there?')
{
  const sum = await page.$('.errorsummary')
  if (!sum) note(false, 'error summary rendered', 'not found')
  else {
    const meta = await sum.evaluate((e) => ({
      tabindex: e.getAttribute('tabindex'), role: e.getAttribute('role'),
      labelled: e.getAttribute('aria-labelledby') || e.getAttribute('aria-label'),
      links: [...e.querySelectorAll('a')].map((a) => a.getAttribute('href')),
    }))
    note(meta.tabindex === '-1', 'can receive programmatic focus', `tabindex=${meta.tabindex ?? 'absent'}`)
    note(!!meta.role, 'announced as a region/alert', meta.role || 'no role — arrival is silent')
    note(!!meta.labelled, 'the region is named', meta.labelled || 'unnamed')
    // click the first link: focus must land ON the field, not just scroll to it
    if (meta.links[0]?.startsWith('#')) {
      await page.click(`.errorsummary a[href="${meta.links[0]}"]`)
      await page.waitForTimeout(300)
      const landed = await page.evaluate(() => {
        const a = document.activeElement
        return { tag: a?.tagName, id: a?.id, isField: /INPUT|SELECT|TEXTAREA/.test(a?.tagName || '') }
      })
      note(landed.isField, 'the link moves focus to the field itself',
        landed.isField ? `focus on <${landed.tag.toLowerCase()}#${landed.id}>` : `focus stayed on <${(landed.tag||'?').toLowerCase()}> — a sighted-only jump`)
    }
  }
}

// ── 5. the skip link ──────────────────────────────────────────────────────
console.log('\n5. SKIP LINK — first stop, and does it land?')
{
  /* A FRESH document, because "first tab stop" only means anything from a fresh
   * document. Sections 3 and 4 deliberately click deep in the wall, so a bare
   * Tab here resumes from the sequential-focus starting point they left behind
   * and reports whatever follows that field — which is how this check first
   * accused a skip link that was working correctly. `blur()` does not move that
   * starting point back in Chromium; only a reload does. */
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForSelector('.cockpit-preview', { timeout: 20000 })
  await page.waitForTimeout(800)
  await page.keyboard.press('Tab')
  const first = await page.evaluate(() => {
    const a = document.activeElement
    return { text: (a?.textContent || '').trim(), href: a?.getAttribute('href'), cls: a?.className }
  })
  note(/skip/i.test(first.text) || /skiplink/.test(first.cls || ''), 'skip link is the first tab stop', `"${first.text}"`)
  if (first.href?.startsWith('#')) {
    await page.keyboard.press('Enter'); await page.waitForTimeout(250)
    const target = await page.evaluate(() => {
      const a = document.activeElement
      return { tag: a?.tagName, id: a?.id, isBody: a === document.body }
    })
    note(!target.isBody, 'focus moves to the target', target.isBody ? 'focus fell back to <body> — the skip did nothing for a keyboard' : `<${target.tag.toLowerCase()}#${target.id || '—'}>`)
  }
}

// ── 6. reading order vs visual order ──────────────────────────────────────
console.log('\n6. READING ORDER vs VISUAL ORDER')
{
  /* Subjects = the gallery's own cards, by the identity every gate uses
   * (data-recipe / data-card) — NOT every `.card` on the wall. A `.card` used as
   * a SPECIMEN inside a tall card at the bottom of the right masonry column has
   * a larger y than the next real card at the top of the left column, and that
   * read as "a backward jump" for as long as this line said `.card`. */
  const jumps = await page.$$eval('.cockpit-preview [data-recipe], .cockpit-preview [data-card]', (cards) => {
    const seen = cards.map((c) => { const r = c.getBoundingClientRect(); return { y: r.top, x: r.left } })
    const out = []
    for (let i = 1; i < seen.length; i++) {
      // masonry columns legitimately move up; flag only a jump BACK up the page
      // that is also a jump LEFT — the signature of a source order that fights
      // the layout rather than one that flows into a second column.
      if (seen[i].y < seen[i - 1].y - 250 && seen[i].x < seen[i - 1].x - 40) out.push(i)
    }
    return { total: seen.length, jumps: out.length }
  })
  note(jumps.jumps === 0, 'source order flows with the layout',
    jumps.jumps ? `${jumps.jumps} backward jumps over ${jumps.total} cards` : `${jumps.total} cards in order`)
}

// ── 7. every focusable has a name (AX-tree ground truth, not markup) ──────
console.log('\n7. ACCESSIBLE NAMES (from the platform tree)')
{
  const nodes = await axTree()
  const interactive = ['button', 'link', 'textbox', 'checkbox', 'radio', 'combobox', 'switch', 'slider', 'tab', 'menuitem', 'searchbox', 'spinbutton']
  const unnamed = nodes.filter((n) => !n.ignored && interactive.includes(n.role) && !(n.name || '').trim())
  note(unnamed.length === 0, 'every interactive node is named',
    unnamed.length ? unnamed.slice(0, 6).map((n) => n.role).join(', ') + (unnamed.length > 6 ? ` +${unnamed.length - 6}` : '') : `${nodes.filter((n) => interactive.includes(n.role)).length} checked`)

  const landmarks = nodes.filter((n) => ['main', 'navigation', 'banner', 'contentinfo', 'search', 'form'].includes(n.role))
  note(landmarks.some((l) => l.role === 'main'), 'a main landmark exists',
    landmarks.map((l) => l.role).join(', ') || 'none')
}

await browser.close()
console.log(`\n${'═'.repeat(64)}`)
if (FAIL.length) { console.log(`${FAIL.length} finding(s):`); FAIL.forEach((f) => console.log(`  · ${f}`)); process.exit(1) }
console.log('no findings')
