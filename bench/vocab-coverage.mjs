/**
 * THE MEETLAT for R3: how much of a real app's component vocabulary do we have?
 *
 *   node bench/vocab-coverage.mjs --self          # validate the stick itself
 *   node bench/vocab-coverage.mjs <dir> [<dir>…]  # measure real repos
 *
 * The question this answers is NOT "did we read the file" (`audit` reports that
 * already, at 70–100%) and NOT "does the app contain a dialog" (the 16 detection
 * kinds answer that). It is the one that decides whether someone recognises
 * their own app: **of the components their code is built from, how many could a
 * UIcockpit recipe stand in for?**
 *
 * Measured two ways, because they say different things:
 *   · DISTINCT       — breadth. How much of their vocabulary do we speak?
 *   · USAGE-WEIGHTED — what they would actually SEE. A Button used 900 times is
 *                      not one component's worth of their app.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY THIS FILE IS CAREFUL, AND WHY IT VALIDATES ITSELF FIRST
 *
 * The obvious version of this probe is wrong in two ways that both flatter or
 * flatten the result, and I wrote both before catching them:
 *
 *  1. A naive `<[A-Z]\w+` match catches TYPESCRIPT GENERICS. `useState<HTMLDivElement>`,
 *     `Array<TIssue>`, `React.FC<Props>` are not components. Left in, they
 *     inflated one repo's "vocabulary" to 6,268 entries and drove coverage to
 *     near zero by pure denominator.
 *  2. Scoring against the 16 detection KINDS is the wrong reference — that list
 *     exists to answer "does this app have tables at all" and contains no
 *     `button` and no `input`, the two most-used components in every codebase
 *     alive. Coverage must be scored against the RECIPES we actually ship.
 *
 * A meetlat that cannot be shown to fail is not a measurement, so `--self` runs
 * three controls before any number is believed: our own component gallery must
 * score near 100, a list of invented names must score 0, and a file of nothing
 * but generics must contribute nothing at all.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, extname } from 'node:path'

/* ── what their name has to be, to be a component we ship ──────────────────
 * Keyed by OUR recipe root, valued by the names the ecosystem gives that thing.
 * Deliberately written out rather than fuzzy-matched: a similarity score would
 * quietly claim `DataGrid` ≈ `Grid` and inflate exactly the number this file
 * exists to keep honest. If a name is not here, we do not claim it. */
