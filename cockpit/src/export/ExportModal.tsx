import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  Blend,
  Braces,
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
import { genJson } from './genJson'
import { genTailwind } from './genTailwind'
import { genBrief } from './genBrief'
import { genShadcn } from './genShadcn'
import { genRegistry } from './genRegistry'
import { genAiPrompt } from './genAiPrompt'
import { genContract } from './genContract'

/** Base URL of the Live Kit CDN Worker (cockpit/worker). The stateless lane
 *  `${BASE}/k/<hash>.css` serves genCss(decode(hash)) — the full kit, byte-identical
 *  to the download. LIVE on Cloudflare at the branded custom domain. */
const KIT_CDN_BASE = 'https://kit.uicockpit.com'

type TabId = 'overview' | 'ai' | 'brief' | 'css' | 'html' | 'json' | 'tailwind' | 'shadcn' | 'registry' | 'contract'

interface Tab {
  id: TabId
  label: string
  hint: string
  filename: string
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>
  generator: (cfg: Config) => string
}

const TABS: Tab[] = [
  {
    id: 'overview',
    label: 'Overview',
    hint: "What's in your kit",
    filename: '',
    icon: Gauge,
    // The overview pane is rendered specially — generator is unused.
    generator: () => '',
  },
  {
    id: 'ai',
    label: 'AI prompt',
    hint: 'For Cursor, v0, Claude, Lovable, Bolt',
    filename: 'design-system.prompt.md',
    icon: Sparkles,
    generator: genAiPrompt,
  },
  {
    id: 'brief',
    label: 'BRIEF.md',
    hint: 'Human + AI handoff document',
    filename: 'BRIEF.md',
    icon: FileText,
    generator: genBrief,
  },
  {
    id: 'css',
    label: 'tokens.css',
    hint: ':root + .dark blocks, 60+ vars',
    filename: 'tokens.css',
    icon: FileCode,
    generator: genCss,
  },
  {
    id: 'json',
    label: 'tokens.json',
    hint: 'W3C design tokens, save format',
    filename: 'tokens.json',
    icon: Braces,
    generator: genJson,
  },
  {
    id: 'tailwind',
    label: 'Tailwind v4',
    hint: '@theme block, full system',
    filename: 'tailwind-theme.css',
    icon: Palette,
    generator: genTailwind,
  },
  {
    id: 'shadcn',
    label: 'shadcn/ui',
    hint: '--background, --primary, ...',
    filename: 'shadcn-globals.css',
    icon: Layers,
    generator: genShadcn,
  },
  {
    id: 'registry',
    label: 'shadcn registry',
    hint: 'npx shadcn add — registry:theme JSON',
    filename: 'registry-theme.json',
    icon: Layers,
    generator: genRegistry,
  },
  {
    id: 'contract',
    label: 'contract.json',
    hint: 'Machine-readable — what uicockpit check verifies',
    filename: 'uicockpit.contract.json',
    icon: ShieldCheck,
    generator: genContract,
  },
]

/* === Install layer — framework + package-manager pickers ============
 * shadcn/create's lesson: don't just dump code, tell the user how to
 * adopt it in THEIR stack. We keep the format tabs but add a rendered
 * "Install" block above the code so the how-to isn't buried in comments. */
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

function getInstall(tab: TabId, fw: Framework, pm: Pm): Install {
  switch (tab) {
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
    case 'json':
      return {
        showFramework: false,
        steps: [
          'Save as tokens.json.',
          'Import into Tokens Studio (Figma) or a Style Dictionary build.',
          'Or load at runtime and map to your own CSS variables.',
        ],
      }
    case 'brief':
      return {
        showFramework: false,
        steps: [
          'Hand this Markdown to a designer or developer as the single source of truth.',
          'Or paste it into your AI tool alongside the AI prompt for full context.',
        ],
      }
    case 'ai':
      return {
        showFramework: false,
        steps: [
          'Open Cursor, v0, Claude, Lovable, or Bolt.',
          'Paste this as your first / system message before asking for components.',
          'The model will build UI that matches your kit\'s tokens exactly.',
        ],
      }
    case 'contract':
      return {
        showFramework: false,
        steps: [
          'Save as uicockpit.contract.json at your repo root.',
          'It enumerates every token, the component graph, the BEM vocabulary and the rules as data.',
          'Run npx uicockpit check against your codebase — it reports drift from this contract with a CI exit code.',
        ],
      }
    default:
      return { showFramework: false, steps: [] }
  }
}

interface ExportModalProps {
  cfg: Config
  onClose: () => void
  onToast: (msg: string) => void
}

