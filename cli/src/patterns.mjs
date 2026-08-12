/**
 * Shared extraction patterns for `check` and `audit`.
 *
 * `check` asks "does this line VIOLATE the contract"; `audit` asks "what values
 * does this codebase USE, and how often". Same regexes, two consumers — so the
 * two commands can never disagree about what a radius is.
 *
 * Zero dependencies (Node ≥18 built-ins only), and NO Node imports at all: the
 * browser shell (PR 3) bundles this file as-is.
 *
 * ── What lives here ──────────────────────────────────────────────────────────
 *   GRID                the 4px design grid (lifted from check.mjs)
 *   AUDIT_SCAN_EXT      audit's own extension list — WIDER than check's
 *   extractCss()        values out of CSS/SCSS/LESS declarations
 *   extractClassAttrs() values out of Tailwind class attributes
 *   extractInline()     values out of JSX inline style={{ }}
 *   countUnreadable()   the styled-components / dynamic-className blind spots
 *
 * Every extractor returns *usage events* — one per APPLICATION of a value, not
 * one per distinct value. That distinction is the whole basis of the score
 * (see AUDIT-HEURISTIC.md §2.1): 8 radii where one is used 200× is one system
 * with noise; 8 radii used equally is eight systems.
 */

/* The 4px design grid — spacing literals must land on it (or use --k-s-*). */
export const GRID = 4

/**
 * Audit's file list. DELIBERATELY WIDER than check's `SCAN_EXT`: Tailwind
 * classes also live in `.ts`/`.js` (cva variants, class maps, clsx helpers,
 * constants) — exactly where a SHARED button style is defined. Missing those
 * biases the audit toward sprawl and silently deflates `parsed`.
 *
 * check.mjs keeps its own narrower list on purpose: widening a shipped, tested
 * verifier's file discovery changes its behaviour. Two constants, one file,
 * explicit difference.
 */
export const AUDIT_SCAN_EXT = /\.(css|scss|less|html|jsx|tsx|vue|svelte|astro|ts|js|mts|cts)$/

/** Build/tooling files that would pollute the value distributions (a Tailwind
 *  config's theme is a DECLARATION of a system, not a usage of one). */
export const AUDIT_SKIP_FILE =
  /(^|[/\\])(uicockpit\.tokens\.css|.*\.contract\.json|.*\.config\.(js|ts|mjs|cjs)|.*\.d\.ts|vite\.config\..*|next\.config\..*)$/

/* ───────────────────────── Tailwind default scales ─────────────────────────
 * Resolution with a fallback: no tailwind.config found → these defaults. That
 * is almost always right, because a drifting repo rarely has a carefully tuned
 * config (AUDIT-HEURISTIC.md §4). */

export const TW_RADIUS = {
  none: '0px', sm: '2px', DEFAULT: '4px', md: '6px', lg: '8px',
  xl: '12px', '2xl': '16px', '3xl': '24px', full: '9999px',
}

export const TW_SHADOW = {
  none: 'none', sm: '0 1px 2px rgb(0 0 0 / .05)', DEFAULT: '0 1px 3px rgb(0 0 0 / .1)',
  md: '0 4px 6px rgb(0 0 0 / .1)', lg: '0 10px 15px rgb(0 0 0 / .1)',
  xl: '0 20px 25px rgb(0 0 0 / .1)', '2xl': '0 25px 50px rgb(0 0 0 / .25)',
  inner: 'inset 0 2px 4px rgb(0 0 0 / .05)',
}

export const TW_TEXT = {
  xs: '12px', sm: '14px', base: '16px', lg: '18px', xl: '20px', '2xl': '24px',
  '3xl': '30px', '4xl': '36px', '5xl': '48px', '6xl': '60px', '7xl': '72px',
  '8xl': '96px', '9xl': '128px',
}

/** Tailwind pairs a default line-height with each size — part of the triplet. */
export const TW_TEXT_LH = {
  xs: '1rem', sm: '1.25rem', base: '1.5rem', lg: '1.75rem', xl: '1.75rem',
  '2xl': '2rem', '3xl': '2.25rem', '4xl': '2.5rem', '5xl': '1', '6xl': '1',
  '7xl': '1', '8xl': '1', '9xl': '1',
}

export const TW_WEIGHT = {
  thin: '100', extralight: '200', light: '300', normal: '400', medium: '500',
  semibold: '600', bold: '700', extrabold: '800', black: '900',
}