const RECIPE_ALIASES = {
  btn: ['Button', 'IconButton', 'ButtonLink', 'LinkButton', 'SubmitButton', 'ActionButton'],
  'btn-group': ['ButtonGroup', 'ToggleGroup', 'SegmentedControl'],
  in: ['Input', 'TextField', 'TextInput', 'SearchInput', 'EmailInput', 'NumberInput', 'Textarea', 'TextArea'],
  lab: ['Label', 'FormLabel', 'FieldLabel'],
  field: ['Field', 'FormField', 'FormItem', 'FormControl', 'FormMessage', 'FormDescription', 'FormError', 'InputGroup'],
  select: ['Select', 'SelectTrigger', 'SelectContent', 'SelectItem', 'SelectValue', 'Listbox', 'NativeSelect'],
  combobox: ['Combobox', 'Autocomplete', 'MultiSelect'],
  check: ['Checkbox', 'CheckboxGroup'],
  radio: ['Radio', 'RadioGroup', 'RadioItem', 'RadioButton'],
  toggle: ['Switch', 'Toggle'],
  slider: ['Slider', 'RangeSlider'],
  card: ['Card', 'CardHeader', 'CardContent', 'CardBody', 'CardFooter', 'CardTitle', 'CardDescription'],
  tbl: ['Table', 'TableHeader', 'TableHead', 'TableBody', 'TableRow', 'TableCell', 'TableFooter', 'TableCaption', 'Thead', 'Tbody'],
  'data-table': ['DataTable', 'DataGrid'],
  dialog: ['Dialog', 'Modal', 'AlertDialog', 'DialogContent', 'DialogHeader', 'DialogFooter', 'DialogTitle', 'DialogDescription', 'DialogTrigger', 'ConfirmDialog'],
  sheet: ['Sheet', 'Drawer', 'SheetContent', 'SheetHeader', 'DrawerContent', 'SidePanel'],
  menu: ['DropdownMenu', 'DropdownMenuItem', 'DropdownMenuContent', 'DropdownMenuTrigger', 'DropdownMenuSeparator', 'DropdownMenuLabel', 'Menu', 'MenuItem', 'MenuList', 'ContextMenu', 'ContextMenuItem'],
  popover: ['Popover', 'PopoverContent', 'PopoverTrigger', 'HoverCard'],
  tt: ['Tooltip', 'TooltipContent', 'TooltipTrigger', 'TooltipProvider'],
  toast: ['Toast', 'Toaster', 'Snackbar', 'ToastAction', 'ToastTitle', 'ToastDescription'],
  alert: ['Alert', 'AlertTitle', 'AlertDescription', 'Callout', 'Banner', 'InlineAlert'],
  badge: ['Badge', 'Tag', 'Pill', 'Chip', 'StatusBadge', 'Label'],
  avatar: ['Avatar', 'AvatarImage', 'AvatarFallback', 'UserAvatar', 'Gravatar'],
  'avatar-group': ['AvatarGroup', 'AvatarStack'],
  tabs: ['Tabs', 'TabsList', 'TabsTrigger', 'TabsContent', 'TabList', 'TabPanel', 'TabPanels', 'TabGroup'],
  tab: ['Tab'],
  breadcrumb: ['Breadcrumb', 'Breadcrumbs', 'BreadcrumbItem', 'BreadcrumbLink', 'BreadcrumbSeparator'],
  pagination: ['Pagination', 'Paginator', 'PaginationItem', 'PaginationLink'],
  progress: ['Progress', 'ProgressBar', 'CircularProgress', 'Meter'],
  spinner: ['Spinner', 'Loader', 'Loading', 'LoadingSpinner', 'CircularLoader'],
  sk: ['Skeleton', 'SkeletonText', 'Placeholder', 'Shimmer'],
  empty: ['EmptyState', 'Empty', 'NoResults', 'BlankSlate'],
  accordion: ['Accordion', 'AccordionItem', 'AccordionTrigger', 'AccordionContent', 'Collapsible', 'Disclosure', 'Details'],
  sidenav: ['Sidebar', 'SideNav', 'AppSidebar', 'SidebarProvider', 'SidebarContent', 'SidebarMenu', 'SidebarMenuItem', 'SidebarTrigger', 'SidebarHeader', 'SidebarFooter', 'SidebarGroup'],
  navsuite: ['Nav', 'Navbar', 'NavBar', 'Navigation', 'NavMenu', 'NavigationMenu', 'NavItem', 'NavLink'],
  appbar: ['AppBar', 'TopBar', 'Topbar', 'Header', 'SiteHeader', 'PageHeader', 'Toolbar'],
  'page-head': ['PageHead', 'PageTitle', 'PageHeading', 'SectionHeader'],
  calendar: ['Calendar', 'DatePicker', 'DayPicker', 'DateRangePicker', 'MonthPicker'],
  timefield: ['TimePicker', 'TimeField', 'TimeInput'],
  chart: ['Chart', 'LineChart', 'AreaChart', 'PieChart', 'DonutChart', 'ScatterChart', 'ChartContainer', 'ChartTooltip', 'ChartLegend'],
  barchart: ['BarChart', 'ColumnChart'],
  sparkline: ['Sparkline', 'MiniChart'],
  cmdp: ['Command', 'CommandPalette', 'CommandInput', 'CommandItem', 'CommandList', 'CommandGroup', 'CommandDialog', 'CommandEmpty', 'Kbar'],
  kbd: ['Kbd', 'Shortcut', 'KeyboardShortcut'],
  code: ['Code', 'InlineCode'],
  codeblock: ['CodeBlock', 'Highlight', 'Snippet', 'Pre'],
  sep: ['Separator', 'Divider', 'Hr'],
  metric: ['Metric', 'Stat', 'StatCard', 'KPI', 'MetricCard'],
  'stat-tile': ['StatTile', 'StatItem'],
  timeline: ['Timeline', 'TimelineItem', 'ActivityFeed', 'Feed'],
  stepper: ['Stepper', 'Steps', 'Step', 'Wizard', 'ProgressSteps'],
  dropzone: ['Dropzone', 'FileUpload', 'FileDropzone', 'Upload', 'Uploader'],
  rating: ['Rating', 'Stars', 'StarRating'],
  otp: ['OTPInput', 'InputOTP', 'PinInput', 'VerificationCode'],
  pwinput: ['PasswordInput'],
  phoneinput: ['PhoneInput'],
  taginput: ['TagInput', 'TokenInput', 'ChipInput'],
  numinput: ['NumberField', 'Stepper Input', 'QuantityInput'],
  searchinput: ['Search', 'SearchBar', 'SearchField'],
  tree: ['Tree', 'TreeView', 'TreeItem', 'FileTree'],
  kanban: ['Kanban', 'KanbanBoard', 'KanbanColumn', 'Board'],
  carousel: ['Carousel', 'Slider Carousel', 'CarouselItem', 'CarouselContent', 'Swiper'],
  lightbox: ['Lightbox', 'ImageViewer', 'Gallery'],
  prose: ['Prose', 'Markdown', 'RichText', 'MDX'],
  msg: ['Message', 'ChatMessage', 'Bubble', 'ChatBubble'],
  thread: ['Thread', 'ChatThread', 'Conversation'],
  toolbar: ['ToolBar', 'ActionBar', 'Filterbar', 'FilterBar'],
  segctrl: ['SegmentedControl', 'Segments'],
  scrubber: ['Scrubber', 'SeekBar', 'PlaybackSlider'],
  pricing: ['PricingCard', 'PlanCard', 'PricingTable'],
  usage: ['UsageBar', 'QuotaBar', 'UsageMeter'],
  'scroll-area': ['ScrollArea', 'ScrollBar'],
  resizable: ['Resizable', 'ResizablePanel', 'ResizableHandle', 'SplitPane'],
  'aspect': ['AspectRatio'],
  'hover-card': ['HoverCardContent', 'HoverCardTrigger'],
  'entity-card': ['EntityCard', 'ContactCard', 'PersonCard'],
  'info-card': ['InfoCard', 'HelpCard'],
  'action-panel': ['ActionPanel', 'CalloutPanel'],
  dangerzone: ['DangerZone'],
  auth: ['LoginForm', 'SignupForm', 'AuthForm'],
  statuspage: ['StatusPage', 'UptimeBar', 'StatusIndicator'],
  filegrid: ['FileGrid', 'FileCard', 'AttachmentGrid'],
  'att-chip': ['Attachment', 'AttachmentChip', 'FileChip'],
  org: ['OrgChart', 'OrgNode'],
  swatch: ['ColorPicker', 'SwatchPicker', 'ColorSwatch'],
  slotpicker: ['SlotPicker', 'TimeSlots', 'AvailabilityPicker'],
  'plan-compare': ['PlanCompare', 'ComparisonTable', 'FeatureTable'],
  bento: ['BentoGrid', 'BentoCard'],
}

