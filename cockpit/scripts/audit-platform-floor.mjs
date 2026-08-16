#!/usr/bin/env node
/**
 * audit:platform-floor — how much of the platform do we actually style?
 *
 *   npm run dev  &&  npm run audit:platform-floor
 *
 * THE FLOOR IS THE PLATFORM. The architecture: build UP from the HTML elements
 * until the standard is in place, and only then add beauty as a layer that can
 * be removed without breaking anything. Strip our opinion and you are left with
 * the standard — not with a broken thing. That is the answer to "not too
 * opinionated" that neither shadcn (opinion baked into the base) nor Tailwind
 * (no base at all) can give.
 *
 * So the first question is not "which components should we build". It is: OF THE
 * UI SURFACE THE PLATFORM ALREADY GIVES US, HOW MUCH HAVE WE TOUCHED? Everything
 * untouched below is a place where a consumer who writes correct semantic HTML —
 * exactly the consumer we are selling to — gets a browser default sitting next
 * to our components, and that mismatch reads as "ugly" long before any question
 * of taste comes up.
 *
 * ⚠️ MEASURED WITH A CONTROL, not by grepping for selectors. A tag can appear in
 * a selector and be styled by nothing that matters, and it can be styled through
 * an inherited property with no selector naming it at all. So each element is
 * built TWICE — once inside our kit scope, once in a bare same-origin iframe
 * with no stylesheet — and the two computed styles are compared. A difference is
 * a treatment; no difference is browser default, whatever the CSS says.
 *
 * The element list IS a list, and a legitimate one: these are facts about HTML,
 * not a list of our subjects. It is the UI surface of the platform — the
 * elements a person building a public service actually types.
 */
import { chromium } from '@playwright/test'

const JSON_OUT = process.argv.includes('--json')

/* Each entry: [label, [ancestor tags…], tag, attrs, text].
 * Built with createElement rather than markup so nothing is parsed as HTML —
 * some elements only compute correctly inside their required parent, which the
 * chain provides (a <td> outside a <table> is not a <td>). */
