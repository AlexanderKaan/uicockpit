import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  Blend,
  CaseUpper,
  Check,
  Contrast,
  Copy,
  Download,
  FileCode,
  FileText,
  Gauge,
  Layers,
  Link2,
  Moon,
  MousePointerClick,
  Package,
  Palette,
  Ruler,
  ShieldCheck,
  Sidebar,
  Sparkles,
  Square,
  Sun,
  Type,
  X,
  Zap,
} from 'lucide-react'
import type { Config } from '../tokens/types'
import { encode } from '../state/hash'
import { buildTokens } from '../tokens/buildTokens'
import { auditContrast } from '../tokens/extras'
import { Seg } from '../panel/primitives/Seg'
import { genCss } from './genCss'
import { genTailwind } from './genTailwind'
import { genShadcn } from './genShadcn'
import { genContract } from './genContract'
import { genDesignMd } from './genDesignMd'
import { genSkill } from './genSkill'
import { zipSync } from './zip'

/** Base URL of the Live Kit CDN Worker (cockpit/worker). The stateless lane
 *  `${BASE}/k/<hash>.css` serves genCss(decode(hash)) — the full kit, byte-identical
 *  to the download. LIVE on Cloudflare at the branded custom domain. */
const KIT_CDN_BASE = 'https://kit.uicockpit.com'

type View = 'kit' | 'formats'

/* ── The "Other formats" drawer — the 3 that map to a real stack ──────────────
 * tokens.css · Tailwind v4 · shadcn/ui. (tokens.json + shadcn-registry were CUT:
 * niche / credibility-signal, low ICP use.) The headline values live as the hosted
 * <link> in the Use-this-kit view; this drawer is the eject-to-files path. */
type FmtId = 'css' | 'tailwind' | 'shadcn'
interface Fmt {
  id: FmtId
  label: string
  hint: string
  filename: string
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>
  generator: (cfg: Config) => string
}
const FORMATS: Fmt[] = [
  { id: 'css', label: 'tokens.css', hint: ':root + .dark, 60+ vars + recipes', filename: 'tokens.css', icon: FileCode, generator: genCss },
  { id: 'tailwind', label: 'Tailwind v4', hint: '@theme block, full system', filename: 'tailwind-theme.css', icon: Palette, generator: genTailwind },
  { id: 'shadcn', label: 'shadcn/ui', hint: '--background, --primary, …', filename: 'shadcn-globals.css', icon: Layers, generator: genShadcn },
]

/* ── The pack — named artifacts (the hosted link is the 1st, rendered as the hero).
 * design.md = the spec; the skill = the enforcement layer; contract.json bundled for
 * `uicockpit check`. A precomputed text + filename per row (so the same row renders
 * the agent-specific skill file). */
interface PackEntry {
  label: string
  hint: string
  filename: string
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>
  text: string
}

/* ── Agent picker — the skill body is agent-agnostic (genSkill); only the delivery
 * filename + any frontmatter differ per tool. */
type Agent = 'claude' | 'cursor' | 'windsurf' | 'generic'
const AGENTS: ReadonlyArray<{ id: Agent; cap: string }> = [
  { id: 'claude', cap: 'Claude' },
  { id: 'cursor', cap: 'Cursor' },
  { id: 'windsurf', cap: 'Windsurf' },
  { id: 'generic', cap: 'AGENTS.md' },
]
const AGENT_FILE: Record<Agent, string> = {
  claude: 'SKILL.md',
  cursor: '.cursor/rules/uicockpit.mdc',
  windsurf: '.windsurfrules',
  generic: 'AGENTS.md',
}
/** The skill file for a given agent: the shared body + the right filename and any
 *  tool-specific frontmatter (Claude skill metadata; Cursor .mdc always-apply). */
function skillFile(agent: Agent, cfg: Config): { filename: string; text: string } {
  const body = genSkill(cfg)
  if (agent === 'claude') {
    const fm = '---\nname: uicockpit-design-system\ndescription: Apply the configured UICockpit design system — token commandments + a verify loop. Use whenever building or restyling UI in this project.\n---\n\n'
    return { filename: AGENT_FILE.claude, text: fm + body }
  }
  if (agent === 'cursor') {
    const fm = '---\ndescription: UICockpit design-system rules\nalwaysApply: true\n---\n\n'
    return { filename: AGENT_FILE.cursor, text: fm + body }
  }
  return { filename: AGENT_FILE[agent], text: body }
}

