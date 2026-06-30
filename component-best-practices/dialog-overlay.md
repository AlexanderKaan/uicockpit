# Dialog & overlay surfaces — best-practice library + compliance scan

> Components: `.dialog` · `.dialog--alert` · `.sheet` · `.toast` / `.toast-stack` · `.lightbox` · `.popover` · `.hover-card` ·
> recipes `cockpit/src/kit/recipes/index.ts`: dialog `2687–2738` · lightbox `2329–2343` · toast-stack `3516–3613` · popover `3681–3721` · hover-card `3724–3766` · sheet-drawer `3769–3826` · alert-dialog `4000–4019`. Modal contract in `src/stage/views/apps/AppHelpers.tsx:88–127` (`useModal`); keyframes/scrim/focus in `src/kit/globalLayer.ts` + `src/tokens/buildTokens.ts:844–855` · scanned 2026-06-30

This is the **overlay-surface idiom**: a class of components that float above the page, owe a backdrop +
focus + dismissal contract, and share an enter-animation grammar. The recipe CSS owns the *look* (surface,
scrim token, radius, shadow, animation); the *behavior* (focus-trap, ESC, focus-return, scroll-lock,
auto-dismiss) is JS and is delegated to `useModal` / per-card handlers — so the **Delegated?** column is
load-bearing for almost every behavioral rule here.

## A. Best-practice library (supply)

Grouped by theme. Each: **Rule** — *why* — `the CSS/token (or JS contract) that implements it`.

### Scrim / backdrop
1. **A dimmed, inert backdrop sits behind every modal overlay.** [LOAD-BEARING] — *the scrim signals "the page underneath is paused" and provides the click-to-dismiss target; `aria-modal="true"` promises the outside is inert.* — `.dialog-frame__backdrop { background: var(--k-scrim) }`, `.sheet-frame__backdrop`, `.lightbox { background: var(--k-scrim-strong) }`.
2. **Two scrim weights: standard (~0.4) for dialogs/sheets, strong (~0.86) for full-bleed media.** [polish] — *a photo lightbox wants near-black so the image pops; a confirm dialog wants the page faintly visible for context.* — `--k-scrim: rgba(0,0,0,0.4)` · `--k-scrim-strong: rgba(0,0,0,0.86)` (`buildTokens.ts:845–846`).
3. **The backdrop fades in (it must not pop).** [polish] — *an instant black flash reads as a glitch; a 160–200ms fade reads as "a layer arrived".* — `.dialog-frame__backdrop { animation: k-fade-in … }`, `.lightbox { animation: …k-fade-in }`.

### Focus & keyboard (the modal contract)
4. **On open, focus moves into the dialog (first focusable, or the dialog itself).** [LOAD-BEARING] — *a keyboard/SR user is otherwise stranded behind the scrim.* — `useModal`: `(focusables()[0] ?? el)?.focus()`.
5. **Tab/Shift+Tab are trapped inside the surface (wrap at both ends).** [LOAD-BEARING] — *without a trap, Tab escapes to the still-rendered page and the URL bar; the "inert outside" promise breaks.* — `useModal` keydown: first/last wrap.
6. **ESC closes the overlay.** [LOAD-BEARING] — *the universal "get me out" affordance (APG dialog pattern).* — `useModal`: `if (e.key === 'Escape') onClose()`.
7. **On close, focus RETURNS to the trigger.** [LOAD-BEARING] — *focus left on `<body>` dumps the user at the top of the page; APG requires return to the opener.* — `useModal` cleanup: `prevFocus.current?.focus()`.
8. **Body scroll is locked while the overlay is open.** [LOAD-BEARING] — *scrolling the page behind a modal is disorienting and lets focusable page content stay reachable.* — `useModal`: `document.body.style.overflow = 'hidden'`.