const SURFACE = {
  'Forms — the controls a service is made of': [
    ['input[type=text]', [], 'input', { type: 'text', value: 'Text' }],
    ['input[type=email]', [], 'input', { type: 'email', value: 'a@b.nl' }],
    ['input[type=password]', [], 'input', { type: 'password', value: 'secret' }],
    ['input[type=search]', [], 'input', { type: 'search', value: 'query' }],
    ['input[type=tel]', [], 'input', { type: 'tel', value: '06' }],
    ['input[type=url]', [], 'input', { type: 'url', value: 'https://x.nl' }],
    ['input[type=number]', [], 'input', { type: 'number', value: '3' }],
    ['input[type=date]', [], 'input', { type: 'date' }],
    ['input[type=time]', [], 'input', { type: 'time' }],
    ['input[type=file]', [], 'input', { type: 'file' }],
    ['input[type=range]', [], 'input', { type: 'range' }],
    ['input[type=color]', [], 'input', { type: 'color' }],
    ['input[type=checkbox]', [], 'input', { type: 'checkbox' }],
    ['input[type=radio]', [], 'input', { type: 'radio' }],
    ['textarea', [], 'textarea', {}, 'Text'],
    ['select', [], 'select', {}],
    ['button', [], 'button', {}, 'Button'],
    ['label', [], 'label', {}, 'Label'],
    ['fieldset', [], 'fieldset', {}],
    ['legend', ['fieldset'], 'legend', {}, 'Legend'],
    ['output', [], 'output', {}, '42'],
    ['progress', [], 'progress', { value: '0.5' }],
    ['meter', [], 'meter', { value: '0.5' }],
  ],
  'Interactive — behaviour the platform already owns': [
    ['dialog', [], 'dialog', { open: '' }, 'Dialog'],
    ['details', [], 'details', { open: '' }],
    ['summary', ['details'], 'summary', {}, 'Summary'],
    ['a', [], 'a', { href: '#x' }, 'Link'],
  ],
  'Text — what running content is made of': [
    ['p', [], 'p', {}, 'Paragraph'],
    ['h1', [], 'h1', {}, 'Heading'],
    ['h2', [], 'h2', {}, 'Heading'],
    ['h3', [], 'h3', {}, 'Heading'],
    ['blockquote', [], 'blockquote', {}, 'Quote'],
    ['pre', [], 'pre', {}, 'pre'],
    ['code', [], 'code', {}, 'code'],
    ['kbd', [], 'kbd', {}, 'K'],
    ['samp', [], 'samp', {}, 'output'],
    ['var', [], 'var', {}, 'x'],
    ['abbr', [], 'abbr', { title: 't' }, 'ABBR'],
    ['time', [], 'time', { datetime: '2026-01-01' }, '2026'],
    ['mark', [], 'mark', {}, 'marked'],
    ['small', [], 'small', {}, 'small'],
    ['sub', [], 'sub', {}, 'sub'],
    ['sup', [], 'sup', {}, 'sup'],
    ['q', [], 'q', {}, 'quoted'],
    ['cite', [], 'cite', {}, 'Cite'],
    ['strong', [], 'strong', {}, 'strong'],
    ['em', [], 'em', {}, 'em'],
    ['s', [], 's', {}, 'struck'],
    ['hr', [], 'hr', {}],
  ],
  'Lists and tables': [
    ['ul', [], 'ul', {}],
    ['ol', [], 'ol', {}],
    ['li', ['ul'], 'li', {}, 'Item'],
    ['dl', [], 'dl', {}],
    ['dt', ['dl'], 'dt', {}, 'Term'],
    ['dd', ['dl'], 'dd', {}, 'Def'],
    ['table', [], 'table', {}],
    ['caption', ['table'], 'caption', {}, 'Caption'],
    ['th', ['table', 'tbody', 'tr'], 'th', {}, 'Header'],
    ['td', ['table', 'tbody', 'tr'], 'td', {}, 'Cell'],
  ],
  'Sectioning — the landmarks a service page is built from': [
    ['header', [], 'header', {}, 'Header'],
    ['footer', [], 'footer', {}, 'Footer'],
    ['main', [], 'main', {}, 'Main'],
    ['nav', [], 'nav', {}, 'Nav'],
    ['aside', [], 'aside', {}, 'Aside'],
    ['section', [], 'section', {}, 'Section'],
    ['article', [], 'article', {}, 'Article'],
    ['figure', [], 'figure', {}],
    ['figcaption', ['figure'], 'figcaption', {}, 'Caption'],
  ],
  'Media': [
    ['img', [], 'img', { alt: '', width: '40', height: '40' }],
    ['video', [], 'video', { width: '40', height: '40' }],
    ['audio', [], 'audio', { controls: '' }],
    ['iframe', [], 'iframe', { width: '40', height: '40' }],
  ],
}

/* The properties a design system has an opinion about. Deliberately excludes
 * geometry the CONTENT decides (width, height) — a <p> being wider inside a card
 * is a container talking, not a treatment. */
const PROPS = [
  'fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'color',
  'backgroundColor', 'backgroundImage', 'borderTopWidth', 'borderTopColor', 'borderTopStyle',
  'borderRadius', 'boxShadow', 'paddingTop', 'paddingLeft', 'marginTop', 'marginBottom',
  'appearance', 'outlineColor', 'textDecorationLine', 'minHeight',
]

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto('http://localhost:5173/app', { waitUntil: 'networkidle' })
await page.waitForTimeout(700)

