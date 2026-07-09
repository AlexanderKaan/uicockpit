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
  Gauge,
  Layers,
  Link2,
  Moon,
  MousePointerClick,
  Package,
  Palette,
  Ruler,
  Sidebar,
  Sparkles,
  Square,
  Sun,
  Terminal,
  Type,
  Wand2,
  X,
  Zap,
} from 'lucide-react'
import type { Config } from '../tokens/types'
import { ToolLogo, type ToolLogoId } from '../brand/toolLogos'
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

type IconCmp = React.ComponentType<{ size?: number; strokeWidth?: number }>

/* ── The router model — left rail is TOOL-first now (not format-first). Pick the
 * tool you build with → get the exact 2–3 step for THAT tool. Two tracks:
 *   web   = paste-only builders (no terminal): the shadcn globals.css IS the hero —
 *           one paste themes every component — plus a prompt prefix to steer gens.
 *   agent = coding agents with a terminal: rules file + the kit CSS + the
 *           `uicockpit check` loop (the moat).
 * "Plain files" (css/tailwind/shadcn) stays as the eject-to-files destination. */
type ToolId = ToolLogoId
type Track = 'web' | 'agent'
interface ToolDef {
  id: ToolId
  name: string
  tagline: string
  track: Track
}
const TOOLS: ToolDef[] = [
  { id: 'v0', name: 'v0', tagline: 'Vercel generative UI', track: 'web' },
  { id: 'lovable', name: 'Lovable', tagline: 'AI app builder', track: 'web' },
  { id: 'claude', name: 'Claude Code', tagline: "Anthropic's CLI agent", track: 'agent' },
  { id: 'cursor', name: 'Cursor', tagline: 'AI code editor', track: 'agent' },
  { id: 'windsurf', name: 'Windsurf', tagline: 'Agentic IDE', track: 'agent' },
  { id: 'bolt', name: 'Bolt', tagline: 'In-browser agent', track: 'agent' },
  { id: 'replit', name: 'Replit', tagline: 'Replit Agent', track: 'agent' },
]

/* ── The "Plain files" drawer — the 3 formats that map to a real stack ─────────
 * tokens.css · Tailwind v4 · shadcn/ui. The per-tool panes are the headline path;
 * this is the framework-aware eject-to-files lane for "any project". */
type FmtId = 'css' | 'tailwind' | 'shadcn'
interface Fmt {
  id: FmtId
  label: string
  hint: string
  filename: string
  icon: IconCmp
  generator: (cfg: Config) => string
}
const FORMATS: Fmt[] = [
  { id: 'css', label: 'tokens.css', hint: ':root + .dark, 60+ vars + recipes', filename: 'tokens.css', icon: FileCode, generator: genCss },
  { id: 'tailwind', label: 'Tailwind v4', hint: '@theme block, full system', filename: 'tailwind-theme.css', icon: Palette, generator: genTailwind },
  { id: 'shadcn', label: 'shadcn/ui', hint: '--background, --primary, …', filename: 'shadcn-globals.css', icon: Layers, generator: genShadcn },
]
type View = 'overview' | 'link' | ToolId | FmtId | 'cli'
const isFmt = (v: View): v is FmtId => FORMATS.some((f) => f.id === v)

/* ── Agent rules — the skill body is agent-agnostic (genSkill); only the delivery
 * filename + any frontmatter differ per tool. Bolt/Replit fall back to AGENTS.md. */
type Agent = 'claude' | 'cursor' | 'windsurf' | 'generic'
const TOOL_AGENT: Record<ToolId, Agent> = {
  v0: 'generic',
  lovable: 'generic',
  claude: 'claude',
  cursor: 'cursor',
  windsurf: 'windsurf',
  bolt: 'generic',
  replit: 'generic',
}
const AGENT_FILE: Record<Agent, string> = {
  claude: '.claude/skills/uicockpit/SKILL.md',
  cursor: '.cursor/rules/uicockpit.mdc',
  windsurf: '.windsurfrules',
  generic: 'AGENTS.md',
}
/** The skill file for a given agent: the shared body + the right path and any
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

/* Where a web builder keeps its global stylesheet (the file you paste shadcn into). */
const WEB_CSS_TARGET: Record<'v0' | 'lovable', string> = {
  v0: 'app/globals.css',
  lovable: 'src/index.css',
}