### ARIA roles
9. **`role="dialog"` + `aria-modal="true"` + `aria-labelledby` on the surface.** [LOAD-BEARING] — *names the dialog for SRs and declares the outside inert.* — gallery: `<div className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">`.
10. **A destructive confirm is `role="alertdialog"` (not `dialog`) and points its CTA at danger.** [LOAD-BEARING] — *`alertdialog` makes SRs announce the body immediately as a high-stakes interruption; the red CTA + soft icon signal irreversibility.* — `.dialog--alert { border-left: 3px solid var(--k-danger) }` + `role="alertdialog"`, CTA `btn--danger`.
11. **A popover that is a real interactive panel takes `role="dialog"`; a passive hint takes `role="note"`.** [polish] — *role honesty — a profile-edit popover is a dialog; an "opens above" annotation is a note.* — gallery popover `role="dialog"`; placement demos `role="note"`.

### Structure & footer closure
12. **Header / body / footer are three distinct zones; the footer is a full-bleed divider bar that CLOSES the box.** [LOAD-BEARING] — *a bare action row floating at the bottom doesn't read as "the commit zone"; the divider reaching both edges is the L10 closure law.* — `.dialog__foot { margin: … calc(-1*--k-pad) …; border-top: var(--k-divider) }` (shared sunken-bar pattern with `.sheet__foot` / `.card__foot`).
13. **Actions are right-aligned, one primary, secondary = ghost, primary last (reading order).** [LOAD-BEARING] — *the eye lands on the rightmost/loudest control; "Cancel … Confirm" matches platform convention.* — `.dialog__foot { justify-content: flex-end; gap: --k-gap }`, usage: `btn--ghost` Cancel + `btn--danger/primary` confirm.
14. **The title uses the shared panel-heading rule (one type ramp across card/dialog/sheet).** [polish] — *coherence — a dialog title shouldn't be a bespoke size.* — `.card__title, .dialog__title, .sheet__title { … }` (`index.ts:561`).

### Scroll within a tall overlay (sticky head/foot)
15. **A tall dialog scrolls its BODY only; header + footer stay pinned.** [LOAD-BEARING] — *a 600px-tall confirm on a short viewport must keep its title and its Confirm button visible while the middle scrolls; otherwise the CTA scrolls off and the user can't act.* — **dialog: ABSENT** (no `.dialog__head`/`.dialog__body` with `overflow:auto` + `flex` min-height-0). The **sheet** does this: `.sheet__body { flex: 1; overflow: auto }` with pinned `.sheet__head`/`.sheet__foot`.

### Responsive → sheet on mobile
16. **An overlay never exceeds the viewport; on a phone a centered dialog should become a bottom/edge sheet.** [LOAD-BEARING for the cap; polish for the morph] — *a content-sized dialog has no intrinsic width cap; a 360px sheet must not overflow a 320px phone; a tiny centered modal on a phone wastes the edges.* — caps PRESENT: `.dialog { max-width: calc(100vw - 2rem) }`, `.sheet { max-width: 100vw }`. dialog→sheet MORPH: **ABSENT** (no `@media` reflow on `.dialog`).

### Toast / transient feedback
17. **Toasts are tone-coded (success/info/warn/error) by a left accent + icon.** [LOAD-BEARING] — *severity must be legible at a glance and not by color alone (icon backs the hue).* — `.toast--success/info/warn/error { border-left: 3px solid var(--k-…) }` + usage icon per tone.
18. **Each toast is an `aria-live` region: `role="status"` (polite) for info, `role="alert"` (assertive) for errors.** [LOAD-BEARING] — *SRs must announce a toast that appears with no focus change; errors interrupt, successes wait.* — usage: `role={t.tone === 'error' ? 'alert' : 'status'}`.
19. **Auto-dismiss, but ≥5s and (ideally) pause-on-hover/focus.** [polish→LOAD-BEARING for a11y] — *WCAG 2.2.1 (Timing Adjustable): too-fast auto-dismiss fails low-vision/cognitive users; hovering to read should not race a timer.* — usage: `setTimeout(…, 4000)` (4s, **below the 5s floor**); **no pause-on-hover**.
20. **A manual dismiss ✕ always exists; the inline action is never "Dismiss".** [LOAD-BEARING] — *users who need more time must be able to keep/close it; the ✕ owns dismissal, the action owns "Undo/Retry".* — `.toast__close` + `.toast__action` (comment: "NEVER make the action Dismiss").
21. **One snackbar at a time, queued not stacked; capped stack for toasts.** [polish] — *N stacked toasts overwhelm; M3 snackbar = one, queued.* — snackbar CONTRACT documented in CSS comment (consumer-owned); the toast stack itself has **no max-count cap** in usage.
22. **Toasts slide up on enter; heavy surfaces decelerate (not bounce).** [polish] — *motion direction implies origin; a playful spring on a confirm dialog reads as glitch.* — `.toast { animation: …k-slide-up }`; export-only `[role="dialog"][aria-modal] { animation-timing-function: cubic-bezier(.05,.7,.1,1) !important }` (`globalLayer.ts:49`).