const result = await page.evaluate(async ({ SURFACE, PROPS }) => {
  /* THE CONTROL: a same-origin iframe with no stylesheet at all. Its computed
   * styles are the user agent's, which is the only honest baseline — comparing
   * against a hard-coded table of "browser defaults" would be a mirror, and a
   * mirror is how every other meter in this repo has gone wrong. */
  const frame = document.createElement('iframe')
  frame.style.cssText = 'position:absolute;left:-9999px;width:800px;height:400px;border:0'
  document.body.appendChild(frame)
  await new Promise((r) => { frame.onload = r; frame.src = 'about:blank'; setTimeout(r, 200) })
  const fdoc = frame.contentDocument

  const host = document.querySelector('.cockpit-preview') ?? document.querySelector('.app') ?? document.body
  const stage = document.createElement('div')
  stage.style.cssText = 'position:absolute;left:-9999px;top:0'
  host.appendChild(stage)

  const build = (doc, root, chain, tag, attrs, text) => {
    let parent = root
    for (const c of chain) { const n = doc.createElement(c); parent.appendChild(n); parent = n }
    const el = doc.createElement(tag)
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v)
    if (text) el.appendChild(doc.createTextNode(text))
    parent.appendChild(el)
    return el
  }
  const clear = (n) => { while (n.firstChild) n.removeChild(n.firstChild) }

  /* ⚠️ THE AMBIENT DIFFERENCE, SUBTRACTED. The first run said 100% of the
   * platform is styled, which is impossible data and therefore a statement about
   * the meter. The kit sets a font and a colour on its root, those INHERIT to
   * every element, and border-top-color / outline-color follow currentColor — so
   * every element differed on the same six properties and none of it was a
   * treatment. It was the page talking.
   *
   * Rather than hand-maintain a list of inherited properties (a mirror, and the
   * mirror is how every meter here has gone wrong), measure a control we
   * certainly do not style — a bare <div> and <span> — and subtract whatever
   * THEY differ on. What remains is addressed to the element itself. */
  const ambient = new Set()
  for (const t of ['div', 'span']) {
    clear(fdoc.body); clear(stage)
    const a = build(fdoc, fdoc.body, [], t, {}, 'x')
    const b = build(document, stage, [], t, {}, 'x')
    const ca = fdoc.defaultView.getComputedStyle(a)
    const cb = getComputedStyle(b)
    for (const p of PROPS) if (ca[p] !== cb[p]) ambient.add(p)
  }

  const out = { _ambient: [...ambient] }
  for (const [group, items] of Object.entries(SURFACE)) {
    out[group] = []
    for (const [label, chain, tag, attrs, text] of items) {
      clear(fdoc.body); clear(stage)
      const a = build(fdoc, fdoc.body, chain, tag, attrs, text)
      const b = build(document, stage, chain, tag, attrs, text)
      const ca = fdoc.defaultView.getComputedStyle(a)
      const cb = getComputedStyle(b)
      const all = PROPS.filter((p) => ca[p] !== cb[p])
      const changed = all.filter((p) => !ambient.has(p))
      out[group].push({ tag: label, styled: changed.length > 0, changed, ambientOnly: all.length > 0 && changed.length === 0 })
    }
  }
  clear(stage); stage.remove(); frame.remove()
  return out
}, { SURFACE, PROPS })

await browser.close()

if (JSON_OUT) { console.log(JSON.stringify(result, null, 2)); process.exit(0) }

let total = 0
let styled = 0
const untouched = []
console.log('audit:platform-floor — every element built twice: inside the kit, and in a bare')
console.log('iframe with no stylesheet. A difference is a treatment; no difference is default.\n')
console.log(`  Ambient (inherited from the kit root, subtracted from every element):`)
console.log(`    ${result._ambient.join(' · ')}\n`)
for (const [group, items] of Object.entries(result)) {
  if (group === '_ambient') continue
  const n = items.filter((i) => i.styled).length
  total += items.length
  styled += n
  const bare = items.filter((i) => !i.styled).map((i) => i.tag)
  console.log(`  ${group}\n    ${n}/${items.length} touched`)
  if (bare.length) { console.log(`    ⛔ browser default: ${bare.join(' · ')}`); untouched.push(...bare) }
  console.log()
}
console.log('════════════════════════════════════════════════════════════════')
console.log(`  ${styled} of ${total} platform elements have a treatment — ${Math.round((styled / total) * 100)}%`)
console.log(`  ${untouched.length} render as browser default INSIDE our own kit.`)
console.log()
console.log('  Each one is a place where a consumer writing correct semantic HTML — the')
console.log('  consumer we are selling to — gets a browser default beside our components.')
console.log('  That mismatch reads as "ugly" before any question of taste comes up.')