export const TW_LEADING = {
  none: '1', tight: '1.25', snug: '1.375', normal: '1.5', relaxed: '1.625', loose: '2',
  3: '.75rem', 4: '1rem', 5: '1.25rem', 6: '1.5rem', 7: '1.75rem',
  8: '2rem', 9: '2.25rem', 10: '2.5rem',
}

/** The `text-*` values that are SIZES, so `text-sm` isn't read as a colour. */
const TEXT_SIZE_KEYS = new Set(Object.keys(TW_TEXT))
/** Non-colour `text-*` utilities that must not be read as colours either. */
const TEXT_NON_COLOR = new Set([
  'left', 'center', 'right', 'justify', 'start', 'end',
  'wrap', 'nowrap', 'balance', 'pretty', 'ellipsis', 'clip',
  'transparent', 'current', 'inherit',
])

/** Tailwind's numeric spacing scale: 1 unit = 4px (`p-4` → 16px).
 *  `auto` and `full` are LAYOUT decisions (`mx-auto` centres a box, it does not
 *  choose a rhythm) — returning them would inflate the spacing distribution with
 *  values nobody picked off a scale. */
export function twSpace(raw) {
  if (raw === 'px') return '1px'
  if (raw === 'auto' || raw === 'full') return null
  const n = Number(raw)
  return Number.isFinite(n) ? `${n * 4}px` : null
}

/** The Tailwind grey ramps — three of these side by side is the classic AI tell. */
export const TW_GRAY_RAMPS = ['gray', 'slate', 'zinc', 'neutral', 'stone']

/** Does this class token look like a Tailwind utility? Used only to COUNT them
 *  for the detected-stack summary, never to score — a package.json entry proves
 *  an install, this proves people actually write them. */
export const UTILITY_RX = new RegExp(
  '^(?:[\\w-]+:)*(?:' +
  'p|m|gap|space|w|h|min|max|inset|top|right|bottom|left|z|order|col|row|basis|' +
  'text|font|leading|tracking|bg|border|rounded|shadow|ring|outline|opacity|' +
  'flex|grid|items|justify|content|self|place|object|aspect|overflow|' +
  'transition|duration|ease|animate|translate|scale|rotate|cursor|select|' +
  'divide|backdrop|filter|blur|truncate|sr|container|block|inline|hidden|absolute|relative|fixed|sticky' +
  ')(?:-[\\w./[\\]#%()-]+)?$')

/* ─────────────────────────────── helpers ─────────────────────────────────── */

/** Map a padding/margin shorthand onto its sides, so `padding: 8px 12px`
 *  becomes four events and not one. Per-side is required by the spec: a
 *  value used on one side is a different decision from the same value on four. */
const SIDES = ['top', 'right', 'bottom', 'left']
export function expandBox(parts) {
  const p = parts.filter(Boolean)
  if (p.length === 0) return []
  if (p.length === 1) return SIDES.map((s) => [s, p[0]])
  if (p.length === 2) return [['top', p[0]], ['right', p[1]], ['bottom', p[0]], ['left', p[1]]]
  if (p.length === 3) return [['top', p[0]], ['right', p[1]], ['bottom', p[2]], ['left', p[1]]]
  return [['top', p[0]], ['right', p[1]], ['bottom', p[2]], ['left', p[3]]]
}

/** Normalise a value for grouping: collapse whitespace, lowercase, drop a
 *  trailing `!important`. Keeps `#FFF` and `#fff` from counting as two systems. */
export const norm = (v) => String(v).trim().toLowerCase().replace(/\s+/g, ' ').replace(/\s*!important$/, '')