### Lightbox / media overlay
23. **Lightbox owes the FULL modal contract + arrow-key prev/next + a position counter + a loading state.** [LOAD-BEARING] — *it's a fullscreen `role="dialog"`; users expect ←/→ to cycle and "3 / 8" to orient.* — `.lightbox` `role="dialog" aria-modal` via `useModal`; `.lightbox__count`, `.lightbox__loading` (spinner with reduced-motion slowdown), `.lightbox__btn--prev/next/close`.

### Motion / reduced-motion
24. **Every overlay enter respects `prefers-reduced-motion`.** [LOAD-BEARING] — *vestibular users; scale/slide must collapse to near-instant.* — global guard cuts all `animation-duration`/`transition-duration` under the media query (`globalLayer.ts:125`); lightbox spinner also has an explicit slowdown.
25. **Enter anchors to its origin via `transform-origin` + a tiered duration.** [polish] — *a popover scales from its trigger corner; a dialog scales from center, slower (more presence).* — `.popover { transform-origin: top left; …k-scale-in }`, `.dialog { transform-origin: center; …k-scale-in var(--k-dur-slow) }`.

### Layering
26. **Overlays sit on a documented z-index scale (popover < modal < tooltip).** [polish] — *predictable stacking prevents a dropdown rendering under a modal.* — `--k-z-popover:50 · --k-z-modal:60 · --k-z-tooltip:70` (`buildTokens.ts:852–855`); `.lightbox { z-index: var(--k-z-modal) }`, `.popover { z-index: var(--k-z-popover) }`.

## B. Compliance scan (check)