/* === Install layer — framework + package-manager pickers ============
 * shadcn/create's lesson: don't just dump code, tell the user how to
 * adopt it in THEIR stack. */
type Framework = 'next' | 'vite' | 'astro' | 'laravel' | 'plain'
type Pm = 'pnpm' | 'npm' | 'yarn' | 'bun'

const FRAMEWORKS: ReadonlyArray<{ id: Framework; cap: string }> = [
  { id: 'next', cap: 'Next.js' },
  { id: 'vite', cap: 'Vite' },
  { id: 'astro', cap: 'Astro' },
  { id: 'laravel', cap: 'Laravel' },
  { id: 'plain', cap: 'Plain HTML' },
]
const PMS: ReadonlyArray<{ id: Pm; cap: string }> = [
  { id: 'pnpm', cap: 'pnpm' },
  { id: 'npm', cap: 'npm' },
  { id: 'yarn', cap: 'yarn' },
  { id: 'bun', cap: 'bun' },
]
const DLX: Record<Pm, string> = { pnpm: 'pnpm dlx', npm: 'npx', yarn: 'yarn dlx', bun: 'bunx' }
const ADD: Record<Pm, string> = { pnpm: 'pnpm add', npm: 'npm install', yarn: 'yarn add', bun: 'bun add' }

/* Where a global CSS file gets imported per framework. */
const CSS_IMPORT: Record<Framework, string> = {
  next: 'app/layout.tsx →  import "@/styles/tokens.css"',
  vite: 'src/main.tsx →  import "./tokens.css"',
  astro: 'src/layouts/Layout.astro →  import "../styles/tokens.css"',
  laravel: 'resources/css/app.css →  @import "./tokens.css";',
  plain: 'index.html →  <link rel="stylesheet" href="tokens.css">',
}

interface Install { steps: string[]; command?: string; showFramework: boolean }

function getInstall(fmt: FmtId, fw: Framework, pm: Pm): Install {
  switch (fmt) {
    case 'css':
      return {
        showFramework: true,
        steps: [
          'Save the file below as tokens.css in your project.',
          `Import it once at your app root — ${CSS_IMPORT[fw]}`,
          'Use the --k-* custom properties anywhere (or via the component recipes included).',
        ],
      }
    case 'tailwind':
      return {
        showFramework: true,
        command: `${ADD[pm]} tailwindcss @tailwindcss/vite`,
        steps: [
          'Install Tailwind v4 (command above) if you haven\'t already.',
          'Save the file below as theme.css — it starts with @import "tailwindcss".',
          `Import it at your app root — ${CSS_IMPORT[fw].replace('tokens.css', 'theme.css')}`,
          'Use utilities like bg-primary, text-muted, rounded-lg, shadow-md.',
        ],
      }
    case 'shadcn':
      return {
        showFramework: true,
        command: `${DLX[pm]} shadcn@latest init`,
        steps: [
          'Init shadcn (command above) if your project isn\'t set up yet.',
          fw === 'next'
            ? 'Replace app/globals.css with the file below.'
            : 'Replace your global stylesheet (the one with @import "tailwindcss") with the file below.',
          `Add components: ${DLX[pm]} shadcn@latest add button card input …`,
          'Every shadcn component now inherits this theme automatically.',
        ],
      }
  }
}