/** Does this value go through the design system rather than around it? */
const isTokenRef = (v) => /var\(\s*--/.test(v)

const COLOR_RX = /#[0-9a-fA-F]{3,8}\b|\brgba?\([^)]*\)|\bhsla?\([^)]*\)|\boklch\([^)]*\)|\blab\([^)]*\)/g

/** An event: one application of one value. `at` carries file+line+col because a
 *  codemod (tier 2) cannot act on "appears in Button.tsx". */
const ev = (dim, value, at, opts = {}) => ({
  dim,
  value: norm(value),
  role: opts.role ?? null,
  side: opts.side ?? null,
  tokenized: Boolean(opts.tokenized),
  arbitrary: Boolean(opts.arbitrary),
  source: opts.source ?? 'css',
  at,
})

/* ───────────────────────────── CSS extraction ─────────────────────────────── */

/** Blank out comments while preserving newlines, so line numbers stay true. */
const blankComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '))

/**
 * Pull usage events out of a CSS/SCSS/LESS source.
 *
 * Type is collected PER RULE BLOCK as a font-size/line-height/weight triplet —
 * `16px/1.5/400` and `16px/1.2/600` are two different typographic decisions, and
 * counting only font-size understates type sprawl by roughly 2×.
 */
export function extractCss(path, content) {
  const events = []
  const src = blankComments(content)
  const lineOf = (idx) => src.slice(0, idx).split('\n').length

  // Rule blocks — needed for the type triplet; declarations are scanned inside.
  for (const rule of src.matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
    const body = rule[2]
    const bodyStart = rule.index + rule[1].length + 1
    const decls = []
    for (const d of body.matchAll(/([-\w]+)\s*:\s*([^;]+)(;|$)/g)) {
      decls.push({ prop: d[1].toLowerCase(), value: d[2].trim(), at: bodyStart + d.index })
    }
    const type = { size: null, lh: null, weight: null, at: null, tokenized: false }

    for (const { prop, value, at } of decls) {
      const line = lineOf(at)
      const loc = { file: path, line, col: 1 }
      const tokenized = isTokenRef(value)

      // A custom-property DEFINITION is the token source, not a usage.
      if (prop.startsWith('--')) continue

      if (prop === 'border-radius' || /^border-(top|bottom)-(left|right)-radius$/.test(prop)) {
        for (const part of value.split(/\s+/)) {
          if (/^\d|^var\(|^\./.test(part)) events.push(ev('radius', part, loc, { tokenized, source: 'css' }))
        }
      } else if (prop === 'box-shadow') {
        if (norm(value) !== 'none') events.push(ev('shadow', value, loc, { tokenized, source: 'css' }))
      } else if (prop === 'font-size') {
        type.size = value; type.at = type.at ?? loc; type.tokenized = type.tokenized || tokenized
      } else if (prop === 'line-height') {
        type.lh = value; type.at = type.at ?? loc
      } else if (prop === 'font-weight') {
        type.weight = value; type.at = type.at ?? loc
      } else if (/^(padding|margin)$/.test(prop)) {
        for (const [side, v] of expandBox(value.split(/\s+/))) {
          events.push(ev('spacing', v, loc, { side, tokenized, source: 'css' }))
        }
      } else if (/^(padding|margin)-(top|right|bottom|left)$/.test(prop)) {
        events.push(ev('spacing', value, loc, { side: prop.split('-')[1], tokenized, source: 'css' }))
      } else if (/^(gap|row-gap|column-gap)$/.test(prop)) {
        for (const v of value.split(/\s+/)) events.push(ev('spacing', v, loc, { side: 'gap', tokenized, source: 'css' }))
      } else if (prop === 'color') {
        pushColors(events, value, loc, 'fg', tokenized)
      } else if (/^(background|background-color)$/.test(prop)) {
        pushColors(events, value, loc, 'bg', tokenized)
      } else if (/^border(-(top|right|bottom|left))?(-color)?$/.test(prop) || prop === 'outline-color') {
        pushColors(events, value, loc, 'border', tokenized)
      }
    }

    if (type.size) {
      const triplet = `${norm(type.size)}/${type.lh ? norm(type.lh) : 'auto'}/${type.weight ? norm(type.weight) : 'auto'}`
      events.push(ev('type', triplet, type.at, { tokenized: type.tokenized, source: 'css' }))
    }
  }

  return events
}

function pushColors(events, value, loc, role, tokenized) {
  if (tokenized) {
    for (const m of value.matchAll(/var\(\s*(--[\w-]+)/g)) {
      events.push(ev('color', m[1], loc, { role, tokenized: true, source: 'css' }))
    }
    return
  }
  for (const m of value.matchAll(COLOR_RX)) {
    events.push(ev('color', m[0], loc, { role, tokenized: false, source: 'css' }))
  }
}

/* ────────────────────── Tailwind class-attribute extraction ────────────────
 * NET-NEW for the audit: check.mjs only reads CSS for these dimensions
 * (`check.mjs:106` bails on non-CSS), so nothing here can be reused from it. */

/** Every `class`/`className="…"` string literal, with its line. */
export function classAttrs(path, content) {
  const out = []
  const lines = content.split('\n')
  for (let i = 0; i < lines.length; i++) {
    for (const m of lines[i].matchAll(/class(?:Name)?\s*=\s*(?:"([^"]*)"|'([^']*)'|\{`([^`]*)`\})/g)) {
      const raw = m[1] ?? m[2] ?? m[3] ?? ''
      // A template literal with an interpolation is only partly readable; we
      // take the static classes and count the file as partly-unreadable
      // elsewhere (countUnreadable).
      out.push({ classes: raw.split(/\s+/).filter(Boolean), at: { file: path, line: i + 1, col: m.index + 1 } })
    }
  }
  return out
}

/** Strip Tailwind variant prefixes (`hover:`, `md:`, `dark:`) — a variant is the
 *  same decision applied conditionally, not a new value. */
const bare = (c) => {
  const i = c.lastIndexOf(':')
  return i === -1 ? c : c.slice(i + 1)
}

/** Arbitrary value: `p-[13px]`, `bg-[#f3f4f6]`. Each one is a DELIBERATE step
 *  outside the system — the cheapest strong signal in the whole design. */
const ARBITRARY_RX = /^([a-z][a-z-]*)-\[([^\]]+)\]$/

/**
 * Turn one element's class list into usage events. Type is emitted as a triplet
 * per element (size + leading + weight), mirroring the CSS path.
 */
export function extractClasses(classes, at) {
  const events = []
  let size = null, lh = null, weight = null, sizeTokenized = true

  for (const rawCls of classes) {
    const c = bare(rawCls)
    const arb = c.match(ARBITRARY_RX)
    const prefix = arb ? arb[1] : null
    const arbVal = arb ? arb[2] : null

    // ── radius
    // Anchored, so backtracking resolves the collision between the side suffix
    // and the size key: in `rounded-lg` the `-l` must NOT be eaten as the "left"
    // side, leaving a meaningless `g`. Anchoring on `$` forces the engine to
    // give the side group back and read `lg` as the size.
    if (!arb && /^rounded(-|$)/.test(c)) {
      const m = c.match(/^rounded(?:-(t|r|b|l|tl|tr|br|bl|s|e|ss|se|es|ee))?(?:-(.+))?$/)
      if (m) {
        const v = TW_RADIUS[m[2] || 'DEFAULT']
        if (v) events.push(ev('radius', v, at, { tokenized: true, source: 'class' }))
        continue
      }
    }
    if (arb && /^rounded/.test(prefix)) {
      events.push(ev('radius', arbVal, at, { tokenized: false, arbitrary: true, source: 'class' })); continue
    }

    // ── shadow
    if (/^shadow(-|$)/.test(c) && !arb) {
      const key = c.replace(/^shadow-?/, '') || 'DEFAULT'
      const v = TW_SHADOW[key]
      if (v && v !== 'none') events.push(ev('shadow', v, at, { tokenized: true, source: 'class' }))
      continue
    }
    if (arb && prefix === 'shadow') {
      events.push(ev('shadow', arbVal, at, { tokenized: false, arbitrary: true, source: 'class' })); continue
    }

    // ── spacing (p/m/gap, per side)
    const sp = c.match(/^([pm])([xytrbl])?-(.+)$/) || c.match(/^(gap)(-[xy])?-(.+)$/)
    if (sp && !arb) {
      const kind = sp[1]
      const axis = (sp[2] || '').replace('-', '')
      const v = twSpace(sp[3])
      if (v) {
        const sides = kind === 'gap' ? ['gap']
          : axis === 'x' ? ['left', 'right'] : axis === 'y' ? ['top', 'bottom']
          : axis ? [{ t: 'top', r: 'right', b: 'bottom', l: 'left' }[axis]] : SIDES
        for (const side of sides) events.push(ev('spacing', v, at, { side, tokenized: true, source: 'class' }))
      }
      continue
    }
    if (arb && /^([pm][xytrbl]?|gap(-[xy])?)$/.test(prefix)) {
      events.push(ev('spacing', arbVal, at, { side: 'any', tokenized: false, arbitrary: true, source: 'class' }))
      continue
    }

    // ── type: size / leading / weight collected into one triplet
    if (arb && prefix === 'text' && /^\d|rem|px|em/.test(arbVal)) { size = arbVal; sizeTokenized = false; continue }
    if (!arb && /^text-/.test(c)) {
      const key = c.slice(5)
      if (TEXT_SIZE_KEYS.has(key)) { size = TW_TEXT[key]; lh = lh ?? TW_TEXT_LH[key]; continue }
      if (!TEXT_NON_COLOR.has(key)) {
        events.push(ev('color', key, at, { role: 'fg', tokenized: true, source: 'class' })); continue
      }
      continue
    }
    if (arb && prefix === 'text') {
      events.push(ev('color', arbVal, at, { role: 'fg', tokenized: false, arbitrary: true, source: 'class' })); continue
    }
    if (/^leading-/.test(c) && !arb) { lh = TW_LEADING[c.slice(8)] ?? lh; continue }
    if (/^font-/.test(c) && !arb) { weight = TW_WEIGHT[c.slice(5)] ?? weight; continue }

    // ── colour: bg / border
    if (!arb && /^bg-/.test(c)) {
      const key = c.slice(3)
      if (!/^(none|gradient|clip|origin|fixed|local|scroll|repeat|no|center|cover|contain|top|bottom|left|right|auto)/.test(key)) {
        events.push(ev('color', key, at, { role: 'bg', tokenized: true, source: 'class' }))
      }
      continue
    }
    if (arb && prefix === 'bg') {
      events.push(ev('color', arbVal, at, { role: 'bg', tokenized: false, arbitrary: true, source: 'class' })); continue
    }
    if (!arb && /^border-/.test(c)) {
      const key = c.slice(7)
      // `border-2` / `border-t` are widths and sides, not colours.
      if (!/^\d+$/.test(key) && !/^(t|r|b|l|x|y|s|e|solid|dashed|dotted|double|none|hidden|collapse|separate|spacing)$/.test(key)) {
        events.push(ev('color', key, at, { role: 'border', tokenized: true, source: 'class' }))
      }
      continue
    }
    if (arb && prefix === 'border') {
      events.push(ev('color', arbVal, at, { role: 'border', tokenized: false, arbitrary: true, source: 'class' })); continue
    }
  }

  if (size) {
    events.push(ev('type', `${norm(size)}/${lh ? norm(lh) : 'auto'}/${weight ? norm(weight) : 'auto'}`, at, {
      tokenized: sizeTokenized, source: 'class',
    }))
  }
  return events
}

/* ──────────────────────────── CSS Modules support ───────────────────────────
 * `className={styles.title}` is one of the two dominant React styling idioms,
 * and treating it as unreadable is wrong twice over: the VALUES behind it were
 * read (they live in the co-located `.module.css`, which we scan in full), and
 * counting the binding as a blind spot deflates `parsed` toward a FALSE refusal.
 * A real repo measured 72% purely because of this.
 *
 * Class names are qualified with the resolved module path, because CSS Modules
 * are file-scoped: `styles.button` in Card.module.css and in Modal.module.css
 * are two different treatments, and merging them would UNDERCOUNT exactly the
 * sprawl the audit exists to find.                                             */

/** `import styles from './Card.module.css'` → `{ styles: 'src/Card.module.css' }` */
export function cssModuleBindings(path, content) {
  const out = {}
  const rx = /import\s+(?:\*\s+as\s+)?([A-Za-z_$][\w$]*)\s+from\s+['"]([^'"]+\.module\.(?:css|scss|less))['"]/g
  for (const m of content.matchAll(rx)) out[m[1]] = resolveRelative(path, m[2])
  return out
}

/** Join an import specifier onto the importing file's directory. Non-relative
 *  specifiers (aliases like `@/styles/x.module.css`) fall back to the basename —
 *  imperfect, but better than dropping the element entirely. */
export function resolveRelative(fromFile, spec) {
  if (!spec.startsWith('.')) return spec.split('/').pop()
  const parts = fromFile.split(/[/\\]/).slice(0, -1)
  for (const seg of spec.split('/')) {
    if (seg === '.' || seg === '') continue
    if (seg === '..') parts.pop()
    else parts.push(seg)
  }
  return parts.join('/')
}

/** A module-scoped class reference, qualified by its module. */
export const qualify = (modulePath, name) => `${modulePath}#${name}`

const escapeRx = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Elements styled through a CSS-module binding. Handles the shapes that cover
 * essentially all real code:
 *   className={styles.a} · {styles['a']} · {cn(styles.a, styles.b)} · {`${styles.a} …`}
 * Returns the same `{classes, at}` shape as `classAttrs`, so callers can treat
 * both kinds of element identically.
 */
export function moduleClassAttrs(path, content, bindings) {
  const names = Object.keys(bindings)
  if (!names.length) return []
  const refRx = new RegExp(
    `\\b(${names.map(escapeRx).join('|')})(?:\\.([A-Za-z_$][\\w$]*)|\\[\\s*['"]([^'"]+)['"]\\s*\\])`, 'g')

  const out = []
  const lines = content.split('\n')
  for (let i = 0; i < lines.length; i++) {
    for (const attr of lines[i].matchAll(/class(?:Name)?\s*=\s*\{([^}]*)\}/g)) {
      const classes = []
      // Mask each module reference as it is consumed, so the literal sweep below
      // cannot also harvest the quoted key inside `styles['title']`.
      const masked = attr[1].replace(refRx, (whole, binding, dot, bracket) => {
        const name = dot ?? bracket
        if (name) classes.push(qualify(bindings[binding], name))
        return ' '.repeat(whole.length)
      })
      // Static strings can sit alongside the module refs inside cn(…).
      for (const lit of masked.matchAll(/['"]([^'"]+)['"]/g)) {
        for (const c of lit[1].split(/\s+/)) if (c && !/^[.#]/.test(c)) classes.push(c)
      }
      if (classes.length) out.push({ classes, at: { file: path, line: i + 1, col: attr.index + 1 } })
    }
  }
  return out
}

/* ─────────────────────── inline style={{ }} extraction ─────────────────────── */

const CAMEL = { borderRadius: 'border-radius', boxShadow: 'box-shadow', fontSize: 'font-size', lineHeight: 'line-height', fontWeight: 'font-weight', backgroundColor: 'background-color', borderColor: 'border-color', paddingTop: 'padding-top', paddingRight: 'padding-right', paddingBottom: 'padding-bottom', paddingLeft: 'padding-left', marginTop: 'margin-top', marginRight: 'margin-right', marginBottom: 'margin-bottom', marginLeft: 'margin-left' }

/** JSX `style={{ padding: 8, color: '#fff' }}` — very common in AI output. */
export function extractInline(path, content) {
  const events = []
  const lines = content.split('\n')
  for (let i = 0; i < lines.length; i++) {
    for (const block of lines[i].matchAll(/style\s*=\s*\{\{([^}]*)\}\}/g)) {
      const at = { file: path, line: i + 1, col: block.index + 1 }
      for (const d of block[1].matchAll(/([A-Za-z-]+)\s*:\s*(?:'([^']*)'|"([^"]*)"|([\d.]+))/g)) {
        const prop = CAMEL[d[1]] || d[1].replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)
        const rawV = d[2] ?? d[3] ?? d[4]
        const value = /^[\d.]+$/.test(rawV) ? `${rawV}px` : rawV
        if (prop === 'border-radius') events.push(ev('radius', value, at, { source: 'inline' }))
        else if (prop === 'box-shadow') events.push(ev('shadow', value, at, { source: 'inline' }))
        else if (prop === 'font-size') events.push(ev('type', `${norm(value)}/auto/auto`, at, { source: 'inline' }))
        else if (/^(padding|margin)(-(top|right|bottom|left))?$/.test(prop)) {
          const side = prop.split('-')[1] || 'all'
          events.push(ev('spacing', value, at, { side, source: 'inline' }))
        } else if (prop === 'gap') events.push(ev('spacing', value, at, { side: 'gap', source: 'inline' }))
        else if (prop === 'color') pushColors(events, value, at, 'fg', isTokenRef(value))
        else if (/^background/.test(prop)) pushColors(events, value, at, 'bg', isTokenRef(value))
        else if (/^border.*color$/.test(prop)) pushColors(events, value, at, 'border', isTokenRef(value))
      }
    }
  }
  return events
}

/* ──────────────────────────── the blind spots ────────────────────────────────
 * `parsed` must be honest or the whole audit is contestable (AUDIT-HEURISTIC.md
 * §4). Count what we KNOW we cannot read, per reason, and report it. */

export function countUnreadable(path, content, resolvedModuleElements = 0) {
  const reasons = {}
  const bump = (k, n) => { if (n > 0) reasons[k] = (reasons[k] || 0) + n }

  // styled-components / emotion: styled.div`…` and styled(Foo)`…`
  bump('styled-components', (content.match(/\bstyled(?:\.[a-zA-Z]+|\([^)]*\))\s*`/g) || []).length)
  // css`` template blocks with interpolation
  bump('css-in-js-interpolation', (content.match(/\bcss\s*`[^`]*\$\{/g) || []).length)
  // className={expr} that is NOT a plain string or a plain template literal —
  // minus the ones a CSS-module binding resolved, which ARE readable (their
  // values sit in the .module.css we scanned).
  bump('dynamic-classname',
    (content.match(/class(?:Name)?\s*=\s*\{(?!\s*`)[^}]*\}/g) || []).length - resolvedModuleElements)
  // template-literal classNames WITH interpolation (partly readable)
  bump('dynamic-classname', (content.match(/class(?:Name)?\s*=\s*\{`[^`]*\$\{/g) || []).length)
  // CSS modules composition
  bump('css-modules-composes', (content.match(/^\s*composes\s*:/gm) || []).length)

  return reasons
}