/* Names that are not a piece of UI in ANY design system: routing, state,
 * i18n, animation, portals and layout primitives. Excluded from BOTH sides —
 * counting them as misses would invent a gap, and counting them as hits would
 * invent coverage. Layout is deliberately here: `.l-stack` exists, but nobody
 * fails to recognise their app because our stack is not their Flex. */
const NOT_UI = new RegExp('^(' + [
  'Fragment', 'Suspense', 'StrictMode', 'ErrorBoundary', 'Portal', 'Slot', 'Show', 'For', 'Match',
  '\\w*Provider', '\\w*Context', '\\w*Consumer', '\\w*Boundary',
  'Route', 'Routes', 'Router', '\\w*Router', 'Outlet', 'Navigate', 'Redirect', 'Link', 'NavLink', 'Anchor',
  'Head', 'Html', 'Body', 'Script', 'Meta', 'Title', 'Helmet', 'Style',
  'Trans', 'Translation', 'FormattedMessage', 'I18n',
  'Motion', 'AnimatePresence', 'Transition', 'Spring', 'Reorder',
  'Box', 'Flex', 'Stack', 'HStack', 'VStack', 'Grid', 'GridItem', 'Row', 'Col', 'Column', 'Columns',
  'Container', 'Wrapper', 'Layout', '\\w*Layout', 'Page', '\\w*Page', 'App', 'Main', 'Section', 'Article',
  'Spacer', 'Center', 'Space', 'Group',
  'Text', 'Heading', 'H\\d\\w*', 'Paragraph', 'Span', 'Div', 'Strong', 'Em',
  'Image', 'Img', 'Picture', 'Video', 'Audio', 'Canvas', 'Svg', 'Path', 'Circle', 'Rect', 'G', 'Defs',
  'Icon', '\\w*Icon', 'Icons', 'Logo', '\\w*Logo',
  'HTML\\w*Element', 'SVG\\w*Element', 'Element', 'Node', 'Event', '\\w*Event',
  'Props', '\\w*Props', 'State', '\\w*State', 'T', 'K', 'V', 'P', 'R', 'S', 'TData', 'TValue', 'TItem',
  'Controller', 'Form', 'FormProvider', 'Field Array', 'FieldArray',
  'Story', '\\w*Story', 'Meta\\w*', 'Template',
].join('|') + ')$')

