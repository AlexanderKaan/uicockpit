# uicockpit

The CLI for [UIcockpit](https://uicockpit.com) — give a codebase a real,
opinionated design system **and keep it consistent**. Generate → apply → **check**.

Most token tools stop at "generate". The `check` command is the difference: it
verifies that the code an AI agent (or a human) writes actually conforms to your
design contract — so the UI doesn't drift back to generic defaults.

Zero dependencies. Node ≥ 18.

## Quick start

```bash
# 1. Pull a kit you configured at uicockpit.com (the hash is in the share URL)
npx uicockpit init <kit-hash>
#    → writes uicockpit.tokens.css + uicockpit.contract.json

# 2. Import the tokens once at your app root (or use the hosted <link>), then
#    build with the --k-* tokens. Tell your AI agent to follow the kit.

# 3. Verify nothing drifted from the contract
npx uicockpit check
```

## Commands

### `uicockpit init <hash> [--force] [--cdn=<url>]`

Fetches the configured kit from the CDN and writes the kit files to the current
directory:

- `uicockpit.tokens.css` — the full kit (CSS variables + component recipes)
- `uicockpit.contract.json` — the machine-checkable contract `check` reads
- `AGENTS.md` — the always-on agent rules (auto-discovered by Cursor, Codex, …)
- `design.md` — the full spec + recipe catalog

It also maintains a compact, marker-fenced UIcockpit block inside your agent-doc
files — `CLAUDE.md`, `.claude/CLAUDE.md`, `.cursorrules` (whichever exist; it
creates `CLAUDE.md` when none do). Re-running `init` refreshes **only** the block
between `<!-- UICOCKPIT:START -->` and `<!-- UICOCKPIT:END -->`; everything you
wrote around it is untouched.

`--force` overwrites existing kit files. The hash is the share-key from the
**"Use this kit"** panel at uicockpit.com.

### `uicockpit check [contract.json] [dir] [--strict]`

Scans a codebase and reports where it drifts from the contract:

| Check | Severity | Catches |
|---|---|---|
| `tokens-exist` | error | `var(--k-*)` that isn't a real token in the kit |
| `known-modifiers` | error | a kit class `root--modifier` that the kit doesn't define |
| `no-raw-color` | warn | raw hex / `rgb()` / `hsl()` instead of a `--k-*` colour token |
| `spacing-grid` | warn | margin/padding/gap px off the 4px grid |
| `radius-scale` | warn | `border-radius` px instead of a `--k-radius-*` token |
| `font-size-scale` | warn | `font-size` px instead of a `--k-type-*` token |

Consumer-owned classes (unknown roots) and token-definition lines are exempt, so
false positives stay low. Exit code: **0** conforms · **1** violations · **2**
setup error. `--strict` makes warnings fail too (good for CI).

```yaml
# CI example
- run: npx uicockpit check --strict
```

**Sanctioned exceptions.** A deliberate off-system line (a partner's brand banner,
a pixel-perfect embed) can be annotated:

```css
.partner-banner { background: #ff5500; } /* uicockpit-allow: partner brand, per marketing */
```

The line's *style* findings are accepted — they never fail the build, even under
`--strict` — but they stay visible in the report under **allowed exceptions**, so
the list doubles as a record of where the system doesn't fit yet. The hatch never
covers the error-level reference checks (`tokens-exist`, `known-modifiers`): a
broken reference is a bug, not a taste decision.

### `uicockpit audit [dir] [--json] [--profile=internal|product] [--no-report]`

For a codebase that has **no kit yet**. `check` compares your code against a
contract you chose; `audit` derives the contract your code already *implies* and
measures how far the code sits from its own system:

```bash
npx uicockpit audit
```

```
  uicockpit audit — 41 files · 1,284 styled elements · profile: internal

  Consistency score   34/100          ███░░░░░░░

  Colour    F   40.2 eff. (budget 16)         ·  63 values, 27 near-dupes
  Type      D   19.4 eff. (budget 8)          ·  61% hardcoded
  Spacing   C   13.8 eff. (budget 10)         ·  23% off-grid
  Radius    B    5.9 eff. (budget 5)
  Shadow    F    9.9 eff. (budget 5)          ·  23 values, 18 occur once

  47 button treatments — 31 occur exactly once
  3 icon libraries · 4 grey ramps · 2 duplicated components

  Report → .uicockpit/audit.html
```

The column is the **effective** variant count, not the raw one: eight radii where
one is used 200× is one system with noise (nEff ≈ 1.3); eight used equally is
eight systems (nEff = 8). It is scale-free, so a bigger repo does not score worse
for being bigger.

`.uicockpit/audit.html` renders the findings instead of listing them — the
swatches, the type specimens, and the **button wall**: every treatment rebuilt
from its own extracted values, singletons marked.

The `Brand` line says where the colour came from — a token your code NAMES
(`--primary`, `$brand`, a `theme.ts` accent) beats the most-used colour, a docs
site's theme never speaks for the app, and a dark or high-contrast redeclaration
never wins over the base. Tailwind names (`bg-indigo-600`) resolve through your
own `--color-*` overrides, then the Tailwind build installed in the repo, then
the defaults Tailwind ships for the generation your CSS declares — and the line
says which. The reader is held to a bench of sixteen public repos — four with the
answer read from their own source, four with the answer read off the **running
product's screen** — and the numbers it prints are the ones you can check against
your own screen in five seconds.

Everything runs **locally**. Nothing is uploaded, there are no network calls, and
no account is needed — free and MIT, permanently.

Three things it deliberately will not do:

- **No LLM in the score.** A number that changes between runs cannot be shared or
  gated on. Counting is static; naming clusters is a separate, later job.
- **No score it cannot justify.** Below 70% scan coverage, or when a dimension has
  too few usages to measure, it says so instead of publishing a number. An absence
  of evidence is never reported as perfect coherence.
- **It measures coherence, not quality.** One global button reused everywhere
  scores perfectly, even if it is ugly.

### `uicockpit forge "<describe a component>" [--json]`

Ask **before** building. The kit's component list is not chosen, it is derived
— the platform has it (HTML), WAI-ARIA APG names it, or a public service ships
it (GOV.UK · USWDS · NL Design System). `forge` points that derivation at a
sentence and answers with a citation:

```bash
npx uicockpit forge "a link above the heading that goes back one step"
```

```
EXISTS — a link above the heading that goes back one step

You already have this: Back link (recipe "backlink"). Its line: APG · Link ·
GOV.UK · Back link. It implements APG Link — and <a href> is the entire pattern.
Page: /components/back-link.

Citations:
  L2 APG · Link            https://www.w3.org/WAI/ARIA/apg/link/
  L4 GOV.UK · Back link    https://design-system.service.gov.uk/components/back-link/
```

Six answers: **EXISTS** (the recipe, its provenance line, its APG keyboard/ARIA
contract, its page, a usage skeleton) · **PLATFORM** (an HTML element the kit's
floor already styles — use the element, do not build a component; the floor
rule is quoted) · **MAY EXIST** (a source names it, nothing covers it yet: what
it owes plus a scaffold in tokens only, its look from the Role Canvas floors) ·
**LOCAL EXTENSION** (only Open UI's census names it) · **DECIDED NOT TO** (with
the reason) · **NO** (nothing names it — the words that were not understood
are listed). Name several things and they come back **COMPOSED**, primary first.
Exit 0 = have it / may build it · 1 = refused. There is no model in it; every
answer is a lookup over the same data the kit's build gate reads.

## How it fits

`init` and `check` are stateless over the kit **hash** — the same payload behind
the hosted `<link rel="stylesheet" href="https://kit.uicockpit.com/k/<hash>.css">`.
The hash *is* the kit identity, so the contract and the CSS always agree.

Configure a kit at **[uicockpit.com](https://uicockpit.com)** · MIT licensed.