| # | Rule | Status | Evidence (recipe line/snippet, OR usage file, OR "absent") | Delegated? | Severity |
|---|---|---|---|---|---|
| 1 | Dimmed inert backdrop | ✅ PASS | `.dialog-frame__backdrop{background:var(--k-scrim)}`; `.lightbox{background:var(--k-scrim-strong)}` | recipe | — |
| 2 | Two scrim weights | ✅ PASS | `--k-scrim` / `--k-scrim-strong` tokens; lightbox uses strong | recipe+token | — |
| 3 | Backdrop fades in | ✅ PASS | `.dialog-frame__backdrop{animation:k-fade-in}`; `.lightbox{…k-fade-in}` | recipe | — |
| 4 | Focus moves in on open | ⚠️ PARTIAL | `useModal` does it; **lightbox uses `useModal`, but DialogCard/AlertDialogCard/SheetCard do NOT** — they're plain `useState(open)` with no `useModal` ref | gallery (lightbox only) | MED |
| 5 | Tab focus-trap | ⚠️ PARTIAL | Same: `useModal` traps; only lightbox wires it. Gallery dialog/alert/sheet are not focus-trapped | gallery (lightbox only) | MED |
| 6 | ESC closes | ⚠️ PARTIAL | `useModal` ESC; lightbox ✅. Dialog/alert/sheet cards close only via button/backdrop click — **no ESC** | gallery (lightbox only) | MED |
| 7 | Focus returns to trigger | ⚠️ PARTIAL | `useModal` returns; lightbox ✅. Dialog/alert/sheet **don't** | gallery (lightbox only) | MED |
| 8 | Body scroll-lock | ⚠️ PARTIAL | `useModal` locks; lightbox ✅. Dialog/alert/sheet **don't** (they live inside a `.dialog-frame`, so less critical in-demo, but the pattern isn't shown) | gallery (lightbox only) | LOW |
| 9 | role=dialog + aria-modal + labelledby | ✅ PASS | gallery: `role="dialog" aria-modal="true" aria-labelledby="dialog-title"` (dialog, sheet, lightbox all) | usage | — |
| 10 | alertdialog + danger CTA | ✅ PASS | `.dialog--alert{border-left:3px solid var(--k-danger)}`; usage `role="alertdialog"` + `btn--danger` + `.dialog__icon` | recipe+usage | — |
| 11 | Popover role honesty | ✅ PASS | gallery popover `role="dialog"`; placement demos `role="note"` | usage | — |
| 12 | Full-bleed footer closure | ✅ PASS | `.dialog__foot{margin:…calc(-1*--k-pad)…;border-top:var(--k-divider)}` (C3 shipped) | recipe | — |
| 13 | Right-aligned, one primary, primary last | ✅ PASS | `.dialog__foot{justify-content:flex-end}`; usage ghost Cancel + danger/primary confirm | recipe+usage | — |
| 14 | Shared title type ramp | ✅ PASS | `.card__title,.dialog__title,.sheet__title{…}` (`index.ts:561`) | recipe | — |
| 15 | **Tall dialog scrolls body, sticky head/foot** | ❌ GAP | `.dialog` has `display:flex;flex-direction:column` but **no `.dialog__head`/`.dialog__body{overflow:auto;min-height:0}`** — a tall dialog grows past the viewport, no sticky head/foot. (`.sheet` HAS this: `.sheet__body{flex:1;overflow:auto}`.) Gallery demos are all short, so usage doesn't cover it either | no | **HIGH** |
| 16 | Viewport cap + dialog→sheet on mobile | ⚠️ PARTIAL | Caps PASS: `.dialog{max-width:calc(100vw - 2rem)}`, `.sheet{max-width:100vw}`. **dialog→sheet morph ABSENT** (no `@media` on `.dialog`) | no (no responsive morph) | MED |
| 17 | Tone-coded toasts | ✅ PASS | `.toast--success/info/warn/error{border-left:3px solid …}` + usage icon-per-tone | recipe+usage | — |
| 18 | aria-live status/alert | ✅ PASS | usage: `role={t.tone === 'error' ? 'alert' : 'status'}` | usage | — |
| 19 | Auto-dismiss ≥5s + pause-on-hover | ❌ GAP | usage: `setTimeout(…, 4000)` = **4s (< 5s WCAG floor)**; **no pause-on-hover/focus** | no | MED |
| 20 | Manual ✕ always; action ≠ Dismiss | ✅ PASS | `.toast__close` + `.toast__action` (comment forbids "Dismiss" action); snackbar uses "Undo" | recipe+usage | — |
| 21 | One snackbar / capped stack | ⚠️ PARTIAL | snackbar one-at-a-time is a documented CSS **comment contract only**; toast stack in usage has **no max-count cap** (unbounded `setToasts([...t, …])`) | partial (comment) | LOW |
| 22 | Slide-up enter; heavy surface decelerates | ✅ PASS | `.toast{animation:k-slide-up}`; export heavy-surface override (`globalLayer.ts:49`) | recipe+global | — |
| 23 | Lightbox: full contract + arrows + counter + loading | ✅ PASS | `useModal` + `.lightbox__count` + `.lightbox__loading` + prev/next/close btns; arrow-nav wired in usage | recipe+usage | — |
| 24 | prefers-reduced-motion honored | ✅ PASS | global guard cuts animation/transition durations (`globalLayer.ts:125`); lightbox spinner explicit slowdown | global | — |
| 25 | transform-origin + tiered duration | ✅ PASS | `.popover{transform-origin:top left}`; `.dialog{transform-origin:center;…--k-dur-slow}` | recipe | — |
| 26 | Documented z-scale | ✅ PASS | `--k-z-popover/modal/tooltip` 50/60/70; `.lightbox{z-index:var(--k-z-modal)}` | recipe+token | — |

**Tally:** 18 PASS · 6 PARTIAL · 2 GAP (of 26).

## C. Gap worklist (ranked)