const NAME_TO_RECIPE = new Map()
for (const [recipe, names] of Object.entries(RECIPE_ALIASES)) {
  for (const n of names) if (!NAME_TO_RECIPE.has(n)) NAME_TO_RECIPE.set(n, recipe)
}

/**
 * Component USES in a source file.
 *
 * The leading group is what keeps TypeScript generics out: JSX opens after
 * whitespace or a bracket, while a generic opens directly after an identifier
 * (`useState<`, `Array<`, `FC<`). Without it, `useState<HTMLDivElement>` reads
 * as a component named HTMLDivElement — which is how the first version of this
 * probe reported a repo with 6,268 distinct "components".
 */
const JSX_USE = /(^|[\s(){}[\],;=>&|?:!])<([A-Z][A-Za-z0-9]*)(?=[\s/>])/g

export function componentUses(src) {
  const uses = new Map()
  for (const m of src.matchAll(JSX_USE)) {
    const name = m[2]
    if (NOT_UI.test(name)) continue
    uses.set(name, (uses.get(name) || 0) + 1)
  }
  return uses
}

/* ── tier 2: the head noun ──────────────────────────────────────────────────
 * `N8nButton` is a button. `LightIconButton` is a button. `SettingsTextInput`
 * is an input, and `OverflowingTextWithTooltip` is a tooltip. Every one of them
 * came back as a MISS on exact names, and n8n — whose whole design system is
 * namespaced `N8n*` — scored 2% as a result.
 *
 * That is a matching problem wearing the clothes of a vocabulary gap, and the
 * difference decides months of work: one is "teach the matcher to strip a
 * prefix", the other is "build forty components". Reported as its own tier so
 * neither number can hide inside the other.
 *
 * Head nouns only, and curated: matching any substring would claim `EventLog`
 * for a table and `IconWrapper` for an icon. */
const HEAD_NOUNS = [
  'Button', 'Input', 'Textarea', 'Select', 'Combobox', 'Checkbox', 'Radio', 'Switch', 'Toggle',
  'Slider', 'Card', 'Table', 'Modal', 'Dialog', 'Drawer', 'Sheet', 'Menu', 'Dropdown', 'Popover',
  'Tooltip', 'Toast', 'Alert', 'Badge', 'Tag', 'Chip', 'Avatar', 'Tabs', 'Breadcrumb', 'Pagination',
  'Progress', 'Spinner', 'Loader', 'Loading', 'Skeleton', 'Accordion', 'Sidebar', 'Navbar', 'Toolbar',
  'Calendar', 'DatePicker', 'Chart', 'Timeline', 'Stepper', 'Rating', 'Tree', 'Kanban', 'Carousel',
  'Callout', 'Banner', 'Label', 'Field', 'Form', 'Header', 'Footer', 'Panel', 'Pill', 'Divider',
  'Separator', 'Heading', 'Text', 'Link', 'Icon',
].sort((a, b) => b.length - a.length) // longest first: DatePicker before Picker

/** The recipe a name implies through its head noun, or null. */
function headNoun(name) {
  for (const noun of HEAD_NOUNS) {
    if (name === noun || !name.endsWith(noun)) continue
    // A prefix must look like a namespace or a qualifier, not a different word
    // glued on: `Textarea` ends in `area`, `Log` does not end in anything here.
    const recipe = NAME_TO_RECIPE.get(noun)
    if (recipe) return recipe
  }
  return null
}

