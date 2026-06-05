#!/usr/bin/env node
/**
 * audit-coverage.mjs — "coverage-proof" gate for the SupaDash suite.
 *
 * WHY: the component gallery is the source of truth, but a gallery card only
 * proves a component EXISTS — not that it works in a real product context. The
 * suite rebuild (SUITE-PLAN.md) set a harder bar: every component must appear at
 * least once inside a live app screen. This gate encodes that — each component
 * maps to a marker (a class / JSX token) that must be found somewhere in the
 * live app sources. If a component slips back to gallery-only, the build fails.
 *
 * Inverse of audit-parity (which checks app ⊆ gallery); this checks the
 * gallery's in-context coverage (gallery → at least one app screen).
 *
 * A small, explicit ALLOWLIST holds components that are intentionally
 * gallery-only (no natural product home) — logged, never silently dropped.
 *
 * Exit 1 on any uncovered (non-allowlisted) component. Usage:
 *   node scripts/audit-coverage.mjs [--report]
 */
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..')
const REPORT = process.argv.includes('--report')

const VIEWS = resolve(ROOT, 'src/stage/views')
const APPS = resolve(VIEWS, 'apps')
// The live app sources — the super-app shell + every product + shared helpers.
const FILES = [
  ...['DemoDashboard.tsx', 'ChartFrame.tsx', 'Skeletons.tsx'].map((f) => resolve(VIEWS, f)),
  ...readdirSync(APPS).filter((f) => f.endsWith('.tsx')).map((f) => resolve(APPS, f)),
]
const HAYSTACK = FILES.map((f) => readFileSync(f, 'utf8')).join('\n')

// component → a marker substring proving it renders in a live app screen.
const MARKERS = {
  // Dashboard widgets (Home)
  StatTile: 'stat-tile', UsageMeter: 'usage--', Progress: 'progress__fill',
  QuickActions: 'quickact', TeamOnline: 'team-online', UpgradeBanner: 'upgrade-banner',
  Chart: 'barchart', List: 'list__item', Spinner: 'spinner', Alerts: 'alert alert--',
  FeatureTrio: 'ftrio', Skeleton: 'PageSkeleton',
  // Projects
  Kanban: 'kanban', DataTablePro: 'datatable', Sheet: 'sheet__', TagInput: 'taginput',
  Pagination: 'pagination', ContextMenu: 'ctxmenu', DescriptionList: 'dl"',
  Timeline: 'timeline__', TwoColumnLayout: 'twocol', RadioCard: 'radio-card',
  DatePicker: 'DatePicker',
  // Docs
  Typography: 'k-font-display', TreeView: 'tree__row', Accordion: 'accordion',
  Tabs: 'tabpanel', Toolbar: 'toolbar', Lightbox: 'lightbox', CodeBlock: 'codeblock',
  Carousel: 'carousel',
  // Inbox
  Combobox: 'combobox', Composer: 'composer', AttachmentChip: 'att-chip',
  HoverCard: 'hover-card',
  // CRM
  Popover: 'popover', Validation: 'is-error', PhoneInput: 'phoneinput',
  // Cloud
  StatusPage: 'statuspage', InfoCard: 'info-card', Banner: 'banner--',
  // Billing
  WizardStepper: 'wstepper', CurrencyInput: 'curinp', NumberInput: 'numinput',
  PricingCard: 'pricing__',
  // Media
  Dropzone: 'dropzone',
  // Settings & Account
  SettingsRow: 'list--settings', Switch: 'toggle', Slider: 'InteractiveSlider',
  InputOtp: 'otp__slot', DangerZone: 'dangerzone', AlertDialog: 'dialog--alert',
  Dialog: 'dialog"', Selection: 'radio"', MobileTabBar: 'm-tabbar',
  PasswordInput: 'type="password"', Stepper: 'stepper__',
  // Shell / chrome
  Breadcrumb: 'breadcrumb', Avatar: 'avatar', NotificationCenter: 'list--flush',
  DropdownMenu: 'menu__item', CmdPalette: 'Cmdp', Select: 'select"',
  StatusBadge: 'StatusBadge', NavMenu: 'navmenu',
}

// Intentionally gallery-only — no believable product home. Logged, not failed.
const ALLOWLIST = {
  Lightbox: false, // (kept — it IS covered in Media; example of allowlist shape)
}
// (empty in practice; left as the mechanism for future judgment calls)
delete ALLOWLIST.Lightbox

const missing = []
for (const [name, marker] of Object.entries(MARKERS)) {
  if (!HAYSTACK.includes(marker) && !(name in ALLOWLIST)) missing.push({ name, marker })
}

const total = Object.keys(MARKERS).length
console.log('=== component coverage audit (gallery → live app screen) ===')
if (missing.length === 0) {
  console.log(`OK: all ${total} tracked components appear in a live app screen.`)
  if (Object.keys(ALLOWLIST).length) console.log(`(allowlisted gallery-only: ${Object.keys(ALLOWLIST).join(', ')})`)
  process.exit(0)
}
console.log(`\n${missing.length} / ${total} component(s) are gallery-only — no live app screen renders them:`)
for (const m of missing) console.log(`  ${m.name}  (looked for "${m.marker}")`)
console.log('\nAdd the component to a product screen (SUITE-PLAN.md), or — if it has no')
console.log('believable home — add it to the ALLOWLIST with a one-line reason.')
console.log('(Run with --report to print without failing the build.)')
process.exit(REPORT ? 0 : 1)