/** Download a generated string as a file. Shared by the pack rows + the formats drawer. */
function downloadText(text: string, filename: string) {
  const blob = new Blob([text], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

interface ExportModalProps {
  cfg: Config
  onClose: () => void
  onToast: (msg: string) => void
}

export function ExportModal({ cfg, onClose, onToast }: ExportModalProps) {
  const [view, setView] = useState<View>('kit')
  const [fmt, setFmt] = useState<FmtId>('css')
  const [agent, setAgent] = useState<Agent>('claude')
  const [framework, setFramework] = useState<Framework>('next')
  const [pm, setPm] = useState<Pm>('pnpm')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const NAV: ReadonlyArray<{ id: View; label: string; hint: string; icon: Fmt['icon'] }> = [
    { id: 'kit', label: 'Quick install', hint: 'One link + the agent pack', icon: Sparkles },
    { id: 'formats', label: 'Other formats', hint: 'tokens.css · Tailwind · shadcn', icon: FileCode },
  ]

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal__head">
          <div className="modal__title">Use this kit</div>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Close">
            <X size={16} strokeWidth={1.75} />
          </button>
        </div>
        <div className="modal__split">
          <nav className="modal__nav" role="tablist" aria-label="Export">
            {NAV.map((n) => {
              const Cmp = n.icon
              return (
                <button
                  key={n.id}
                  type="button"
                  role="tab"
                  aria-selected={n.id === view}
                  aria-label={n.label}
                  className={`modal__navitem ${n.id === view ? 'modal__navitem--on' : ''}`}
                  onClick={() => setView(n.id)}
                >
                  <span className="modal__navitem-icon">
                    <Cmp size={15} strokeWidth={1.75} />
                  </span>
                  <span className="modal__navitem-body">
                    <span className="modal__navitem-label">{n.label}</span>
                    <span className="modal__navitem-hint">{n.hint}</span>
                  </span>
                </button>
              )
            })}
          </nav>
          <div className="modal__pane">
            {view === 'kit' ? (
              <KitPane cfg={cfg} agent={agent} onAgent={setAgent} onToast={onToast} onEject={() => setView('formats')} />
            ) : (
              <FormatsPane
                cfg={cfg}
                fmt={fmt}
                onFmt={setFmt}
                framework={framework}
                pm={pm}
                onFramework={setFramework}
                onPm={setPm}
                onToast={onToast}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── The "Other formats" drawer — the eject-to-files path. Sub-picker over the 3
 * stack formats + the install guide + the code. Stack-aware via the framework picker. */
function FormatsPane({
  cfg,
  fmt,
  onFmt,
  framework,
  pm,
  onFramework,
  onPm,
  onToast,
}: {
  cfg: Config
  fmt: FmtId
  onFmt: (f: FmtId) => void
  framework: Framework
  pm: Pm
  onFramework: (f: Framework) => void
  onPm: (p: Pm) => void
  onToast: (msg: string) => void
}) {
  const current = FORMATS.find((f) => f.id === fmt)!
  const code = useMemo(() => current.generator(cfg), [current, cfg])

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      onToast(`${current.filename} copied`)
    } catch {
      onToast('Copy failed — select & copy manually')
    }
  }
  const onDownload = () => {
    downloadText(code, current.filename)
    onToast(`${current.filename} downloaded`)
  }

  return (
    <div className="export-fmt">
      <Seg options={FORMATS.map((f) => ({ id: f.id, cap: f.label }))} value={fmt} onChange={onFmt} />
      <p className="export-fmt__hint">{current.hint}</p>
      <div className="modal__actions">
        <span className="modal__filename">{current.filename}</span>
        <div className="modal__btn-row">
          <button type="button" className="modal__btn" onClick={onCopy}>
            <Copy size={13} strokeWidth={1.75} />
            Copy
          </button>
          <button type="button" className="modal__btn modal__btn--primary" onClick={onDownload}>
            <Download size={13} strokeWidth={1.75} />
            Download
          </button>
        </div>
      </div>
      <InstallGuide fmt={fmt} framework={framework} pm={pm} onFramework={onFramework} onPm={onPm} onToast={onToast} />
      <pre className="modal__code">{code}</pre>
    </div>
  )
}

/** Install guide — the "how do I actually use this" layer for the formats drawer. */
function InstallGuide({
  fmt,
  framework,
  pm,
  onFramework,
  onPm,
  onToast,
}: {
  fmt: FmtId
  framework: Framework
  pm: Pm
  onFramework: (f: Framework) => void
  onPm: (p: Pm) => void
  onToast: (msg: string) => void
}) {
  const info = getInstall(fmt, framework, pm)

  const copyCommand = async () => {
    if (!info.command) return
    try {
      await navigator.clipboard.writeText(info.command)
      onToast('Command copied')
    } catch {
      onToast('Copy failed — select & copy manually')
    }
  }

  return (
    <div className="install">
      <div className="install__head">
        <span className="install__title">Install</span>
        {info.showFramework && <Seg options={FRAMEWORKS} value={framework} onChange={onFramework} />}
      </div>
      <ol className="install__steps">
        {info.steps.map((s, i) => (
          <li key={i} className="install__step">{s}</li>
        ))}
      </ol>
      {info.command && (
        <div className="install__cmd">
          <div className="install__pm">
            <Seg options={PMS} value={pm} onChange={onPm} />
          </div>
          <div className="install__cmd-row">
            <code className="install__cmd-text">{info.command}</code>
            <button type="button" className="modal__btn" onClick={copyCommand}>
              <Copy size={13} strokeWidth={1.75} />
              Copy
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* Value→display-label maps, mirroring the panel's control captions so the recap
 * reads exactly like what the user picked. Unknown values fall back to raw. */
const CHOICE_CAP: Record<string, Record<string, string>> = {
  colorTheme: { mono: 'Mono', cobalt: 'Cobalt', sky: 'Sky', teal: 'Teal', jade: 'Jade', indigo: 'Indigo', violet: 'Violet', coral: 'Coral', rose: 'Rose', ember: 'Ember' },
  palette: { pastel: 'Pastel', bright: 'Bright', vivid: 'Vivid' },
  neutral: { auto: 'Auto (from brand)', cool: 'Cool', neutral: 'Neutral', warm: 'Warm' },
  typeScale: { sm: 'Small', md: 'Medium', lg: 'Large', xl: 'Extra large' },
  scale: { compact: 'Compact', default: 'Default', comfortable: 'Comfortable' },
  radius: { none: 'None', subtle: 'Subtle', soft: 'Soft', round: 'Round' },
  buttonShape: { match: 'Match', none: 'None', subtle: 'Subtle', soft: 'Soft', round: 'Round', pill: 'Pill' },
  motion: { none: 'None', snappy: 'Snappy', smooth: 'Smooth', playful: 'Playful' },
  motionTempo: { snappy: 'Snappy', normal: 'Normal', generous: 'Generous' },
  iconSet: { hairline: 'Iconoir', line: 'Lucide', rounded: 'Phosphor', bold: 'Phosphor Bold', solid: 'Heroicons' },
  surfaceDepth: { flat: 'Flat', soft: 'Soft', deep: 'Deep' },
  surface: { outlined: 'Outlined', filled: 'Filled', plain: 'Plain' },
  borders: { faint: 'Faint', subtle: 'Subtle', medium: 'Medium', strong: 'Strong' },
}

/** Build the "your choices" recap — one entry per setting the user configured. */
function buildChoices(cfg: Config, tk: ReturnType<typeof buildTokens>): Array<{ icon: ReactNode; label: string; value: string }> {
  const cap = (k: string, v: string) => CHOICE_CAP[k]?.[v] ?? v
  const sw = (hex: string): ReactNode => <span className="export-ov__swatch" style={{ background: hex }} />
  const ic = (El: typeof Palette): ReactNode => <El size={15} strokeWidth={1.9} />
  return [
    { icon: ic(Palette), label: 'Color theme', value: cap('colorTheme', cfg.colorTheme) },
    { icon: sw(tk.primaryHex), label: 'Brand color', value: tk.primaryHex.toUpperCase() },
    { icon: ic(Blend), label: 'Palette', value: cap('palette', cfg.palette) },
    { icon: ic(Contrast), label: 'Neutrals', value: cap('neutral', cfg.neutral) },
    { icon: cfg.mode === 'dark' ? ic(Moon) : ic(Sun), label: 'Mode', value: cfg.mode === 'dark' ? 'Dark' : 'Light' },
    { icon: ic(Type), label: 'Display font', value: cfg.fontDisplay },
    { icon: ic(Type), label: 'Body font', value: cfg.fontBody },
    { icon: ic(CaseUpper), label: 'Text size', value: cap('typeScale', cfg.typeScale) },
    { icon: ic(Ruler), label: 'Scale', value: cap('scale', cfg.scale) },
    { icon: ic(Square), label: 'Corner radius', value: cap('radius', cfg.radius) },
    { icon: ic(MousePointerClick), label: 'Button radius', value: cap('buttonShape', cfg.buttonShape) },
    { icon: ic(Zap), label: 'Motion', value: cap('motion', cfg.motion) },
    { icon: ic(Gauge), label: 'Tempo', value: cap('motionTempo', cfg.motionTempo) },
    { icon: ic(Sparkles), label: 'Icons', value: cap('iconSet', cfg.iconSet) },
    { icon: ic(Layers), label: 'Elevation', value: cap('surfaceDepth', cfg.surfaceDepth) },
    { icon: ic(Sidebar), label: 'Surface', value: cap('surface', cfg.surface) },
    { icon: ic(Square), label: 'Border', value: cap('borders', cfg.borders) },
  ]
}

/** A pack row — one named artifact with copy + download. */
function PackRow({ entry, onToast }: { entry: PackEntry; onToast: (m: string) => void }) {
  const Cmp = entry.icon
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(entry.text)
      onToast(`${entry.filename} copied`)
    } catch {
      onToast('Copy failed — select & copy manually')
    }
  }
  const download = () => {
    downloadText(entry.text, entry.filename)
    onToast(`${entry.filename} downloaded`)
  }
  return (
    <div className="export-pack__row">
      <span className="export-pack__ic" aria-hidden="true"><Cmp size={16} strokeWidth={1.75} /></span>
      <div className="export-pack__body">
        <div className="export-pack__label">{entry.label} <span className="export-pack__file">{entry.filename}</span></div>
        <div className="export-pack__hint">{entry.hint}</div>
      </div>
      <div className="export-pack__actions">
        <button type="button" className="modal__btn" onClick={copy} aria-label={`Copy ${entry.filename}`}>
          <Copy size={13} strokeWidth={1.75} />
        </button>
        <button type="button" className="modal__btn" onClick={download} aria-label={`Download ${entry.filename}`}>
          <Download size={13} strokeWidth={1.75} />
        </button>
      </div>
    </div>
  )
}

/** Use-this-kit pane — the install experience. Hosted <link> as the headline, then
 *  the pack (design.md · skill · contract), then "what's in your kit" (choices +
 *  WCAG + recipes). */
function KitPane({
  cfg,
  agent,
  onAgent,
  onToast,
  onEject,
}: {
  cfg: Config
  agent: Agent
  onAgent: (a: Agent) => void
  onToast: (msg: string) => void
  onEject: () => void
}) {
  const tk = useMemo(() => buildTokens(cfg), [cfg])
  const a11y = useMemo(() => auditContrast(tk), [tk])
  const a11yPass = a11y.filter((p) => p.passes).length
  const a11yTotal = a11y.length
  const choices = buildChoices(cfg, tk)

  // The pack artifacts — precomputed once per cfg/agent. The skill row's filename +
  // frontmatter follow the picked agent; design.md + contract.json are agent-agnostic.
  const skill = useMemo(() => skillFile(agent, cfg), [agent, cfg])
  const entries: PackEntry[] = useMemo(
    () => [
      { label: 'design.md', hint: 'The spec — values, rules + your AI-agent appendix', filename: 'design.md', icon: FileText, text: genDesignMd(cfg) },
      { label: 'Agent rules', hint: 'The enforcement layer — always / never + verify loop', filename: skill.filename, icon: Sparkles, text: skill.text },
      { label: 'contract.json', hint: 'Bundled — what `npx uicockpit check` verifies', filename: 'uicockpit.contract.json', icon: ShieldCheck, text: genContract(cfg) },
    ],
    [cfg, skill],
  )

  // The hosted-kit CDN <link> — the front door. Built from the SAME share-key the
  // app uses (encode(cfg)); the Worker serves genCss(decode(key)) at this URL,
  // byte-identical to the download.
  const kitHref = `${KIT_CDN_BASE}/k/${encode(cfg)}.css`
  const kitSnippet = `<link rel="stylesheet" href="${kitHref}">`
  const copyKit = async () => {
    try {
      await navigator.clipboard.writeText(kitSnippet)
      onToast('Kit <link> copied')
    } catch {
      onToast('Copy failed — select & copy manually')
    }
  }

  // "Download pack" — one zip: the link snippet + design.md + the agent skill file
  // (right filename/frontmatter) + tokens.css + contract.json.
  const downloadPack = () => {
    const blob = zipSync([
      { name: 'kit-link.txt', text: `${kitSnippet}\n` },
      { name: 'design.md', text: entries[0]!.text },
      { name: skill.filename, text: skill.text },
      { name: 'tokens.css', text: genCss(cfg) },
      { name: 'uicockpit.contract.json', text: entries[2]!.text },
    ])
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'uicockpit-kit.zip'
    a.click()
    URL.revokeObjectURL(url)
    onToast('Pack downloaded (.zip)')
  }

  return (
    <div className="export-ov">
      <div className="export-ov__head">
        <p className="export-ov__sub">
          Two pieces, both built from the {choices.length} choices you made: a{' '}
          <strong>link</strong> so your app wears the kit, and a <strong>pack</strong> so
          your AI agent builds new screens in it.
        </p>
      </div>

      {/* CDN hero — the front door. One link, the whole kit. */}
      <div className="export-cdn">
        <div className="export-cdn__head">
          <span className="export-cdn__ic" aria-hidden="true"><Link2 size={15} strokeWidth={1.9} /></span>
          <span className="export-cdn__label">Step 1 · Link — your app wears the kit</span>
          <span className="export-cdn__live"><span className="export-cdn__live-dot" />Live</span>
        </div>
        <div className="export-cdn__snippet">
          <code className="export-cdn__code">{kitSnippet}</code>
          <button type="button" className="export-cdn__copy" onClick={copyKit}>
            <Copy size={13} strokeWidth={1.9} />
            Copy link
          </button>
        </div>
        <p className="export-cdn__note">
          Serves the full kit (tokens + component recipes) — byte-identical to the
          download. No account; eject to files anytime.
        </p>
      </div>

      {/* The pack — the agent install. design.md (spec) + agent rules (enforcement),
          contract.json bundled for `uicockpit check`. */}
      <div className="export-pack">
        <div className="export-pack__head">
          <span className="export-pack__title">Step 2 · Pack — your agent builds in the kit</span>
          <button type="button" className="modal__btn modal__btn--primary" onClick={downloadPack}>
            <Package size={13} strokeWidth={1.75} />
            Download pack
          </button>
        </div>
        <div className="export-pack__agent">
          <span className="export-pack__agent-label">Building with</span>
          <Seg options={AGENTS} value={agent} onChange={onAgent} />
        </div>
        {entries.map((e) => (
          <PackRow key={e.label} entry={e} onToast={onToast} />
        ))}
        <div className="export-pack__how">
          <span className="export-pack__how-title">How to use it</span>
          <ol className="export-pack__how-steps">
            <li>Add the <code>&lt;link&gt;</code> above to your app's <code>&lt;head&gt;</code>.</li>
            <li>Commit <code>design.md</code> + the rules file (<code>{skill.filename}</code>) to your repo.</li>
            <li>Tell your agent <em>“follow design.md”</em>, then run <code>npx uicockpit check</code> to catch drift.</li>
          </ol>
        </div>
      </div>

      {/* What's in your kit — proof (choices + WCAG), demoted behind a disclosure
          so the actions (link + pack) stay above the fold. */}
      <details className="export-ov__reveal">
        <summary className="export-ov__reveal-sum">What's in your kit — {choices.length} settings · {a11yPass}/{a11yTotal} WCAG pairs pass</summary>
      <div className="export-ov__choices">
        {choices.map((c) => (
          <div key={c.label} className="export-ov__choice">
            <span className="export-ov__choice-ic" aria-hidden="true">{c.icon}</span>
            <div className="export-ov__choice-body">
              <div className="export-ov__choice-val">{c.value}</div>
              <div className="export-ov__choice-label">{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* WCAG audit summary */}
      <div className="export-ov__a11y">
        <div className="export-ov__a11y-head">
          <div className="export-ov__a11y-title">Accessibility</div>
          <span
            className={`export-ov__a11y-badge ${a11yPass === a11yTotal ? 'export-ov__a11y-badge--pass' : 'export-ov__a11y-badge--partial'}`}
          >
            {a11yPass === a11yTotal && <Check size={11} strokeWidth={2.5} />}
            {a11yPass} / {a11yTotal} WCAG pairs pass
          </span>
        </div>
        <div className="export-ov__a11y-grid">
          {a11y.map((p) => (
            <div key={p.label} className="export-ov__a11y-row">
              <span className={`export-ov__a11y-dot export-ov__a11y-dot--${p.passes ? 'ok' : 'fail'}`} />
              <span className="export-ov__a11y-label">{p.label}</span>
              <span className="export-ov__a11y-ratio">{p.ratio.toFixed(2)}:1</span>
            </div>
          ))}
        </div>
      </div>
      </details>

      {/* Component recipes promise + eject to the formats drawer. */}
      <div className="export-ov__recipes">
        <div className="export-ov__recipes-icon">
          <FileCode size={16} strokeWidth={1.75} />
        </div>
        <div>
          <div className="export-ov__recipes-title">Component recipes included</div>
          <div className="export-ov__recipes-sub">
            The hosted link + tokens.css ship per-component CSS for Button, Input, Card,
            Badge, Tabs, Switch, Toggle, Checkbox, Radio, Alert, Progress, Menu, Tooltip,
            Dialog, Avatar, Skeleton, Spinner, Kbd, Separator — each with full state
            recipes (hover, focus, disabled, active).
          </div>
          <button type="button" className="export-ov__recipes-link" onClick={onEject}>
            Eject to files (tokens.css · Tailwind · shadcn) →
          </button>
        </div>
      </div>
    </div>
  )
}
