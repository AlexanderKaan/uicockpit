# UICockpit drift-bench

Does a design system with a **checkable contract** actually keep an AI agent
on-system — or is it just a nudge? This benchmark measures it.

## The protocol

Same build tasks (`prompts.json`), each built twice by an AI agent:

- **with kit** — the agent is given the UICockpit pack (`kit/uicockpit.tokens.css`
  + `kit/design.md` + the contract) and told to style only with the `--k-*`
  tokens and the component recipes.
- **without kit** — the agent builds the same task with its own design judgment,
  plain HTML + CSS.

Then the **real verifier** scores each output — no human grading:

```
uicockpit check --strict <output-dir>
```

A violation is any drift the contract forbids: a raw hex/rgb/hsl colour, off-grid
spacing, an off-scale radius or font-size, an unknown token. Under `--strict`
every one fails the build. **The score is the violation count; the delta between
the two conditions is the evidence.**

## Run it

```bash
# 1. generate the kit pack the with-kit builders read
cd bench/kit && npx uicockpit init <hash>

# 2. have an agent build each prompt into runs/<id>/{with,without}/  (see prompts.json)

# 3. score
node bench/score.mjs        # → prints the table + writes results.json
```

`runs/` (the generated outputs) and `kit/` (the fetched pack) are gitignored;
`prompts.json`, `score.mjs` and `results.json` are the durable record.

## Why this is the honest test

An agent's *discipline doesn't survive a fresh context window* — it defaults to
its own greys and indigo, drifts the details (h1 26 vs 30, padding 32 vs 40). A
prompt that only *describes* the system nudges; a **contract a verifier enforces**
is the thing that actually binds. This bench is that claim, measured.