/* ───────────────── class → declarations, for rebuilding the wall ────────────
 * The button wall must SHOW the buttons, not list their class names. In a
 * Tailwind repo the classes carry the values, so `extractClasses` is enough. In
 * a plain-CSS repo they don't — the values live in the stylesheet we already
 * parsed. This builds the lookup that lets the report paint those buttons too.
 * Deliberately shallow: simple class selectors and one level of var().         */

const PAINT_PROPS = new Set([
  'background', 'background-color', 'color', 'border-radius', 'box-shadow',
  'padding', 'font-size', 'font-weight', 'border', 'border-color', 'border-width', 'line-height',
])

/**
 * `:root { --x: … }` custom properties, so `var(--x)` can be resolved once.
 *
 * Two things here are load-bearing, and both were caught by a wrong-looking wall:
 *  · the `(?:^|[{;])\s*` prefix — without it the regex also matches the
 *    `--primary` inside a BEM class name like `.btn--primary:hover`, so every
 *    such selector silently redefines a real token to garbage. Custom properties
 *    are only ever read from DECLARATION position.
 *  · the terminator is a LOOKAHEAD — consuming the `;` would eat the separator
 *    the next declaration needs as its own prefix, and the scan would then pick
 *    up only every other variable.
 */
export function extractCssVars(content) {
  const vars = {}
  for (const m of blankComments(content).matchAll(/(?:^|[{;])\s*(--[\w-]+)\s*:\s*([^;}]+)(?=[;}])/g)) {
    vars[m[1]] = m[2].trim()
  }
  return vars
}

