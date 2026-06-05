# Cockpit — Icon System (the one part to change)

## The decision

The reference fakes five "icon styles" (hairline / line / rounded / bold / solid)
by drawing one set of ~20 in-house icons and varying stroke width. That gives
limited personality — it is one set with a slider, not five characters.

The real product must use **five genuine, off-the-shelf icon libraries**. Each of
the five "Icons" options in the panel maps to a real, installable library with
its own distinct personality. Only the selected library needs to load at a time.

## The five libraries

Chosen so the five genuinely differ in character, and all are free, open-source,
and available as npm packages (so they can ship with the build — no runtime CDN
dependency required):

| Panel option | Library              | npm package        | Character |
|--------------|----------------------|--------------------|-----------|
| Hairline     | Feather Icons        | `react-feather`    | Thin, even 2px stroke, minimal |
| Line         | Lucide               | `lucide-react`     | Balanced stroke, the modern default |
| Rounded      | Phosphor (regular)   | `@phosphor-icons/react` | Soft, round terminals, friendly |
| Bold         | Phosphor (bold)      | `@phosphor-icons/react` | Heavy weight, confident |
| Solid        | Heroicons (solid)    | `@heroicons/react`  | Filled, no stroke, high presence |

Notes:

- Phosphor ships multiple weights in one package; "Rounded" uses `weight="regular"`
  and "Bold" uses `weight="bold"`. They are visually distinct enough to be two
  separate panel options.
- Heroicons solid is filled; it is the natural "solid" choice.
- All five are MIT/ISC licensed — fine to bundle.
- Load only the selected library's icons. With tree-shaking + per-icon imports
  this happens naturally; if you prefer, lazy-load each library's icon module so
  an unused library is never in the bundle path.

## The icon set Cockpit actually uses

Cockpit's preview and demo dashboard use **20 icon concepts**. Every library must
provide all 20. Each library names its icons differently, so a mapping table is
required — one per library. The concept name is Cockpit's internal name (used in
code as `<Icon name="...">`); the other columns are that library's export name.

| Concept | Feather        | Lucide        | Phosphor        | Heroicons (solid)      |
|---------|----------------|---------------|-----------------|------------------------|
| check   | Check          | Check         | Check           | CheckIcon              |
| chevD   | ChevronDown    | ChevronDown   | CaretDown       | ChevronDownIcon        |
| chevR   | ChevronRight   | ChevronRight  | CaretRight      | ChevronRightIcon       |
| chevL   | ChevronLeft    | ChevronLeft   | CaretLeft       | ChevronLeftIcon        |
| plus    | Plus           | Plus          | Plus            | PlusIcon               |
| x       | X              | X             | X               | XMarkIcon              |
| bell    | Bell           | Bell          | Bell            | BellIcon               |
| spark   | Star *         | Sparkles      | Sparkle         | SparklesIcon           |
| dots    | MoreHorizontal | MoreHorizontal| DotsThree       | EllipsisHorizontalIcon |
| info    | Info           | Info          | Info            | InformationCircleIcon  |
| edit    | Edit2          | Pencil        | PencilSimple    | PencilIcon             |
| trash   | Trash2         | Trash2        | Trash           | TrashIcon              |
| file    | File           | File          | File            | DocumentIcon           |
| home    | Home           | Home          | House           | HomeIcon               |
| grid    | Grid           | LayoutGrid    | GridFour        | Squares2X2Icon         |
| chart   | BarChart2      | BarChart3     | ChartBar        | ChartBarIcon           |
| cog     | Settings       | Settings      | Gear            | Cog6ToothIcon          |
| upload  | Upload         | Upload        | UploadSimple    | ArrowUpTrayIcon        |
| search  | Search         | Search        | MagnifyingGlass | MagnifyingGlassIcon    |
| cal     | Calendar       | Calendar      | Calendar        | CalendarIcon           |

\* Feather has no "sparkles" icon; `Star` is the closest substitute. If a closer
match exists at build time, prefer it — the goal is a small decorative accent
icon.

**Verify every name against the installed package version before shipping.**
Icon libraries rename and add/remove icons between releases; this table reflects
the libraries as of early 2026 but the build must confirm each export exists. A
missing icon must fail loudly (build error or visible placeholder), never
silently render nothing.

## Implementation shape

Replace the reference's hand-drawn `Icon` component with a thin adapter:

```
<Icon name="search" />   // Cockpit concept name — unchanged throughout the app
```

Internally, `Icon` looks at the current `iconSet` decision, picks the right
library, maps the concept name to that library's export name, and renders it.
Phosphor's weight prop distinguishes Rounded from Bold. Size everything to a
consistent 15px box (the reference uses a fixed 15px; keep that — it fixed an
earlier bug where unconstrained SVGs ballooned).

## The panel control — what the user sees

In the reference, all five "Icons" tiles show the same star, just thicker/thinner.
That should change: **each tile shows a different, representative icon, drawn in
that library's real style.** So the Feather tile might show its actual `Search`,
the Phosphor-bold tile its actual `Gear`, etc. — letting the user feel each
library's personality directly from the panel. Pick five icons that show off the
differences well.

## Why this stays preview-only

Cockpit does not export icon files. The BRIEF.md and tokens.json already carry
the icon choice as an *instruction* — e.g. "this kit uses Lucide" — and the user
installs that library themselves. Loading the five libraries into Cockpit is
purely so the live preview and demo dashboard show the real thing. The export
contract does not change: still a recommendation, not a bundled icon set.