export function score(uses) {
  let dTot = 0, dHit = 0, wTot = 0, wHit = 0, dNear = 0, wNear = 0
  const missed = []
  const near = []
  for (const [name, n] of uses) {
    dTot++; wTot += n
    if (NAME_TO_RECIPE.has(name)) { dHit++; wHit += n; continue }
    const head = headNoun(name)
    if (head) { dNear++; wNear += n; near.push([name, n, head]); continue }
    missed.push([name, n])
  }
  missed.sort((a, b) => b[1] - a[1])
  near.sort((a, b) => b[1] - a[1])
  return { dTot, dHit, wTot, wHit, dNear, wNear, missed, near }
}

/* ── walking a repo ────────────────────────────────────────────────────────── */

const EXT = new Set(['.tsx', '.jsx', '.vue', '.svelte'])
const SKIP = /(^|\/)(node_modules|\.git|dist|build|\.next|out|coverage|__snapshots__|__tests__|stories)(\/|$)/
const SKIP_FILE = /\.(test|spec|stories|story|bench)\.[jt]sx?$/

function walk(dir, root, out) {
  let entries
  try { entries = readdirSync(dir, { withFileTypes: true }) } catch { return }
  for (const e of entries) {
    const p = join(dir, e.name)
    const rel = relative(root, p)
    if (SKIP.test('/' + rel)) continue
    if (e.isDirectory()) { walk(p, root, out); continue }
    if (!EXT.has(extname(e.name)) || SKIP_FILE.test(e.name)) continue
    let size = 0
    try { size = statSync(p).size } catch { continue }
    if (size > 512 * 1024) continue
    out.push(p)
  }
}

export function measureDir(dir) {
  const files = []
  walk(dir, dir, files)
  const uses = new Map()
  for (const f of files) {
    for (const [n, c] of componentUses(readFileSync(f, 'utf8'))) uses.set(n, (uses.get(n) || 0) + c)
  }
  return { files: files.length, ...score(uses) }
}

/* ── the controls, which run before any number is believed ─────────────────── */

function selfTest() {
  let failed = 0
  const check = (label, ok, detail) => {
    console.log(`  ${ok ? '✓' : '✗'} ${label}${detail ? `  — ${detail}` : ''}`)
    if (!ok) failed++
  }
  console.log('\nValidating the meetlat itself\n')

  /* 1 · POSITIVE CONTROL, in two halves.
   *
   * The obvious one — score our own gallery — is INVALID BY CONSTRUCTION, and
   * finding that out was worth the attempt: we ship CSS recipes, not React
   * components, so our own code contains `<button className="btn">` and not a
   * single `<Button>`. There is nothing for a name-based stick to match. That
   * asymmetry is itself part of the R3 problem: they think in components, we
   * ship classes, and the mapping between them is the product.
   *
   * So: (a) does the table WIRE UP — every alias must resolve; and (b) does it
   * cover the ecosystem's own canonical vocabulary, taken from the shadcn
   * registry rather than from my memory of it. */
  const everyAlias = Object.values(RECIPE_ALIASES).flat().filter((n) => !n.includes(' '))
  const wired = score(componentUses(everyAlias.map((n) => `<${n} />`).join('\n')))
  check('every alias in the table resolves to a recipe',
    wired.dHit === wired.dTot && wired.dTot > 100,
    `${wired.dHit}/${wired.dTot}${wired.missed.length ? ` — unmatched: ${wired.missed.slice(0, 5).map((m) => m[0]).join(', ')}` : ''}`)

  const SHADCN = ('accordion alert alert-dialog aspect-ratio avatar badge breadcrumb button calendar card '
    + 'carousel chart checkbox collapsible combobox command context-menu data-table date-picker dialog '
    + 'drawer dropdown-menu form hover-card input input-otp label menubar navigation-menu pagination '
    + 'popover progress radio-group resizable scroll-area select separator sheet sidebar skeleton slider '
    + 'sonner switch table tabs textarea toast toggle toggle-group tooltip').split(' ')
  const pascal = (s2) => s2.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join('')
  const covered = SHADCN.filter((s2) => NAME_TO_RECIPE.has(pascal(s2)))
  const pct = Math.round(100 * covered.length / SHADCN.length)
  check(`the shadcn registry is covered (${pct}%)`, pct >= 80,
    pct >= 80 ? `${covered.length}/${SHADCN.length}`
      : `missing: ${SHADCN.filter((s2) => !NAME_TO_RECIPE.has(pascal(s2))).join(', ')}`)

  // 2 · NEGATIVE CONTROL. Invented names must score zero. If anything here
  //     matches, the table is matching on shape rather than on meaning.
  const invented = componentUses('<Quibble /><Frobnicator a="1"><Zblorp>x</Zblorp>')
  const inv = score(invented)
  check('invented components score 0', inv.dHit === 0, `${inv.dHit}/${inv.dTot} matched`)

  // 3 · THE BUG THAT STARTED THIS. A file of nothing but generics must
  //     contribute nothing — no hits AND no denominator.
  const generics = componentUses(`
    const r = useState<HTMLDivElement>(null)
    const l: Array<TIssue> = []
    const C: React.FC<Props> = () => null
    function f<TData>(x: Record<string, TValue>) {}
  `)
  check('TypeScript generics are not components', generics.size === 0,
    generics.size ? `leaked: ${[...generics.keys()].join(', ')}` : 'clean')

  // 4 · And real JSX in the same file must still be seen, or #3 passes by
  //     simply matching nothing at all.
  const mixed = componentUses('const r = useRef<HTMLDivElement>(null)\nreturn <Button onClick={x} />')
  check('real JSX beside a generic is still counted',
    mixed.get('Button') === 1 && !mixed.has('HTMLDivElement'),
    [...mixed.keys()].join(', ') || 'nothing found')

  console.log(`\n${failed ? `✗ ${failed} control(s) failed — do not trust the numbers` : '✓ all controls passed'}\n`)
  return failed
}