/**
 * Map each class name to the paint-ish declarations of the rules it appears in.
 * Later rules win, which approximates the cascade closely enough for a swatch.
 */
export function extractClassStyles(content) {
  const out = {}
  const src = blankComments(content)
  for (const rule of src.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = rule[1]
    const body = rule[2]
    // Skip at-rules and anything with a pseudo-state — a hover colour is not
    // the resting appearance and would misrepresent the treatment.
    if (/^\s*@/.test(selector) || /:(hover|focus|active|disabled|checked)/.test(selector)) continue

    const decls = {}
    for (const d of body.matchAll(/([-\w]+)\s*:\s*([^;]+)(;|$)/g)) {
      const prop = d[1].toLowerCase()
      if (PAINT_PROPS.has(prop)) decls[prop] = d[2].trim()
    }
    if (!Object.keys(decls).length) continue

    for (const m of selector.matchAll(/\.(-?[A-Za-z_][\w-]*)/g)) {
      out[m[1]] = { ...(out[m[1]] || {}), ...decls }
    }
  }
  return out
}

/** Resolve one level of `var(--x)` against a variable map (with fallback). */
export function resolveVar(value, vars) {
  if (typeof value !== 'string') return value
  return value.replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^)]+))?\)/g, (_, name, fallback) =>
    vars[name] ?? (fallback ? fallback.trim() : ''))
}

/** Readable styling units in a file — the denominator half of `parsed`.
 *  `resolvedModuleElements` are CSS-module-bound elements we could resolve. */
export function countReadable(path, content, resolvedModuleElements = 0) {
  const isCss = /\.(css|scss|less)$/.test(path)
  if (isCss) return (blankComments(content).match(/\{[^{}]*\}/g) || []).length
  return (content.match(/class(?:Name)?\s*=\s*(?:"|'|\{`)/g) || []).length
    + (content.match(/style\s*=\s*\{\{/g) || []).length
    + resolvedModuleElements
}