1. **[HIGH] Tall-dialog scroll — give `.dialog` a sticky-head/scroll-body structure (rule 15).**
   The dialog is a single flex column with one `--k-pad`; a long body has no scroll container, so a tall
   confirm grows past the viewport and pushes `.dialog__foot` (the CTA) off-screen. Add the same anatomy the
   sheet already has:
   ```css
   .dialog { max-height: calc(100dvh - 4rem); }          /* never taller than the viewport */
   .dialog__head { /* full-bleed like __foot, but border-BOTTOM */ }
   .dialog__body { flex: 1 1 auto; min-height: 0; overflow: auto; /* the ONLY scroll zone */ }
   ```
   `.dialog__foot` already cancels `--k-pad` and pins; mirror it for `__head`. Then add a tall-content gallery
   demo so the scroll is exercised (and so `audit:modifiers` sees any new `--head/__body` class demonstrated).

2. **[MED] Wire `useModal` into the gallery Dialog / AlertDialog / Sheet cards (rules 4–8).**
   The contract exists and the lightbox proves it — but the three most canonical overlays in the gallery skip
   it, so the demos don't show focus-trap / ESC / focus-return / scroll-lock. One line each:
   `const ref = useModal(open, () => setOpen(false))` on the `.dialog`/`.sheet` element. This is the single
   biggest "the kit *says* it does the contract but the flagship demos don't" gap; it's a usage fix, not a
   recipe change.

3. **[MED] dialog→sheet responsive morph (rule 16).**
   Add an opt-in `@media (max-width: …)` (or a `.dialog--sheet` modifier) that drops the centered dialog to a
   bottom-anchored full-width sheet with a top radius only — the iOS/Material pattern. The viewport *caps* are
   already correct; this is the "use the phone's edges" upgrade.

4. **[MED] Toast auto-dismiss → ≥5s + pause-on-hover (rule 19).**
   In `ToastStackCard`, raise `4000`→`5000` (WCAG 2.2.1 floor) and clear/restart the timer on
   `onMouseEnter`/`onFocus` of the toast. Behavior-only (usage), but it's the kit's reference implementation.

5. **[LOW] Cap the toast stack / enforce one-snackbar (rule 21).**
   The snackbar "one at a time, queue don't stack" is a CSS comment only; the demo stack is unbounded. Cap the
   array (e.g. keep last 3) and queue snackbars in the reference usage so the contract is shown, not just told.

## D. Loop notes (meta)

- **Research half = cheap and decisive.** APG dialog-modal + the toast-a11y/WCAG-2.2.1 sources nailed every
  behavioral rule on the first two searches; the overlay idiom is one of the most-documented patterns in the
  field, so the SUPPLY library is high-confidence.
- **The Delegated? column did real work — and it cut both ways.** It rescued the lightbox (CSS has no
  focus-trap, but `useModal` in usage handles it → PASS) AND it *exposed* a real shortfall: the SAME contract
  is NOT delegated for Dialog/AlertDialog/Sheet (plain `useState`, no `useModal`), so a CSS-only scan would
  have false-PASS'd "focus-trap present" for the whole family. Reading the gallery line-by-line is what turned
  that into the honest PARTIAL on rules 4–8.
- **One genuine recipe GAP (no false positive):** rule 15 (tall-dialog sticky-head/scroll-body) is absent in
  BOTH recipe and usage — the sheet has it, the dialog doesn't, and no demo is tall enough to need it. This is
  the one to cash first; it's the overlay sibling of the sticky-table research.
- **Format verdict:** A (the library) is durable `get_design_context`/skill knowledge — the overlay contract
  is stable. B/C is a point-in-time scan that goes stale the moment a `useModal` call is added. **Mechanizable
  into `audit:craft`:** "if `.dialog` exists, a `.dialog__body{overflow:auto}` scroll zone must too" (rule 15),
  and "every `role=dialog`/`alertdialog` surface in the gallery must carry a `useModal` ref" (rules 4–8) — both
  are structural ENFORCE-rail candidates so a closed gap can't silently reopen.

---
Sources: [W3C APG Dialog (Modal) Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) · [Adrian Roselli — Defining 'Toast' Messages](https://adrianroselli.com/2020/01/defining-toast-messages.html) · [Sara Soueidan — Accessible notifications with ARIA Live Regions](https://www.sarasoueidan.com/blog/accessible-notifications-with-aria-live-regions-part-2/) · [React Aria (Adobe) — Toast](https://react-aria.adobe.com/Toast) · [WCAG issue 976 — 2.2.1 Timing & toasts](https://github.com/w3c/wcag/issues/976)
