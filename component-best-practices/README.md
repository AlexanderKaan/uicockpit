# component-best-practices — the per-component craft knowledge base + scans

Each `<component>.md` here is one run of the **supply→check loop**:

- **A. Best-practice library (SUPPLY)** — the field's best practices for this
  component, research-grounded, each rule with its *why* + the CSS/token that
  implements it, marked `[LOAD-BEARING]` or `[polish]`. This half is **durable
  knowledge** — the teaching content a skill / `get_design_context` card reasons from.
- **B/C. Compliance scan + gap worklist (CHECK)** — our REAL recipe *and its usage*
  scanned against the library, gaps ranked by severity with one-line fixes. This half
  is **point-in-time** — it goes stale the moment the recipe changes, so **re-run it
  on demand**, don't trust a frozen copy.
- **D. Loop notes** — meta: was the research cheap, did the scan find real gaps, which
  LOAD-BEARING rows are mechanizable into the `audit:craft` ratchet.

## How to add or refresh a component

Run the **`component-best-practice-audit`** skill (`.claude/skills/`). It spawns one
agent that does both halves and writes/overwrites the doc here using the shared
A/B/C/D template — identical headings across components so they stay comparable.

## The one rule that makes the scan honest

The CHECK half must read the **usage** (`ComponentGallery.tsx` + `showcases/`), not
only the recipe CSS. Patterns handled at the component level (skeleton rows, a Retry
button, an indeterminate checkbox) are PRESENT even when the recipe only ships a
primitive — a CSS-only scan flags them as false-positive gaps.

## Done so far

| Component | Doc | Gaps cashed |
|---|---|---|
| Table (`.tbl`) | [table.md](table.md) | truncate→atom · `.tbl--card` · frozen-col · hit-target floor |
| Data table (`.datatable`) | [data-table.md](data-table.md) | (skeleton + retry were already shipped; frozen-col via `.tbl__col--frozen`) |
| Calendar (`.calendar*`) | [calendar.md](calendar.md) | now-line · overlap lanes · month event-layer · range hover-preview |

Related: `TABLE-LIST-STICKY-PATTERNS.md` (sticky/scroll research) · `COMPONENT-CRAFT.md`
(the 10 craft laws) · the Invariant Engine (ENFORCE rail) · `uikit-dumb-build` skill
(the composition-determination sibling).
