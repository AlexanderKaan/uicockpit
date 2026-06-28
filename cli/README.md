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

Fetches the configured kit from the CDN and writes two files to the current
directory:

- `uicockpit.tokens.css` — the full kit (CSS variables + component recipes)
- `uicockpit.contract.json` — the machine-checkable contract `check` reads

`--force` overwrites existing files. The hash is the share-key from the
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

## How it fits

`init` and `check` are stateless over the kit **hash** — the same payload behind
the hosted `<link rel="stylesheet" href="https://kit.uicockpit.com/k/<hash>.css">`.
The hash *is* the kit identity, so the contract and the CSS always agree.

Configure a kit at **[uicockpit.com](https://uicockpit.com)** · MIT licensed.