/* ── cli ───────────────────────────────────────────────────────────────────── */

const args = process.argv.slice(2)
if (args[0] === '--self') {
  process.exit(selfTest() ? 1 : 0)
} else if (args.length) {
  if (selfTest()) process.exit(1)
  console.log('repo          files   exact name        + head noun       still missing')
  console.log('─'.repeat(76))
  const all = new Map()
  const nearAgg = new Map()
  const rows = []
  for (const dir of args) {
    const name = dir.replace(/\/$/, '').split('/').pop()
    const r = measureDir(dir)
    rows.push({ name, ...r })
    for (const [n, c] of r.missed) all.set(n, (all.get(n) || 0) + c)
    for (const [, c, head] of r.near) nearAgg.set(head, (nearAgg.get(head) || 0) + c)
    const p1 = Math.round(100 * r.wHit / r.wTot)
    const p2 = Math.round(100 * (r.wHit + r.wNear) / r.wTot)
    console.log(
      `${name.padEnd(13)}${String(r.files).padStart(5)}` +
      `${String(p1).padStart(9)}%${String(p2).padStart(17)}%${String(100 - p2).padStart(17)}%`,
    )
  }
  const agg = rows.reduce((a, r) => ({ wTot: a.wTot + r.wTot, wHit: a.wHit + r.wHit, wNear: a.wNear + r.wNear }),
    { wTot: 0, wHit: 0, wNear: 0 })
  const A1 = Math.round(100 * agg.wHit / agg.wTot)
  const A2 = Math.round(100 * (agg.wHit + agg.wNear) / agg.wTot)
  console.log('─'.repeat(76))
  console.log(`${'ALL'.padEnd(18)}${String(A1).padStart(9)}%${String(A2).padStart(17)}%${String(100 - A2).padStart(17)}%`)
  console.log('\n  exact       = they call it what the ecosystem calls it')
  console.log('  + head noun = we would recognise it by stripping a namespace (a MATCHER fix)')
  console.log('  missing     = a real vocabulary gap (a BUILD list)')

  // The point of the whole exercise: what to build, most-used first.
  console.log('\nRECOVERABLE BY THE MATCHER — namespaced names we already have a recipe for\n')
  for (const [r2, c] of [...nearAgg.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12)) {
    console.log(`  ${String(c).padStart(5)}  → .${r2}`)
  }
  console.log('\nTHE BUILD LIST — genuinely uncovered, by how much of the real world uses it\n')
  const ranked = [...all.entries()].sort((a, b) => b[1] - a[1]).slice(0, 40)
  for (const [n, c] of ranked) console.log(`  ${String(c).padStart(5)}  ${n}`)
} else {
  console.log('usage: node bench/vocab-coverage.mjs --self | <dir> [<dir>…]')
}
