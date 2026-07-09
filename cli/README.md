# uicockpit

The CLI for [UICockpit](https://uicockpit.com) — give a codebase a real,
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

It also maintains a compact, marker-fenced UICockpit block inside your agent-doc
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

### `uicockpit template [name] [--kit=<hash>] [--force]`

Seed a **starting screen** — dashboard, invoices list, clients, expenses, reports,
documents, AI assistant, plans & billing — as **plain HTML already wearing your
kit**. No name lists the starting screens; with a name it writes `<name>.html`,
pointing the stylesheet at your kit (the hash from `uicockpit.json`, or `--kit=`).

It's a starting point, not a finished page: the markup is pure kit vocabulary
(every class is a recipe), so it's the seed your agent extends — and `uicockpit
check` keeps those edits on-system.

## How it fits

`init` and `check` are stateless over the kit **hash** — the same payload behind
the hosted `<link rel="stylesheet" href="https://kit.uicockpit.com/k/<hash>.css">`.
The hash *is* the kit identity, so the contract and the CSS always agree.

Configure a kit at **[uicockpit.com](https://uicockpit.com)** · MIT licensed.