/* === Install layer (Plain files drawer) — framework + package-manager pickers === */
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

/** Download a generated string as a file. */
function downloadText(text: string, filename: string) {
  const blob = new Blob([text], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

const basename = (p: string) => p.split('/').pop() ?? p

interface ExportModalProps {
  cfg: Config
  onClose: () => void
  onToast: (msg: string) => void
}

export function ExportModal({ cfg, onClose, onToast }: ExportModalProps) {
  const [view, setView] = useState<View>('overview')
  const [framework, setFramework] = useState<Framework>('next')
  const [pm, setPm] = useState<Pm>('pnpm')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

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
          {/* Phones: the vertical rail can't stack 13 tools without a long
              horizontal scroll (tools 5–13 hide off-screen). A native select with
              optgroups puts every destination one tap away, grouped, in the OS
              picker. CSS shows this on ≤720px and the rail on desktop. */}
          <label className="modal__navselect-wrap">
            <span className="modal__navselect-label">Destination</span>
            <select
              className="modal__navselect"
              value={view}
              onChange={(e) => setView(e.target.value as View)}
              aria-label="Pick your tool"
            >
              <option value="overview">In this kit</option>
              <option value="link">Kit URL</option>
              <optgroup label="Web builders">
                {TOOLS.filter((t) => t.track === 'web').map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </optgroup>
              <optgroup label="Coding agents">
                <option value="cli">CLI + MCP</option>
                {TOOLS.filter((t) => t.track === 'agent').map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </optgroup>
              <optgroup label="Plain files">
                {FORMATS.map((f) => (
                  <option key={f.id} value={f.id}>{f.label}</option>
                ))}
              </optgroup>
            </select>
          </label>
          <nav className="modal__nav" role="tablist" aria-label="Pick your tool">
            <NavBtn id="overview" label="In this kit" hint="Settings · a11y · outputs" icon={<Package size={15} strokeWidth={1.75} />} view={view} onView={setView} />
            <NavBtn id="link" label="Kit URL" hint="One link — live, no install" icon={<Link2 size={15} strokeWidth={1.75} />} view={view} onView={setView} />
            <div className="modal__navgroup">Web builders</div>
            {TOOLS.filter((t) => t.track === 'web').map((t) => (
              <NavBtn key={t.id} id={t.id} label={t.name} hint={t.tagline} icon={<ToolLogo id={t.id} size={15} />} view={view} onView={setView} />
            ))}
            <div className="modal__navgroup">Coding agents</div>
            <NavBtn id="cli" label="CLI + MCP" hint="Any terminal · the check loop" icon={<Terminal size={15} strokeWidth={1.75} />} view={view} onView={setView} />
            {TOOLS.filter((t) => t.track === 'agent').map((t) => (
              <NavBtn key={t.id} id={t.id} label={t.name} hint={t.tagline} icon={<ToolLogo id={t.id} size={15} />} view={view} onView={setView} />
            ))}
            <div className="modal__navgroup">Plain files</div>
            {FORMATS.map((f) => (
              <NavBtn key={f.id} id={f.id} label={f.label} hint={f.hint} icon={<f.icon size={15} strokeWidth={1.75} />} view={view} onView={setView} />
            ))}
          </nav>
          <div className="modal__pane">
            {view === 'overview' ? (
              <OverviewPane cfg={cfg} onToast={onToast} />
            ) : view === 'link' ? (
              <LinkPane cfg={cfg} onToast={onToast} />
            ) : view === 'cli' ? (
              <CliPane cfg={cfg} onToast={onToast} />
            ) : isFmt(view) ? (
              <FormatsPane
                cfg={cfg}
                fmt={view}
                framework={framework}
                pm={pm}
                onFramework={setFramework}
                onPm={setPm}
                onToast={onToast}
              />
            ) : (
              <ToolPane tool={TOOLS.find((t) => t.id === view)!} cfg={cfg} onToast={onToast} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/** A left-rail destination button (a tool or a format file). */
function NavBtn({ id, label, hint, icon, view, onView }: {
  id: View
  label: string
  hint: string
  icon: ReactNode
  view: View
  onView: (v: View) => void
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={id === view}
      aria-label={label}
      className={`modal__navitem ${id === view ? 'modal__navitem--on' : ''}`}
      onClick={() => onView(id)}
    >
      <span className="modal__navitem-icon">{icon}</span>
      <span className="modal__navitem-body">
        <span className="modal__navitem-label">{label}</span>
        <span className="modal__navitem-hint">{hint}</span>
      </span>
    </button>
  )
}

/* ════════════════════════ The per-tool install panes ════════════════════════ */

interface ToolStep {
  n: number
  title: string
  desc: ReactNode
  code: string
  codeLabel: string
  /** Render the code as a single inline line (a link / a command) vs a <pre> block. */
  inline?: boolean
  /** Optional file to download for this step (may differ from the copied code,
   *  e.g. copy the live <link> but download the offline tokens.css). */
  download?: { filename: string; text: string }
}

/* A one-line, human-readable recap of the kit — used inside the web-builder prompt. */
function kitSummary(cfg: Config, tk: ReturnType<typeof buildTokens>): string {
  const cap = (k: string, v: string) => CHOICE_CAP[k]?.[v] ?? v
  return `${tk.primaryHex.toUpperCase()} brand · ${cap('radius', cfg.radius)} corners · ${cfg.fontDisplay}/${cfg.fontBody} type · ${cap('scale', cfg.scale)} density · ${cap('motion', cfg.motion)} motion`
}

/* The prompt prefix for chat-based builders — they can't run `check`, so consistency
 * rides on the shadcn vars + this instruction. Short enough to paste above any prompt. */
function webPrompt(cfg: Config, tk: ReturnType<typeof buildTokens>): string {
  return `This project ships a custom design system (UICockpit), themed through the shadcn/ui CSS variables in globals.css. Follow it for every screen you build:

- Use the shadcn/ui tokens — --background, --foreground, --primary, --secondary, --muted, --accent, --border, --ring, --radius — for all colours, radii and spacing. Never hardcode a hex, pixel radius or font size.
- Compose from the existing shadcn/ui components so they inherit the theme automatically.
- House style: ${kitSummary(cfg, tk)}.`
}

function toolSteps(tool: ToolDef, cfg: Config, kitSnippet: string, tk: ReturnType<typeof buildTokens>): ToolStep[] {
  if (tool.track === 'web') {
    const target = WEB_CSS_TARGET[tool.id as 'v0' | 'lovable']
    const shadcn = genShadcn(cfg)
    const prompt = webPrompt(cfg, tk)
    return [
      {
        n: 1,
        title: `Paste the theme into ${target}`,
        desc: <>{tool.name} builds with shadcn/ui. Replace your <code>{target}</code> with this — every component it generates inherits your kit.</>,
        code: shadcn,
        codeLabel: target,
        download: { filename: 'globals.css', text: shadcn },
      },
      {
        n: 2,
        title: 'Steer new generations',
        desc: <>Paste this above your prompt so {tool.name} keeps new screens on-system.</>,
        code: prompt,
        codeLabel: 'Prompt prefix',
        download: { filename: 'uicockpit-prompt.txt', text: prompt },
      },
    ]
  }
  const skill = skillFile(TOOL_AGENT[tool.id], cfg)
  return [
    {
      n: 1,
      title: 'Add the rules',
      desc: <>Save as <code>{skill.filename}</code>. {tool.name} loads it so new code follows the system every session.</>,
      code: skill.text,
      codeLabel: skill.filename,
      download: { filename: basename(skill.filename), text: skill.text },
    },
    {
      n: 2,
      title: 'Wear the kit',
      desc: <>Add the hosted link to your <code>&lt;head&gt;</code> — live, no install. Or download <code>tokens.css</code> for an offline copy.</>,
      code: kitSnippet,
      codeLabel: 'index.html  <head>',
      inline: true,
      download: { filename: 'tokens.css', text: genCss(cfg) },
    },
    {
      n: 3,
      title: 'Keep it consistent',
      desc: <>After it builds, run the verifier to catch drift — hardcoded hex, off-grid spacing, wrong tokens. This loop is the difference between "themed once" and "stays on-system".</>,
      code: 'npx uicockpit check',
      codeLabel: 'terminal',
      inline: true,
      download: { filename: 'uicockpit.contract.json', text: genContract(cfg) },
    },
  ]
}

/** One numbered step with its copyable code block (+ optional download). */
function StepCard({ step, onToast }: { step: ToolStep; onToast: (m: string) => void }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(step.code)
      onToast(`${step.codeLabel} copied`)
    } catch {
      onToast('Copy failed — select & copy manually')
    }
  }
  const dl = step.download
  return (
    <div className="toolstep">
      <span className="toolstep__num" aria-hidden="true">{step.n}</span>
      <div className="toolstep__body">
        <div className="toolstep__title">{step.title}</div>
        <p className="toolstep__desc">{step.desc}</p>
        <div className="toolstep__codecard">
          <div className="toolstep__codehead">
            <span className="toolstep__codelabel">{step.codeLabel}</span>
            <div className="toolstep__codeacts">
              <button type="button" className="modal__btn" onClick={copy}>
                <Copy size={13} strokeWidth={1.75} />
                Copy
              </button>
              {dl && (
                <button
                  type="button"
                  className="modal__btn"
                  onClick={() => { downloadText(dl.text, dl.filename); onToast(`${dl.filename} downloaded`) }}
                  aria-label={`Download ${dl.filename}`}
                  title={`Download ${dl.filename}`}
                >
                  <Download size={13} strokeWidth={1.75} />
                </button>
              )}
            </div>
          </div>
          {step.inline
            ? <code className="toolstep__inline">{step.code}</code>
            : <pre className="toolstep__code">{step.code}</pre>}
        </div>
      </div>
    </div>
  )
}

/** A per-tool install pane — tailored steps + the kit proof. */
function ToolPane({ tool, cfg, onToast }: { tool: ToolDef; cfg: Config; onToast: (m: string) => void }) {
  const tk = useMemo(() => buildTokens(cfg), [cfg])
  const kitSnippet = `<link rel="stylesheet" href="${KIT_CDN_BASE}/k/${encode(cfg)}.css">`
  const steps = useMemo(() => toolSteps(tool, cfg, kitSnippet, tk), [tool, cfg, kitSnippet, tk])

  const downloadAll = () => {
    const seen = new Set<string>()
    const files: Array<{ name: string; text: string }> = []
    for (const s of steps) {
      if (s.download && !seen.has(s.download.filename)) {
        seen.add(s.download.filename)
        files.push({ name: s.download.filename, text: s.download.text })
      }
    }
    if (!seen.has('design.md')) files.push({ name: 'design.md', text: genDesignMd(cfg) })
    const blob = zipSync(files)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `uicockpit-${tool.id}.zip`
    a.click()
    URL.revokeObjectURL(url)
    onToast('Files downloaded (.zip)')
  }

  return (
    <div className="tool">
      <div className="tool__head">
        <span className="tool__logo" aria-hidden="true"><ToolLogo id={tool.id} size={22} /></span>
        <div className="tool__heading">
          <span className="tool__name">{tool.name}</span>
          <span className="tool__tagline">{tool.tagline}</span>
        </div>
        <span className={`tool__track tool__track--${tool.track}`}>
          {tool.track === 'web'
            ? <><Wand2 size={12} strokeWidth={2} />Paste · no terminal</>
            : <><Terminal size={12} strokeWidth={2} />Rules + check loop</>}
        </span>
        <button type="button" className="modal__btn modal__btn--primary tool__dl" onClick={downloadAll}>
          <Package size={13} strokeWidth={1.75} />
          Download all
        </button>
      </div>
      <div className="tool__steps">
        {steps.map((s) => (
          <StepCard key={s.n} step={s} onToast={onToast} />
        ))}
      </div>
    </div>
  )
}

/** CLI + MCP pane — the tool-agnostic agent-native path: the published `uicockpit`
 *  CLI (init prefilled with THIS kit's hash + check) and the `uicockpit-mcp` config.
 *  Surfaces the check-loop (the moat) as a first-class destination, not buried in a
 *  per-tool step. */
function CliPane({ cfg, onToast }: { cfg: Config; onToast: (m: string) => void }) {
  const hash = encode(cfg)
  const mcpConfig = `{
  "mcpServers": {
    "uicockpit": { "command": "npx", "args": ["-y", "uicockpit-mcp"] }
  }
}`
  const steps: ToolStep[] = [
    {
      n: 1,
      title: 'Install the kit',
      desc: <>Pulls <code>uicockpit.tokens.css</code> + <code>uicockpit.contract.json</code> (this kit's hash is baked in) — the contract is what <code>check</code> verifies.</>,
      code: `npx uicockpit init ${hash}`,
      codeLabel: 'terminal',
      inline: true,
    },
    {
      n: 2,
      title: 'Build, then verify',
      desc: <>After you (or your agent) build UI, run the verifier to catch drift — hardcoded hex, off-grid spacing, wrong tokens. Add <code>--strict</code> to fail on warnings in CI.</>,
      code: 'npx uicockpit check',
      codeLabel: 'terminal',
      inline: true,
    },
    {
      n: 3,
      title: 'Or go native — MCP server',
      desc: <>Wire the MCP server into Claude Code / Cursor / Windsurf so the agent installs, reads and verifies the kit itself — no copy-paste. Tools: <code>install_kit</code> · <code>get_design_context</code> · <code>check_conformance</code>.</>,
      code: mcpConfig,
      codeLabel: '.mcp.json · .cursor/mcp.json · claude_desktop_config.json',
    },
  ]
  return (
    <div className="tool">
      <div className="tool__head">
        <span className="tool__logo" aria-hidden="true"><Terminal size={20} strokeWidth={1.9} /></span>
        <div className="tool__heading">
          <span className="tool__name">CLI + MCP</span>
          <span className="tool__tagline">Any terminal — the agent-native path</span>
        </div>
        <span className="tool__track tool__track--agent" style={{ marginLeft: 'auto' }}>
          <Terminal size={12} strokeWidth={2} />Rules + check loop
        </span>
      </div>
      <div className="tool__steps">
        {steps.map((s) => (
          <StepCard key={s.n} step={s} onToast={onToast} />
        ))}
      </div>
    </div>
  )
}

/** Kit URL — the headline expression of the whole proposition: your design system
 *  IS a link. One hosted stylesheet (kit.uicockpit.com/k/<hash>.css) — paste the
 *  <link>, done. Sits first under the kit because it's the shortest path from
 *  "made it" to "using it everywhere". The hash is the version. */
function LinkPane({ cfg, onToast }: { cfg: Config; onToast: (m: string) => void }) {
  const hash = encode(cfg)
  const cssUrl = `${KIT_CDN_BASE}/k/${hash}.css`
  const linkTag = `<link rel="stylesheet" href="${cssUrl}">`
  const importRule = `@import url("${cssUrl}");`
  const copy = (text: string, label: string) => async () => {
    try { await navigator.clipboard.writeText(text); onToast(`${label} copied`) }
    catch { onToast('Copy failed — select & copy manually') }
  }
  return (
    <div className="tool tool--overview">
      <div className="tool__head">
        <span className="tool__logo" aria-hidden="true"><Link2 size={22} strokeWidth={1.75} /></span>
        <div className="tool__heading">
          <span className="tool__name">Kit URL</span>
          <span className="tool__tagline">Your whole design system — one hosted stylesheet.</span>
        </div>
      </div>
      <p className="tool__overview-lead">
        This URL <strong>is</strong> your kit. Paste the one <code>&lt;link&gt;</code> into your{' '}
        <code>&lt;head&gt;</code> and every <code>--k-*</code> token and component recipe is live —
        no install, no build step. The hash is the version: this exact link always serves this exact
        kit, byte-identical anywhere it loads.
      </p>

      <div className="tool__steps" style={{ marginTop: 16 }}>
        <div className="toolstep">
          <span className="toolstep__num" aria-hidden="true">1</span>
          <div className="toolstep__body">
            <div className="toolstep__title">Drop it in your &lt;head&gt;</div>
            <p className="toolstep__desc">Live and versioned by the URL — retune the kit and you get a new one.</p>
            <div className="toolstep__codecard">
              <div className="toolstep__codehead">
                <span className="toolstep__codelabel">index.html · &lt;head&gt;</span>
                <div className="toolstep__codeacts">
                  <button type="button" className="modal__btn" onClick={copy(linkTag, 'Link tag')}>
                    <Copy size={13} strokeWidth={1.75} /> Copy
                  </button>
                  <button
                    type="button"
                    className="modal__btn"
                    onClick={() => { downloadText(genCss(cfg), 'tokens.css'); onToast('tokens.css downloaded') }}
                    aria-label="Download tokens.css"
                    title="Download tokens.css for an offline copy"
                  >
                    <Download size={13} strokeWidth={1.75} />
                  </button>
                </div>
              </div>
              <code className="toolstep__inline">{linkTag}</code>
            </div>
          </div>
        </div>

        <div className="toolstep">
          <span className="toolstep__num" aria-hidden="true">2</span>
          <div className="toolstep__body">
            <div className="toolstep__title">Or import it in CSS</div>
            <p className="toolstep__desc">Same file, for a stylesheet or a CSS <code>@import</code>.</p>
            <div className="toolstep__codecard">
              <div className="toolstep__codehead">
                <span className="toolstep__codelabel">styles.css</span>
                <div className="toolstep__codeacts">
                  <button type="button" className="modal__btn" onClick={copy(importRule, 'CSS @import')}>
                    <Copy size={13} strokeWidth={1.75} /> Copy
                  </button>
                </div>
              </div>
              <code className="toolstep__inline">{importRule}</code>
            </div>
          </div>
        </div>
      </div>

      <p className="tool__overview-lead">
        Prefer a file committed to your repo? The <strong>Plain files</strong> tab downloads the same
        CSS (plus Tailwind / shadcn variants). Want an agent to apply and verify it? See <strong>CLI + MCP</strong>.
      </p>
    </div>
  )
}

/* ── One format file (Plain files drawer) — actions + the stack-aware install
 * guide + the code. The eject-to-files path for any project. */
function FormatsPane({
  cfg,
  fmt,
  framework,
  pm,
  onFramework,
  onPm,
  onToast,
}: {
  cfg: Config
  fmt: FmtId
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
      <div className="export-fmt__head">
        <span className="export-fmt__name">{current.label}</span>
        <span className="export-fmt__hint">{current.hint}</span>
      </div>
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
  const ic = (El: IconCmp): ReactNode => <El size={15} strokeWidth={1.9} />
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

/** "In this kit" — the modal's landing pane and single source of truth for what
 *  the kit contains: the settings you chose, the WCAG proof, and the outputs every
 *  destination derives from. Kit-level context lives here ONCE, not repeated on
 *  every tool pane; pick a destination on the left to actually use it. */
function OverviewPane({ cfg, onToast }: { cfg: Config; onToast: (m: string) => void }) {
  const tk = useMemo(() => buildTokens(cfg), [cfg])
  const a11y = useMemo(() => auditContrast(tk), [tk])
  const a11yPass = a11y.filter((p) => p.passes).length
  const a11yTotal = a11y.length
  const choices = buildChoices(cfg, tk)
  // Copy a link to THIS kit — opens it in the configurator (the whole config lives
  // in the URL hash). This is the old top-bar "Share", folded into its natural home.
  const copyLink = async () => {
    const url = `${window.location.origin}/app#${encode(cfg)}`
    try {
      await navigator.clipboard.writeText(url)
      onToast('Kit link copied')
    } catch {
      onToast('Copy failed — select & copy manually')
    }
  }
  return (
    <div className="tool tool--overview">
      <div className="tool__head">
        <span className="tool__logo" aria-hidden="true"><Package size={22} strokeWidth={1.75} /></span>
        <div className="tool__heading">
          <span className="tool__name">In this kit</span>
          <span className="tool__tagline">{choices.length} settings · {a11yPass}/{a11yTotal} WCAG pairs pass</span>
        </div>
        <button type="button" className="modal__btn tool__dl" style={{ marginLeft: 'auto' }} onClick={copyLink}>
          <Copy size={13} strokeWidth={1.75} /> Copy link
        </button>
      </div>
      <p className="tool__overview-lead">
        Everything this kit contains, in one place. Every output — tokens, a Tailwind or
        shadcn theme, an AI prompt, the machine-readable contract — derives from these
        exact settings, so they can never disagree. Pick a destination to use it.
      </p>

      <div className="tool__overview-sec">Settings</div>
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
    </div>
  )
}