export function ExportModal({ cfg, onClose, onToast }: ExportModalProps) {
  const [tab, setTab] = useState<TabId>('overview')
  const [framework, setFramework] = useState<Framework>('next')
  const [pm, setPm] = useState<Pm>('pnpm')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const current = TABS.find((t) => t.id === tab)!
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
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = current.filename
    a.click()
    URL.revokeObjectURL(url)
    onToast(`${current.filename} downloaded`)
  }

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
          <nav className="modal__nav" role="tablist" aria-label="Export formats">
            {TABS.map((t) => {
              const Cmp = t.icon
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={t.id === tab}
                  aria-label={t.label}
                  className={`modal__navitem ${t.id === tab ? 'modal__navitem--on' : ''}`}
                  onClick={() => setTab(t.id)}
                >
                  <span className="modal__navitem-icon">
                    <Cmp size={15} strokeWidth={1.75} />
                  </span>
                  <span className="modal__navitem-body">
                    <span className="modal__navitem-label">{t.label}</span>
                    <span className="modal__navitem-hint">{t.hint}</span>
                  </span>
                </button>
              )
            })}
          </nav>
          <div className="modal__pane">
            {tab === 'overview' ? (
              <OverviewPane cfg={cfg} onPickTab={setTab} onToast={onToast} />
            ) : (
              <>
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
                <InstallGuide
                  tab={tab}
                  framework={framework}
                  pm={pm}
                  onFramework={setFramework}
                  onPm={setPm}
                  onToast={onToast}
                />
                <pre className="modal__code">{code}</pre>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/** Install guide — the "how do I actually use this" layer. Framework picker
 *  (where relevant) + package-manager tabs + rendered numbered steps + an
 *  optional copyable command. Lifts the adoption steps out of code comments
 *  and into the UI. */
function InstallGuide({
  tab,
  framework,
  pm,
  onFramework,
  onPm,
  onToast,
}: {
  tab: TabId
  framework: Framework
  pm: Pm
  onFramework: (f: Framework) => void
  onPm: (p: Pm) => void
  onToast: (msg: string) => void
}) {
  const info = getInstall(tab, framework, pm)
  if (info.steps.length === 0) return null

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
        {info.showFramework && (
          <Seg options={FRAMEWORKS} value={framework} onChange={onFramework} />
        )}
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

/** Build the "your choices" recap — one entry per setting the user configured,
 *  each with a glanceable icon (or a live swatch for the brand colour) and the
 *  chosen value. This replaces the abstract token counts: the user sees the
 *  system THEY built. */
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

/** Overview pane — shows what the user actually configured before they copy
 *  anything: a recap of every choice (icons + values) + a WCAG audit summary +
 *  jump-buttons to the format tabs. The point: "here's the system YOU built". */
function OverviewPane({
  cfg,
  onPickTab,
  onToast,
}: {
  cfg: Config
  onPickTab: (id: TabId) => void
  onToast: (msg: string) => void
}) {
  const tk = useMemo(() => buildTokens(cfg), [cfg])
  const a11y = useMemo(() => auditContrast(tk), [tk])
  const a11yPass = a11y.filter((p) => p.passes).length
  const a11yTotal = a11y.length

  // The user's actual choices — a recap of every setting they configured, so
  // the export opens on "here's the system YOU built", not abstract token counts.
  const choices = buildChoices(cfg, tk)

  // The hosted-kit CDN <link> — the front door. Built from the SAME share-key the
  // app already uses (encode(cfg)); the Worker serves genCss(decode(key)) at this
  // exact URL, byte-identical to the download below. LIVE on Cloudflare today.
  // Swap KIT_CDN_BASE to https://kit.uicockpit.com once the custom domain is wired.
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

  return (
    <div className="export-ov">
      <div className="export-ov__head">
        <div className="export-ov__title">Use this kit</div>
        <p className="export-ov__sub">
          Drop one hosted <code>&lt;link&gt;</code> in your <code>&lt;head&gt;</code> —
          or download the files below. Either way you get the {choices.length} choices
          you made, baked in.
        </p>
      </div>

      {/* CDN hero — the front door. One link, the whole kit. */}
      <div className="export-cdn">
        <div className="export-cdn__head">
          <span className="export-cdn__ic" aria-hidden="true"><Link2 size={15} strokeWidth={1.9} /></span>
          <span className="export-cdn__label">Hosted kit · one link</span>
          <span className="export-cdn__live"><span className="export-cdn__live-dot" />Live</span>
        </div>
        <div className="export-cdn__snippet">
          <code className="export-cdn__code">{kitSnippet}</code>
          <button type="button" className="export-cdn__copy" onClick={copyKit}>
            <Copy size={13} strokeWidth={1.9} />
            Copy
          </button>
        </div>
        <p className="export-cdn__note">
          Serves the full kit (tokens + component recipes) — byte-identical to the
          download. Published kits get a short, auto-updating link (tweak → your live
          app restyles) at launch. No account, eject to files anytime.
        </p>
      </div>

      {/* Choices recap — every setting the user configured, at a glance. */}
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

      {/* Bonus: component recipes promise */}
      <div className="export-ov__recipes">
        <div className="export-ov__recipes-icon">
          <FileCode size={16} strokeWidth={1.75} />
        </div>
        <div>
          <div className="export-ov__recipes-title">Component recipes included</div>
          <div className="export-ov__recipes-sub">
            tokens.css ships with per-component CSS for Button, Input, Card,
            Badge, Tabs, Switch, Toggle, Checkbox, Radio, Alert, Progress,
            Menu, Tooltip, Dialog, Avatar, Skeleton, Spinner, Kbd, Separator
            — each with full state recipes (hover, focus, disabled, active).
            Drop it into your project and components match the kit out of the box.
          </div>
          <button
            type="button"
            className="export-ov__recipes-link"
            onClick={() => onPickTab('css')}
          >
            See tokens.css →
          </button>
        </div>
      </div>
    </div>
  )
}
