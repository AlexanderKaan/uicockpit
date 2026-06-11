/**
 * The kit's component recipes — the single authored source.
 *
 * MIGRATED ONCE from src/styles/preview.css (scripts/extract-kit.mjs) and now
 * hand-authored here. Both consumers read this array:
 *   - src/export/genCss.ts        → the export / CDN tokens.css
 *   - src/main.tsx (kit inject)   → the live preview
 * There is no second copy to mirror.
 *
 * Each entry is one component family; `css` is static, var(--k-*)-driven CSS
 * (UNSCOPED — a CDN consumer needs `.btn`, not `.cockpit-preview .btn`).
 * Order = emission order in both outputs.
 */
import type { Recipe } from '../types'

export const RECIPES: readonly Recipe[] = [
  {
    id: 'toolbar',
    section: "Toolbar",
    css: `/* === Toolbar ===
   A composition primitive: a horizontal row of controls (search, filters,
   selects, action buttons) that GUARANTEES every direct control child shares
   one height. Tokens make values consistent; they can't stop you putting a
   .btn--sm next to a default .in — this recipe can. It forces all direct
   .btn / .in / .select / .select-trigger children onto a single shared
   height (--tb-h), so adjacent controls always line up regardless of the
   size modifier each carries. Use .toolbar instead of a bare .card__row
   whenever you place mixed controls side by side.
     .toolbar         → md height (the stature default; matches plain controls)
     .toolbar--sm     → compact bar (dense app/table toolbars)
     .toolbar__spacer → flex gap that pushes trailing controls to the right */
.toolbar {
  --tb-h: var(--k-control-h-md);
  display: flex;
  align-items: center;
  /* The gap here separates UNRELATED items/groups — comfortable (--k-space).
     RELATED controls (a filter pair, a label+select, a button cluster) go in a
     .toolbar__group, which sits tight (8px). Two gap levels = the eye reads
     what belongs together. This is the structural answer to "buttons should be
     closer than separate groups": grouping, not one flat gap. */
  gap: var(--k-space, 8px);
  flex-wrap: wrap;
}
.toolbar--sm { --tb-h: var(--k-control-h-sm); }
/* A cluster of related controls — tight 8px between members, so an [Epic][Type]
   filter pair reads as one unit while still sitting --k-space away from the
   search field or the avatar stack. */
.toolbar__group {
  display: inline-flex;
  align-items: center;
  gap: var(--k-gap, var(--k-s-8));
}
/* An inline label that names the control next to it ("Group by", "Sort"). The
   eyebrow tier so it reads as a quiet annotation, not a control. A reusable
   primitive instead of ad-hoc inline styles, so a label+select cluster is
   rebuildable from the export — not preview-only. NOT in the height-invariant
   selector below: it's text, vertically centered by the group, not a control. */
.toolbar__label {
  font-size: var(--k-type-eyebrow);
  font-weight: var(--k-weight-medium);
  color: var(--k-fg-muted);
  text-transform: uppercase;
  letter-spacing: var(--k-track-eyebrow);
  white-space: nowrap;
}
/* Height is forced on controls whether they sit directly in the bar or inside
   a group, so grouping never breaks the one-height invariant. */
.toolbar > .btn,
.toolbar > .in,
.toolbar > .select,
.toolbar > .select-trigger,
.toolbar__group > .btn,
.toolbar__group > .in,
.toolbar__group > .select,
.toolbar__group > .select-trigger {
  min-height: var(--tb-h);
  height: var(--tb-h);
}
.toolbar__spacer { flex: 1 1 auto; min-width: 0; }`,
  },
  {
    id: 'buttons',
    section: "Buttons",
    css: `/* === Buttons ===
   Horizontal padding uses max() against --k-radius-md so it scales when
   the user picks a larger radius. At pill (md=26px) the curve dominates
   the visual width, so we expand padding to keep the label clear of the
   curve — a best-practice rule of thumb: padding-inline >= radius * 0.75. */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--k-s-6);
  /* Default button height is Scale-driven and equals the input height per tier:
   * Compact → 32px · Default → 36px · Comfortable → 40px (shadcn h-8/9/10 family).
   * Padding-block is 0 because min-height + flex centering handles vertical
   * positioning, and removing padding-block keeps the height exact. */
  min-height: var(--k-btn-h, var(--k-btn-h-default, 36px));
  padding-block: 0;
  /* Horizontal padding scales with TWO dimensions:
   *  1. Button height (Scale drives 32/36/40px) — taller buttons need
   *     more side padding to stay optically balanced. height × 0.4
   *     matches Apple HIG / Material defaults.
   *  2. Pill detection — when --k-radius-button is huge (999px), the
   *     curve eats horizontal space, so we add a pill-only bump
   *     proportional to height (≈ ×0.55) so the label clears the curve.
   *     Clamped to 0.55×height to keep pill+bold from going absurd.
   * The 14px floor + radius-md fallback stay as safety nets.  */
  /* --btn-r: the radius THIS button family uses. Solid buttons (primary/
     secondary/danger) follow the button-radius token; ghost controls override
     it to the box radius below — they read as fields / quiet toolbar controls,
     not buttons, so "Button radius" shouldn't reshape them. One var drives BOTH
     the corner and the pill-aware padding so they can never disagree. */
  /* Comp-tier hook (H2 lazy override): --k-btn-radius is NEVER defined by
     default — zero bytes until a consumer/agent sets it ("square corners on
     just my buttons"). Same pattern on the other hooks below. */
  --btn-r: var(--k-btn-radius, var(--k-radius-button, var(--k-radius-md)));
  padding-inline: max(
    14px,
    calc(var(--k-radius-md) * 0.75),
    calc(var(--k-btn-h-default, 34px) * 0.4),
    min(
      calc(var(--btn-r) * 0.5),
      calc(var(--k-btn-h-default, 34px) * 0.55)
    )
  );
  border-radius: var(--btn-r);
  font-size: var(--k-type-small);
  font-weight: var(--k-ui-weight, 600);
  /* line-height: 1 collapses the text line-box to exactly its font-size,
     so the label centers cleanly against icons via align-items: center.
     Without this, inherited 1.15-1.5 line-heights make the text box taller
     than the icon, and the visual baseline of glyphs drifts a pixel or two
     above/below the icon's optical center. */
  line-height: 1;
  text-transform: var(--k-ui-transform, none);
  letter-spacing: var(--k-ui-tracking, 0);
  font-family: var(--k-font-body);
  /* Unified motion — every button animates bg + transform + shadow + filter
   * on the same tokens, so hover-lift and the click-press feel consistent
   * across primary/secondary/ghost/outline/link/icon. */
  transition:
    background var(--k-dur, 200ms) var(--k-ease, ease),
    transform var(--k-dur-fast, 120ms) var(--k-ease, ease),
    box-shadow var(--k-dur-fast, 120ms) var(--k-ease, ease),
    filter var(--k-dur-fast, 120ms) var(--k-ease, ease),
    border-radius var(--k-dur-fast, 120ms) var(--k-spring, var(--k-ease, ease));
  border: max(1px, var(--k-bw)) solid transparent;
  cursor: pointer;
}
/* Unified press (#212 → H2 Press dial) — what :active does is now the
 * --k-press-* token trio (None / Opacity / Scale 0.96 = default / Morph =
 * radius squish, the M3-Expressive 2025 signature). Generic so ghost/
 * outline/link get it too; border-radius transitions via the spring curve
 * so the morph reads springy, not snappy. */
.btn:active:not(:disabled) {
  transform: scale(var(--k-press-scale, 0.96));
  opacity: var(--k-press-opacity, 1);
  border-radius: var(--k-press-radius, var(--btn-r));
}
/* SVG icons inside buttons should never shrink and should render as a
 * standalone flex item, not as inline-text-baseline content. Most preview
 * usage already passes display:block via Lucide, but explicit-here guards
 * against fonts/icons that use vertical-align tricks. */
.btn > svg {
  flex-shrink: 0;
  display: block;
}`,
  },
  {
    id: 'button-finish',
    section: "Button finish",
    css: `/* === Button finish — configurable signature ===========================
 * Three finishes ship out of the box, picked via cfg.buttonFinish:
 *   clean   → soft ambient shadow, no top-highlight, no pressed-inset (default).
 *   tactile → top-edge highlight + pressed-inset on :active (macOS-native).
 *   soft    → larger ambient shadow + bigger lift (Notion/Linear floating).
 * The recipe references three tokens — they're computed in buildTokens
 * based on the user's finish choice. Spring + hover-lift are constant
 * across all three so every finish feels "alive". */
.btn--primary,
.btn--secondary,
.btn--danger {
  box-shadow: var(--k-btn-shadow, var(--k-shadow-sm));
  transition:
    background var(--k-dur, 200ms) var(--k-ease, ease),
    transform var(--k-dur-fast, 140ms) var(--k-ease-spring, cubic-bezier(.34,1.56,.64,1)),
    box-shadow var(--k-dur-fast, 140ms) var(--k-ease-spring, cubic-bezier(.34,1.56,.64,1));
}
.btn--primary:hover:not(:disabled),
.btn--secondary:hover:not(:disabled),
.btn--danger:hover:not(:disabled) {
  transform: translateY(var(--k-btn-lift, -1px));
}
/* Filled buttons add a Material state-layer (brief darken) on top of the
 * unified scale-press — reads as a real "pressed" surface in light & dark. */
.btn--primary:active:not(:disabled),
.btn--secondary:active:not(:disabled),
.btn--danger:active:not(:disabled) {
  filter: brightness(0.94);
  box-shadow: var(--k-btn-shadow-press, none);
}
.btn--primary { background: var(--k-btn-bg, var(--k-primary)); color: var(--k-btn-fg, var(--k-primary-fg)); }
.btn--primary:hover { background: var(--k-primary-hover); }
.btn--secondary { background: var(--k-secondary-soft); color: var(--k-secondary-soft-fg); }
.btn--secondary:hover { filter: brightness(1.02); }
/* Ghost = the quietest control (toolbar filter, dropdown trigger, secondary icon
   action), NOT a primary button — so it follows the box/field radius, not the
   button-radius. Keeps "Button radius" scoped to actual filled buttons. For a
   real button pair (Cancel next to Save), use .btn--secondary, not ghost.
   BORDERLESS (B★3): a ghost is text + a hover wash — no resting border, so it
   reads distinctly quieter than .btn--outline (which IS the bordered-quiet
   variant) and toolbars/icon-buttons stop looking boxy. The shadcn ghost. */
.btn--ghost { background: transparent; color: var(--k-fg); border-color: transparent; }
.btn--ghost:hover { background: var(--k-state-hover); }
.btn--danger { background: var(--k-danger); color: var(--k-danger-fg); }
/* Outline = the shadcn outline variant: neutral surface + foreground text +
   subtle border + a hairline shadow-xs lift. Colour lives on the glyph (Google
   logo etc.), NOT the label — a coloured-text outline reads louder than a quiet
   secondary should. (Was primary-text/primary-border, which competed with the
   real primary CTA.) */
.btn--outline { background: var(--k-surface); color: var(--k-fg); border-color: var(--k-border); box-shadow: var(--k-shadow-xs); }
.btn--outline:hover { background: var(--k-state-hover); }
.btn--link {
  background: transparent;
  color: var(--k-primary);
  padding-inline: 0;
  padding-block: 0;
  text-decoration: underline;
  text-underline-offset: 3px;
}
.btn--link:hover { color: var(--k-primary-hover); }
/* Icon buttons — always a perfect 1:1 square. Previously used asymmetric
 * padding (6px 8px) which let the glyph width drive the button width, so
 * a heart vs a magnifier vs a chevron all rendered different aspect ratios
 * AND the shape morphed when stature / radius changed. Now the geometry
 * is decoupled from content: aspect-ratio + matching min-w/h, padding 0.
 * Border-radius still follows --k-radius-button so sharp themes get
 * rounded-square icon buttons, pill themes get circles. For things that
 * must ALWAYS be round (FAB, save/wishlist, story rings) add .btn--circle. */
.btn--icon {
  width: var(--k-in-h-default);
  height: var(--k-in-h-default);
  min-width: var(--k-in-h-default);
  padding: 0;
  justify-content: center;
  aspect-ratio: 1;
}
/* Icon buttons stay square at every size — re-assert padding:0 so the later
   .btn--sm / .btn--lg padding-inline doesn't squish the glyph's flex box
   (was collapsing icons to ~3px; most visible with thin/small-dot icons). */
.btn--icon.btn--sm { width: var(--k-row-h-sm); height: var(--k-row-h-sm); min-width: var(--k-row-h-sm); padding: 0; }
.btn--icon.btn--lg { width: var(--k-control-h-lg); height: var(--k-control-h-lg); min-width: var(--k-control-h-lg); padding: 0; }
/* Always-round modifier — for FAB / wishlist / save buttons that should
 * read as a circle regardless of theme radius. Pairs with .btn--icon so
 * the geometry is square and the 999px radius lands as a perfect circle. */
.btn--circle { border-radius: 999px; }
/* Size variants — same height/pill-aware padding logic as the base .btn,
 * just with smaller/larger floors. The "row-h" tokens give us the right
 * intrinsic height per tier so the height×0.4 / pill×0.55 math lands
 * proportional even when the user overrides .btn size explicitly. */
.btn--sm {
  min-height: var(--k-row-h-sm, 28px);
  padding-block: 0;
  padding-inline: max(
    10px,
    calc(var(--k-radius-md) * 0.6),
    calc(var(--k-row-h-sm, 28px) * 0.4),
    min(
      calc(var(--btn-r) * 0.5),
      calc(var(--k-row-h-sm, 28px) * 0.55)
    )
  );
  font-size: var(--k-type-eyebrow);
}
.btn--lg {
  min-height: var(--k-control-h-lg);
  padding-block: 0;
  padding-inline: max(
    18px,
    calc(var(--k-radius-md) * 0.85),
    calc(var(--k-control-h-lg) * 0.4),
    min(
      calc(var(--btn-r) * 0.5),
      calc(var(--k-control-h-lg) * 0.55)
    )
  );
  font-size: var(--k-type-body);
}
.btn--link { border-radius: 0; }  /* Link buttons never want a button-radius pill */
/* Full-width block button — fills its container, label stays centered. The
 * dominant card-footer CTA pattern (Save / Review order / Update security).
 * Composes with any variant + size. */
.btn--block { width: 100%; }
/* Loading — width-locked spinner state. The button's element children fade to
 * opacity:0 (keeping the button's width so it doesn't collapse) and a centred
 * spinner draws in the button's own currentColor; pointer events are blocked.
 * Wrap the label in an element (<span>label</span> or an icon) — a bare text
 * node can't be hidden by > *. Pair with aria-busy="true" + disabled on the
 * control for the a11y half. Honours reduced-motion via the k-spin token. */
.btn--loading { position: relative; pointer-events: none; }
.btn--loading > * { opacity: 0; }
.btn--loading::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 1em;
  height: 1em;
  margin: -0.5em 0 0 -0.5em;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: var(--k-anim-spin, k-spin 800ms linear infinite);
}
/* Stacked action buttons (Save / Cancel) sit on the TIGHT --k-stack-gap (8 at
 * default), not the wider field rhythm they'd otherwise inherit from the card's
 * flex gap. The negative margin nets the flex gap (--k-space) down to --k-stack-
 * gap. shadcn pattern: form fields space-y-4/6, action buttons gap-2. */
.card > .btn--block + .btn--block,
.dialog > .btn--block + .btn--block,
.card__col > .btn--block + .btn--block {
  margin-top: calc(var(--k-stack-gap, 8px) - var(--k-space, 16px));
}`,
  },
  {
    id: 'card',
    section: "Card",
    css: `/* === Card ================================================================
 * The fundamental surface container: a bordered, rounded, padded box on the
 * --k-surface plane that holds any component. Anatomy — .card__head (title +
 * desc), the flex body (default), .card__row / .card__col for inline / stacked
 * control clusters, and a hairline-divided .card__foot action zone. Padding
 * follows --k-pad (the card minimum); the internal rhythm follows --k-space so
 * raising padding never balloons the gaps (the shadcn p-6 / space-y split). */
.card {
  display: flex;
  flex-direction: column;
  gap: var(--k-space, 16px);
  box-sizing: border-box;
  margin: 0;
  /* --k-card-* = lazy comp-tier hooks (H2): undefined by default, override
     per-scope to restyle JUST cards without touching the system tokens. */
  padding: var(--k-card-pad, var(--k-pad, 24px));
  background: var(--k-card-bg, var(--k-surface));
  color: var(--k-fg);
  border: 1px solid var(--k-card-border-color, var(--k-border));
  border-radius: var(--k-card-radius, var(--k-radius-lg));
  box-shadow: var(--k-shadow-sm);
}
/* Interactive — a whole card that's one click target (link/button card). Adds
   the affordance the base .card lacks: pointer, a hover lift, an :active press,
   and a focus ring. Put it on a <button>/<a> (the font/text-align resets keep it
   looking like a card, not a button). */
.card--interactive {
  cursor: pointer;
  text-align: left;
  font: inherit;
  width: 100%;
  transition:
    border-color var(--k-dur-fast, 120ms) var(--k-ease, ease),
    box-shadow var(--k-dur-fast, 120ms) var(--k-ease, ease),
    transform var(--k-dur-fast, 120ms) var(--k-ease, ease);
}
.card--interactive:hover { border-color: var(--k-state-border, var(--k-fg-faint)); box-shadow: var(--k-shadow-md); }
.card--interactive:active { transform: translateY(1px); box-shadow: var(--k-shadow-sm); }
.card--interactive:focus-visible { outline: 2px solid var(--k-ring); outline-offset: 2px; }
/* Header reads as a real product heading (shadcn CardHeader) — sentence-case,
 * full --k-fg, display font. */
.card__head { display: flex; flex-direction: column; gap: var(--k-s-2); }
/* Panel-heading recipe — ONE treatment shared by every container title (card,
   dialog, sheet): display font + h3 tier + tight tracking. Was inconsistent
   (card-title had the display font, sheet-title didn't, dialog had no rule at
   all and fell back to an inline-styled <h3>). margin:0 so it's safe on a real
   <h3> element (which carries a UA margin) as well as a <div>/<span>. */
.card__title, .dialog__title, .sheet__title { font-weight: var(--k-weight-semibold); font-size: var(--k-type-h3); font-family: var(--k-font-display); color: var(--k-fg); letter-spacing: -0.01em; line-height: 1.25; margin: 0; }
.card__desc { font-size: var(--k-type-small); color: var(--k-fg-muted); line-height: 1.4; }
/* Inline cluster (adjacent controls) + stacked cluster — both on the canonical
 * --k-stack-gap so "the gap between two adjacent controls" is axis-independent. */
.card__row { display: flex; gap: var(--k-stack-gap, 8px); align-items: center; flex-wrap: wrap; }
.card__col { display: flex; flex-direction: column; gap: var(--k-gap, var(--k-s-8)); }
/* Footer action zone (shadcn CardFooter) — a hairline divider anchors the CTA
 * row to the floor of the card. Holds full-width block buttons on the tight gap. */
.card__foot {
  margin-top: var(--k-s-16);
  padding-top: var(--k-s-16);
  border-top: var(--k-divider);
  display: flex;
  flex-direction: column;
  gap: var(--k-stack-gap, 8px);
}`,
  },
  {
    id: 'button-group',
    section: "Button group",
    css: `/* === Button group ========================================================
 * A row of buttons fused into one control — shared edges, outer corners follow
 * the button's own radius (--btn-r, set per .btn). Use for split actions or a
 * segmented set of equal-weight buttons. Compose with any .btn variant/size. */
.btn-group { display: inline-flex; }
.btn-group > .btn { border-radius: 0; }
.btn-group > .btn:not(:first-child) { margin-left: -1px; }
.btn-group > .btn:first-child { border-top-left-radius: var(--btn-r); border-bottom-left-radius: var(--btn-r); }
.btn-group > .btn:last-child { border-top-right-radius: var(--btn-r); border-bottom-right-radius: var(--btn-r); }
/* Hovered / focused segment lifts above its neighbours so its full border + ring show. */
.btn-group > .btn:hover, .btn-group > .btn:focus-visible { position: relative; z-index: 1; }`,
  },
  {
    id: 'aspect-ratio',
    section: "Aspect ratio",
    css: `/* === Aspect ratio ========================================================
 * A ratio-locked media box — children fill + cover, so images/maps/embeds keep
 * their shape across the responsive grid. Rounded + sunken so an empty box still
 * reads as a placeholder. Pick a ratio modifier (the box owns no intrinsic one). */
.aspect { position: relative; width: 100%; overflow: hidden; border-radius: var(--k-radius-md); background: var(--k-surface-sunken); }
.aspect--16x9 { aspect-ratio: 16 / 9; }
.aspect--1x1 { aspect-ratio: 1 / 1; }
.aspect > img, .aspect > video, .aspect > iframe, .aspect > .aspect__fill { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; border: 0; }`,
  },
  {
    id: 'scroll-area',
    section: "Scroll area",
    css: `/* === Scroll area =========================================================
 * An overflow container with a slim, token-tinted scrollbar (the browser default
 * is heavy + off-palette). Thumb sits on a surface-coloured ring so it reads on
 * any plane; track stays invisible. Set a max-height/height on the element. */
.scroll-area { overflow: auto; scrollbar-width: thin; scrollbar-color: var(--k-border) transparent; }
.scroll-area::-webkit-scrollbar { width: 10px; height: 10px; }
.scroll-area::-webkit-scrollbar-track { background: transparent; }
.scroll-area::-webkit-scrollbar-thumb { background: var(--k-border); border-radius: 999px; border: 2px solid var(--k-surface); }
.scroll-area::-webkit-scrollbar-thumb:hover { background: var(--k-fg-faint); }`,
  },
  {
    id: 'form',
    section: "Form",
    css: `/* === Form ===
 * Inputs follow Stature: Compact = 32px (Linear/Cursor feel), Balanced = 40px
 * (shadcn default), Bold = 48px (consumer / mobile-first). Horizontal padding
 * stays radius-aware so pill-radius inputs get enough room past the curve. */
.in {
  display: flex;
  align-items: center;
  min-height: var(--k-in-h-default, 40px);
  padding-block: 0;
  /* Horizontal padding floor 12px (Linear / shadcn-equiv) + radius-aware
   * scaling so rounded inputs still keep the label clear of the curve. */
  padding-inline: max(var(--k-s-12), calc(var(--k-radius-md) * 0.6));
  /* Surface treatment, token-driven (Outlined/Filled/Plain — one rule, three
   * looks). --k-field-radius is 0 in Plain (the underline is a straight line).
   * --k-field-bg is transparent in Plain. The border is set on all sides via
   * --k-field-border-color (input-border in Outlined, transparent in Filled +
   * Plain) and the BOTTOM is overridden to --k-field-underline-color — so Plain
   * shows only an underline while Outlined gets a full box. Border (faint→strong)
   * still feeds --k-input-border, so it tunes the line in every mode. */
  border-radius: var(--k-in-radius, var(--k-field-radius));
  background: var(--k-in-bg, var(--k-field-bg));
  border: var(--k-bw, 1px) solid var(--k-field-border-color);
  border-bottom-color: var(--k-field-underline-color);
  color: var(--k-fg);
  width: 100%;
  font-size: var(--k-type-small);
  font-family: var(--k-font-body);
  /* Stable text positioning across focus states — see wrapper-fields
   * rule for full rationale. Chrome on macOS sub-pixel re-renders text
   * when input becomes focused; geometricPrecision disables that. */
  text-rendering: geometricPrecision;
}
/* Sunken filled-field signature: every input sits on --k-input-bg (the
 * brand-tinted recessed neutral), the SAME fill as .select-trigger / .taginput /
 * .otp__slot — so all field types read as one family. Was --k-surface-2 here,
 * which silently overrode the --k-input-bg set above (this rule comes later in
 * source order) and made plain inputs/textarea lighter than selects. The fill is
 * elevation-coupled (tracks Neutrals/Emphasis), giving the "pressed-in" depth
 * without a heavy inset shadow. Pairs with the tactile button shadow — same row,
 * opposite depth. */
.in {
  background: var(--k-field-bg);
  /* Inputs sit flat on the surface — no inset pressed shadow. shadcn
   * pattern: emphasis lives in the focus halo, not in a default inner
   * shadow that competes with body text. */
  box-shadow: none;
  transition:
    border-color var(--k-dur-fast, 110ms) var(--k-ease, ease),
    box-shadow var(--k-dur-fast, 110ms) var(--k-ease, ease),
    background var(--k-dur-fast, 110ms) var(--k-ease, ease);
}
/* Hover: the box edge darkens in Outlined/Filled; in Plain only the underline
 * darkens (--k-field-hover-edge is transparent there, so no box appears). */
.in:hover:not(:focus):not(:disabled) { border-color: var(--k-field-hover-edge); border-bottom-color: var(--k-state-border, var(--k-fg-faint)); }
/* Disabled — apply to .in itself and to wrapper-style inputs (numinput,
 * pwinput, etc) when the trigger has [aria-disabled] or contains a
 * disabled field. Opacity + no-pointer is the shadcn standard. */
.in:disabled,
.in[aria-disabled="true"] {
  opacity: var(--k-disabled-opacity, 0.55);
  cursor: not-allowed;
  background: var(--k-disabled-bg, var(--k-surface-sunken));
  color: var(--k-disabled-fg, var(--k-fg-muted));
  pointer-events: none;
}
/* Read-only — distinct from disabled: still focusable + text-selectable, just
 * not editable. Drops the sunken input fill so it reads as "display value, not
 * an input well", mutes the text and shows a default cursor. Targets the
 * [readonly] ATTRIBUTE (not :read-only, which also matches the .in wrapper
 * DIVs — divs are always read-only). Was a real defect: read-only looked
 * identical to an editable field. */
input.in[readonly],
textarea.in[readonly] {
  background: var(--k-surface);
  color: var(--k-fg-muted);
  cursor: default;
  box-shadow: none;
}
/* Focus: border + halo SAME hue, different alphas → reads as ONE
 * softening ring (shadcn pattern). Border becomes --k-ring (full alpha),
 * halo is --k-ring-halo (28% alpha of same color). The match is critical:
 * default border is computed from --k-input-border (neutral grey) which
 * has a different hue than --k-ring (brand primary) — if we leave border
 * neutral and only paint a brand halo, eye reads "two rings". Same hue
 * blend is what makes shadcn focus look unified.
 *
 * For validation states (invalid/success/warning), compound selectors
 * lower in the file override border+halo to the state color — same
 * unified-hue trick applies per state.
 *
 * HCM fallback: transparent outline browsers auto-promote to system
 * Highlight color in forced-colors mode. WCAG 2.4.7 + 2.4.13 compliant. */
.in:focus,
.in:focus-within {
  /* :focus fires when .in is a direct input (Email, Notes textarea, etc).
   * :focus-within fires when .in is a WRAPPER like .in.in--inline that
   * holds an inner <input> (Search field with icon). Combining both
   * means every .in variant gets the same focus treatment — single
   * coherent ring across all input shapes. */
  outline: 2px solid transparent;
  outline-offset: 2px;
  /* Box modes light the whole edge to --k-ring; Plain keeps top/sides
   * transparent (--k-field-focus-edge) and only brand-colours the underline —
   * the affordance lives in the focus state (Material-style) + the halo. */
  border-color: var(--k-field-focus-edge);
  border-bottom-color: var(--k-ring);
  box-shadow: 0 0 0 3px var(--k-ring-halo);
}
/* Bulletproof focus signal — the SINGLE source of focus on a field is its
 * own border+halo, NEVER the global solid :focus-visible outline (line ~56).
 * \`.in:focus\` above sets a transparent outline, but it's only EQUAL
 * specificity to the global rule, so under real keyboard focus (where
 * :focus-visible matches) the cascade is decided by source order alone —
 * fragile. This rule is higher specificity (.cockpit-preview prefix → 0,3,0)
 * so it ALWAYS wins, killing the blue outline that otherwise:
 *   • doubles up on a plain .in (heavier ring than wrapper fields), and
 *   • clashes on validation states (green/red border + a stray blue ring).
 * Mirrors the wrapper-child suppression at line ~4574 — same bug, same cure,
 * now applied to every standalone field shape. Validation border+halo come
 * from the (0,3,0) state rules above; this only touches \`outline\`, no clash. */
.cockpit-preview .in:focus-visible,
.cockpit-preview .select-trigger:focus-visible,
.cockpit-preview .otp__slot:focus-visible {
  /* OTP slots are real <input>s — they own the soft border+halo via
   * \`.otp__slot:focus\`, so suppress the global solid :focus-visible outline
   * too (else keyboard focus paints BOTH = the default solid ring on top). */
  outline: 2px solid transparent;
  outline-offset: 2px;
}
.in--inline {
  display: flex;
  align-items: center;
  gap: var(--k-s-6);
  /* No padding-block: the input STRETCHES to the wrapper's full height instead.
   * With vertical wrapper padding, the input collapses to ~line-height and its
   * overflow:clip shaves the text caret (the "short caret" bug). Letting the
   * input fill the box gives the caret the same room a standalone .in input has. */
  padding-block: 0;
  padding-inline: max(var(--k-s-10), calc(var(--k-radius-md) * 0.5));
}
/* align-self: stretch → input fills the wrapper height (the icon stays centred via
 * the wrapper's align-items:center); native input vertical-centering keeps the text
 * centred, and the now-tall box stops overflow:clip from clipping the caret. */
.in--inline input { background: transparent; border: 0; outline: 0; flex: 1; align-self: stretch; color: inherit; font: inherit; padding: 0; text-rendering: geometricPrecision; }
.in--inline input:focus, .in--inline input:focus-visible { outline: 0; }
/* Search inputs are type="search" for correct semantics (Enter-to-search,
   role=searchbox for screen readers). Reset the native \`searchfield\` look on
   the field ITSELF — otherwise WebKit renders it as a rounded native field that
   shortens + clips the text caret at its invisible rounded inner edge. Plus
   suppress the native clear "×"/decoration so it never doubles our ghost clear. */
input[type="search"] { -webkit-appearance: none; appearance: none; }
input[type="search"]::-webkit-search-cancel-button,
input[type="search"]::-webkit-search-decoration { -webkit-appearance: none; appearance: none; }
/* Textarea overrides .in's padding-block: 0 (which works for align-items:
 * center on single-line inputs but leaves textarea text glued to the top).
 * 12px aligns to the 4px grid (3×4) AND matches the y-position of a
 * single-line input's text baseline: a 40px-tall .in with 18px line-height
 * lands its text top at (40-18)/2 = 11px from the box top, so 12px reads
 * as continuous with the inputs above and below it in a form column.
 * Explicit line-height: 1.5 keeps multi-line spacing on the same rhythm. */
.tx {
  min-height: 78px;
  padding-block: var(--k-s-12);
  line-height: 1.5;
  resize: vertical;
}
.lab {
  display: flex;
  flex-direction: column;
  gap: var(--k-s-4);
  font-size: var(--k-type-small);
  color: var(--k-fg);
}
.lab > span:first-child {
  font-size: var(--k-type-eyebrow);
  color: var(--k-fg-muted);
  /* Form labels inherit UI text — these are chrome elements, not body content */
  font-weight: var(--k-ui-weight, 500);
  text-transform: var(--k-ui-transform, none);
  letter-spacing: var(--k-ui-tracking, 0);
}
/* === FormField (.field) — the full form-row contract: label + required marker +
 * control + hint + error, wired for a11y (aria-describedby → hint/error ids,
 * aria-invalid on the control). This is shadcn's FormItem / FormLabel /
 * FormDescription / FormMessage collapsed into one primitive so a labelled,
 * described, validated field is rebuildable from the export — the #1 systemic
 * gap before. (.lab stays the lightweight label-over-control; .field is the full
 * contract: reach for .field when a row needs a hint, an error or a required *.) */
.field { display: flex; flex-direction: column; gap: var(--k-s-6); }
.field__label { display: inline-flex; align-items: center; gap: var(--k-s-4); font-size: var(--k-type-small); font-weight: var(--k-weight-medium); color: var(--k-fg); }
/* Required marker — a danger-toned asterisk after the label text. */
.field__req { color: var(--k-danger); }
.field__hint { font-size: var(--k-type-caption); color: var(--k-fg-muted); line-height: 1.4; }
/* Error message — only render when the control is invalid; pairs with
 * aria-invalid="true" + aria-describedby on the control. */
.field__error { display: inline-flex; align-items: center; gap: var(--k-s-4); font-size: var(--k-type-caption); color: var(--k-danger); line-height: 1.4; }
.check, .radio {
  display: inline-flex;
  align-items: center;
  gap: var(--k-s-10);
  font-size: var(--k-type-small);
  cursor: pointer;
  line-height: 1.4;
}
/* Custom checkbox + radio — appearance: none kills the platform UI, we draw
   our own 16px square/circle. Uses --k-input-border so it visually matches
   form inputs, and --k-primary for the checked state. */
.check input[type="checkbox"], .radio input[type="radio"] {
  appearance: none;
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border: max(1.5px, var(--k-bw)) solid var(--k-input-border);
  background: var(--k-surface);
  display: inline-grid;
  place-items: center;
  position: relative;
  cursor: pointer;
  margin: 0;
  padding: 0;
  flex: none;
  transition: background var(--k-dur-fast, 120ms) var(--k-ease, ease), border-color var(--k-dur-fast, 120ms) var(--k-ease, ease);
}
/* A checkbox is a slightly-rounded SQUARE, never a near-circle. Cap the corner
 * at 4px (≈ shadcn's 25% on a 16px box) so it still responds to Box radius
 * (0 at None) but never rounds off into radio-button territory at Soft/Round. */
.check input[type="checkbox"] { border-radius: min(var(--k-radius-sm), 4px); }
.radio input[type="radio"]    { border-radius: 50%; }
.check input[type="checkbox"]:hover,
.radio input[type="radio"]:hover { border-color: var(--k-fg-faint); }
.check input[type="checkbox"]:focus-visible,
.radio input[type="radio"]:focus-visible {
  outline: 2px solid var(--k-ring-soft);
  outline-offset: 1px;
}
.check input[type="checkbox"]:checked {
  background: var(--k-primary);
  border-color: var(--k-primary);
}
.check input[type="checkbox"]:checked::after {
  content: '';
  /* Absolute so the checkmark is OUT of flow — an in-flow grid item shifts the
     box's baseline by ~1.5px the moment it appears, making the checkbox visibly
     jump on check. Out of flow → zero layout impact, no jump. Centred via
     top/left 50% + translate, then the same optical nudge as before. */
  position: absolute;
  top: 50%;
  left: 50%;
  width: 9px;
  height: 5px;
  border-left: 1.5px solid var(--k-primary-fg);
  border-bottom: 1.5px solid var(--k-primary-fg);
  transform: translate(-50%, -50%) rotate(-45deg) translate(1px, -1px);
}
/* Indeterminate — the "some-but-not-all selected" state (set via the .indeterminate
 * DOM property in JS; there is no HTML attribute). Filled like :checked but with a
 * horizontal dash instead of the tick — the standard table select-all glyph. */
.check input[type="checkbox"]:indeterminate {
  background: var(--k-primary);
  border-color: var(--k-primary);
}
.check input[type="checkbox"]:indeterminate::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 9px;
  height: 0;
  border-top: 1.5px solid var(--k-primary-fg);
  transform: translate(-50%, -50%);
}
/* Disabled checkbox/radio — muted + not-allowed, the :checked tick still shows
 * (a disabled-but-checked row reads as "locked on", not empty). */
.check input:disabled,
.radio input:disabled {
  opacity: var(--k-disabled-opacity, 0.55);
  cursor: not-allowed;
}
.radio input[type="radio"]:checked {
  border-color: var(--k-primary);
}
.radio input[type="radio"]:checked::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--k-primary);
  transform: translate(-50%, -50%);
}`,
  },
  {
    id: 'badges-pills',
    section: "Badges & pills",
    css: `/* === Badges & pills ===
   A badge is a TEXT chip (status "Healthy", tag "POPULAR") — so it FOLLOWS the
   box radius (--k-radius-md): square theme → square chips, round theme → pill
   chips, consistent with cards & inputs. It is NOT in the always-pill set —
   that's reserved for numeric count-chips (.badge--count), status dots,
   toggles, sliders, progress and avatars, which stay round by metaphor.
   Horizontal padding scales with the radius so labels don't crowd the curves. */
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--k-s-4);
  padding-block: var(--k-s-2);
  padding-inline: max(var(--k-s-8), calc(var(--k-radius-md) * 0.5));
  border-radius: var(--k-badge-radius, var(--k-radius-md));
  font-size: var(--k-type-eyebrow);
  /* UI text properties apply — badges are "chrome text" like buttons.
     Weight stays a step lighter via min(500) clamp so badges don't
     overpower buttons even on Bold weight. */
  font-weight: var(--k-ui-weight, 500);
  /* Same line-height: 1 trick as .btn — keeps tiny icons (the success
     check, info dot, etc.) optically centered with the label. */
  line-height: 1;
  text-transform: var(--k-ui-transform, none);
  letter-spacing: var(--k-ui-tracking, 0);
}
.badge > svg { flex-shrink: 0; display: block; }
.badge--success { background: var(--k-success-soft); color: var(--k-success-soft-fg); }
.badge--warn { background: var(--k-warning-soft); color: var(--k-warning-soft-fg); }
.badge--danger { background: var(--k-danger-soft); color: var(--k-danger-soft-fg); }
.badge--info { background: var(--k-info-soft); color: var(--k-info-soft-fg); }
.badge--neutral { background: var(--k-surface-2); color: var(--k-fg-muted); }

/* Solid badge variants — heavier presence than soft */
.badge--solid-success { background: var(--k-success); color: var(--k-success-fg); }
.badge--solid-warn { background: var(--k-warning); color: var(--k-warning-fg); }
.badge--solid-danger { background: var(--k-danger); color: var(--k-danger-fg); }
.badge--solid-info { background: var(--k-info); color: var(--k-info-fg); }
/* Brand-color badge — use this for notification counts, "new" indicators
   and other UI-driven counters that should follow the user's primary color
   rather than the fixed semantic blue of --solid-info. */
.badge--solid-primary { background: var(--k-primary); color: var(--k-primary-fg); }
.badge--primary { background: var(--k-primary-soft); color: var(--k-primary-soft-fg); }
/* Accent (tertiary) soft chip — the highlight role's soft container, completing
 * the role matrix (every role now has a soft badge). */
.badge--accent { background: var(--k-accent-soft); color: var(--k-accent-soft-fg); }
/* ─────────────────────────────────────────────────────────────────
 * Count chip — unified system for round numeric indicators
 * ─────────────────────────────────────────────────────────────────
 * One recipe for any "digit-in-a-circle" pattern: nav-row counters,
 * pagination buttons, notification dots, step indicators.
 *
 * Formula:
 *   --count-h    sets total height & min-width (em-based, scales with font)
 *   padding-x    = 28% of --count-h → consistent optical breathing
 *   border-r     = pill (always round)
 *   tabular-nums = digits align in column
 *
 * Single digit ("1") renders as a perfect circle because content
 * ≤ min-width. Multi-digit ("99+") auto-pills with the same height,
 * padding kicking in only when content exceeds min-width.
 *
 * --count-h tuned per context:
 *   1.5em  → inline counters (nav badges) — balanced w/ body text
 *   2.25em → standalone controls (pagination) — needs button presence
 *
 * Extends the always-round elements rule (#170) to numeric indicators. */
.badge--count {
  /* Fixed micro size (NOT inherit) so the count stays proportional to its own
     small circle — inheriting the ambient text made the nav "4" render at the
     14px nav-row size, far too big for the chip. Em-based height keys off THIS
     size now, so the circle hugs the digit. Weight 600 so a count pops. */
  font-size: var(--k-type-eyebrow);
  font-weight: var(--k-weight-semibold);
  line-height: 1;
  height: 1.5em;
  min-width: 1.5em;
  width: auto;
  padding-inline: 0.42em;
  padding-block: 0;
  justify-content: center;
  border-radius: 999px;
  font-variant-numeric: tabular-nums;
}

/* Leading dot pattern — pill with a colored circle prefix. Defaults to the
   badge's own text colour (currentColor), so on a soft status badge the dot
   matches the semantic tone and on a solid badge it reads white — no inline
   colour needed. Override with an inline background for the neutral-pill +
   coloured-dot "live status" pattern (e.g. a green dot on a neutral badge). */
.badge__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex: none;
  background: currentColor;
}`,
  },
  {
    id: 'alert',
    section: "Alert",
    css: `/* === Alert === */
.alert {
  display: flex;
  gap: var(--k-s-10);
  padding-block: var(--k-s-10);
  padding-inline: max(var(--k-s-12), calc(var(--k-radius-md) * 0.7));
  border-radius: var(--k-radius-md);
  font-size: var(--k-type-small);
  align-items: flex-start;
}
.alert--info { background: var(--k-info-soft); color: var(--k-info-soft-fg); }
.alert--danger { background: var(--k-danger-soft); color: var(--k-danger-soft-fg); }
.alert--success { background: var(--k-success-soft); color: var(--k-success-soft-fg); }
.alert--warning { background: var(--k-warning-soft); color: var(--k-warning-soft-fg); }
.alert__body { display: flex; flex-direction: column; gap: var(--k-s-2); flex: 1; min-width: 0; }
.alert__title { font-weight: var(--k-weight-semibold); }
.alert__close {
  background: transparent;
  border: 0;
  padding: var(--k-s-2);
  cursor: pointer;
  color: currentColor;
  opacity: 0.6;
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  border-radius: var(--k-radius-md);
}
.alert__close:hover { opacity: 1; background: var(--k-state-hover); }`,
  },
  {
    id: 'tabs',
    section: "Tabs",
    css: `/* === Tabs === */
.tabs {
  display: flex;
  gap: var(--k-s-4);
  border-bottom: var(--k-divider);
  /* Tab strips never burst their card: denser styles / extra tabs scroll
   * horizontally instead. Scrollbar hidden — the cut-off edge is the cue. */
  overflow-x: auto;
  scrollbar-width: none;
}
.tabs::-webkit-scrollbar { display: none; }
.tab {
  flex: 0 0 auto;
  white-space: nowrap;
  padding: var(--k-s-8) var(--k-s-10);
  font-size: var(--k-type-body);
  color: var(--k-fg-muted);
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  cursor: pointer;
  background: transparent;
  border-top: 0;
  border-left: 0;
  border-right: 0;
  /* Tabs are chrome text — pick up UI weight/case/tracking */
  font-weight: var(--k-ui-weight, 500);
  text-transform: var(--k-ui-transform, none);
  letter-spacing: var(--k-ui-tracking, 0);
}
/* Hover + disabled (B1) — an inactive tab darkens toward fg on hover (the
 * affordance shadcn gives its TabsTrigger), and a disabled tab dims + blocks
 * the pointer. :not(.tab--on) keeps the active tab from re-darkening. */
.tab:not(.tab--on):not(:disabled):hover { color: var(--k-fg); }
.tab:disabled { opacity: var(--k-disabled-opacity, 0.55); cursor: not-allowed; pointer-events: none; }
.tab--on { color: var(--k-fg); border-bottom-color: var(--k-primary); }
/* Tab with leading icon — keep icon vertically centered with label. The
 * line-height: 1 + svg display:block treatment is the same as .btn / .badge. */
.tab { display: inline-flex; align-items: center; gap: var(--k-s-6); line-height: 1; }
.tab > svg { flex-shrink: 0; display: block; }
/* Counter chip inside a tab — small pill, neutral, picks up primary when active */
.tab__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 16px;
  padding: 0 var(--k-s-4);
  border-radius: 999px;
  font-size: var(--k-type-caption);
  font-weight: var(--k-weight-semibold);
  background: var(--k-surface-2);
  color: var(--k-fg-muted);
}
.tab--on .tab__badge { background: var(--k-primary-soft); color: var(--k-primary-soft-fg); }`,
  },
  {
    id: 'table',
    section: "Table",
    css: `/* === Table === */
.tbl { width: 100%; border-collapse: collapse; font-size: var(--k-type-body); }
.tbl th, .tbl td {
  /* Cell padding scales with density — Compact / Default / Comfortable via --k-space */
  padding: calc(var(--k-space, 10px) * 0.55) calc(var(--k-space, 10px) * 0.65);
  text-align: left;
}
.tbl thead { color: var(--k-fg-muted); font-weight: var(--k-weight-semibold); font-size: var(--k-type-eyebrow); text-transform: uppercase; letter-spacing: var(--k-track-eyebrow); }
.tbl tbody tr { border-top: var(--k-divider); }
.tbl tbody tr:hover { background: var(--k-state-hover); }
/* Press state (B1) — a clickable row gives a tactile "pressed" confirm on
 * :active (the stronger --k-state-press wash, a notch above hover). Harmless on
 * non-interactive tables: it only fires for the instant a row is held down. */
.tbl tbody tr:active { background: var(--k-state-press); }
/* Row selected (user checked a row / picked it) — follows the Selection
 * accent toggle: brand-soft when Brand, neutral surface when Neutral. */
.tbl tbody tr.is-selected,
.tbl tbody tr[aria-selected="true"] {
  background: var(--k-state-selected-bg, var(--k-primary-soft));
}
.tbl tbody tr.is-selected:hover,
.tbl tbody tr[aria-selected="true"]:hover {
  background: var(--k-state-selected-bg, var(--k-primary-soft));
  filter: brightness(0.98);
}

/* Sortable column header — chevrons indicate sort state */
.tbl th.is-sortable {
  cursor: pointer;
  user-select: none;
}
.tbl th.is-sortable:hover { color: var(--k-fg); }
.tbl th.is-sortable:focus-visible {
  outline: var(--k-focus-ring-width) solid var(--k-ring);
  outline-offset: -2px;
}
.tbl__sort {
  display: inline-flex;
  align-items: center;
  gap: var(--k-s-4);
}
.tbl__sort-chevron {
  display: inline-flex;
  color: var(--k-fg-faint);
  transition: color var(--k-dur-fast, 120ms) var(--k-ease, ease);
}
.is-sortable.is-active .tbl__sort-chevron { color: var(--k-primary); }

/* Two-line cell (B★5) — the canonical "primary name + secondary meta" stack
   inside a table cell (issue key · type · points, file · size, user · email).
   Was hand-rolled per-table with inline styles; now a kit pattern so the meta
   hierarchy is consistent: name = near-black --k-fg, meta = the FAINT tier (one
   step below muted) so the sub-line recedes cleanly behind the name. */
.tbl__name { font-weight: var(--k-weight-medium); color: var(--k-fg); }
.tbl__sub { font-size: var(--k-type-small); color: var(--k-fg-faint); margin-top: 1px; }
/* Tables are restrained shadcn-style: per-row border-top (base .tbl) + hover,
   no zebra striping. The zebra modifier was dropped — the base row treatment
   already reads cleanly and zebra added visual noise to dense data.

   The data-table BLOCK (bordered frame + toolbar + selection + footer +
   empty/loading/error states) is its own segment — see the "Data table" recipe,
   which composes this .tbl atom. */`,
  },
  {
    id: 'data-table',
    section: "Data table",
    css: `/* === Data table ===
   The flagship BLOCK: a bordered frame that wraps the .tbl atom into a complete,
   believable data surface — matrix-complete across every state real data hits.
   It COMPOSES atoms (.toolbar · .tbl · .select / .select-trigger · .pagination),
   so the whole surface is rebuildable from the kit, not a one-off.

   Anatomy
     .datatable                       frame (border + radius + clip)
       .datatable__bar                header band — holds a .toolbar (search /
         .datatable__bar--active      filters / actions); swaps to the bulk-action
                                      bar when rows are selected
       .datatable__body               scroll well (sticky thead)
         table.tbl                    the table atom
         .datatable__state            centered slot for EMPTY / LOADING / ERROR
       .datatable__foot               footer band — row count · rows-per-page
                                      .select · .pagination
   Modifiers
     .datatable--page                 page-level table: body grows to natural
                                      height, the PAGE scrolls (no inner well)
     .datatable--loading              dims the body while skeleton rows show
   State slot
     .datatable__state--error         tints the icon danger for a failed load */
.datatable { border: 1px solid var(--k-border); border-radius: var(--k-radius-md); background: var(--k-surface); overflow: hidden; container: datatable / inline-size; }
/* Container query (B2) — the block adapts to ITS OWN width, not the viewport, so
 * it reflows the same whether it's full-bleed or dropped in a narrow sidebar.
 * Under ~440px the header toolbar stacks its controls full-width (search, filters,
 * actions each on their own row) instead of cramming one row; the table body keeps
 * its horizontal scroll. (Named container so a nested block can't mis-trigger.) */
@container datatable (max-width: 440px) {
  .datatable__bar .toolbar { flex-direction: column; align-items: stretch; }
  .datatable__bar .toolbar__spacer { display: none; }
}

/* Header band — a .toolbar lives inside for the default controls; the band
 * supplies the sunken surface + divider, and flips to the bulk bar on selection. */
.datatable__bar { display: flex; align-items: center; gap: var(--k-s-10); padding: var(--k-s-8) var(--k-s-12); border-bottom: var(--k-divider); background: var(--k-surface-sunken); font-size: var(--k-type-small); }
.datatable__bar--active { background: var(--k-state-selected-bg, var(--k-primary-soft)); color: var(--k-state-selected-fg, var(--k-fg)); }
.datatable__count { font-weight: var(--k-weight-semibold); }
.datatable__spacer { margin-left: auto; }

/* Scroll body — sticky thead stays pinned while rows scroll. Page-level tables
 * paginate (~10-12 rows), so they grow to natural height and let the PAGE scroll
 * (no cramped inner well). The 240px cap stays for the compact gallery tile. */
.datatable__body { max-height: 240px; overflow: auto; }
.datatable--page .datatable__body { max-height: none; overflow: visible; }
.datatable .tbl thead th {
  position: sticky; top: 0; z-index: 1;
  background: var(--k-surface);
  box-shadow: inset 0 -1px 0 0 var(--k-border);
}
.datatable .tbl td:first-child, .datatable .tbl th:first-child { padding-left: var(--k-s-12); }
.datatable .tbl td:last-child, .datatable .tbl th:last-child { padding-right: var(--k-s-12); }

/* Selection cell — checkbox column, fixed narrow width. */
.datatable__check { width: 36px; }

/* Content-stress helpers (real data is messy):
 *   th.num / td.num → right-align + tabular figures for money / metric columns
 *   .truncate       → single-line ellipsis so a long title never blows the grid */
.datatable .tbl th.num, .datatable .tbl td.num { text-align: right; font-variant-numeric: tabular-nums; }
.datatable .truncate { display: block; max-width: 24ch; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* State slot — EMPTY / LOADING / ERROR share one centered well, so a row-less
 * table reads as a deliberate state, not a broken layout. Drop it in a full-span
 * <td> (or directly in the body) in place of <tbody> rows. */
.datatable__state { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--k-s-8); padding: var(--k-s-32) var(--k-s-16); text-align: center; color: var(--k-fg-muted); }
.datatable__state-icon { color: var(--k-fg-faint); line-height: 0; }
.datatable__state-title { font-weight: var(--k-weight-semibold); color: var(--k-fg); }
.datatable__state-msg { font-size: var(--k-type-small); max-width: 40ch; }
.datatable__state--error .datatable__state-icon { color: var(--k-danger); }

/* Loading — skeleton rows in <tbody> (pair each cell with a .sk bar); the body
 * dims a touch so the table reads as "busy" rather than empty. */
.datatable--loading .datatable__body { opacity: 0.85; }

/* Footer band — row range, a rows-per-page .select, and the .pagination atom.
 * Mirrors the header surface, sits below the body inside the frame. */
.datatable__foot { display: flex; align-items: center; gap: var(--k-s-12); flex-wrap: wrap; padding: var(--k-s-8) var(--k-s-12); border-top: var(--k-divider); background: var(--k-surface-sunken); font-size: var(--k-type-small); color: var(--k-fg-muted); }
.datatable__foot-info { margin-right: auto; }
.datatable__perpage { display: inline-flex; align-items: center; gap: var(--k-s-8); white-space: nowrap; }
.datatable__perpage .select { width: auto; min-height: var(--k-control-h-sm); }`,
  },
  {
    id: 'tooltip',
    section: "Tooltip",
    css: `/* === Tooltip ===
   Hidden by default; reveals on hover/focus of the parent .tt wrapper.
   Add .tt--always for forced-open demos (gallery card uses this so users
   see the tooltip without needing to hover).
   Left-aligned to the trigger's edge so wide labels don't overflow the
   card's padding rail. */
.tt {
  position: relative;
  display: inline-flex;
  align-items: center;
}
.tt__pop {
  position: absolute;
  bottom: calc(100% + 6px);
  left: 0;
  /* Inverse-emphasis surface (H1): the canonical dark-tooltip-on-light-UI
     (and vice versa) now wears the NAMED inverse roles instead of an ad-hoc
     fg/bg swap — same read, real vocabulary (M3 inverse-surface). */
  background: var(--k-inverse-surface);
  color: var(--k-inverse-fg);
  font-size: var(--k-type-eyebrow);
  padding-block: var(--k-s-4);
  padding-inline: max(var(--k-s-8), calc(var(--k-radius-md) * 0.5));
  border-radius: var(--k-radius-md);
  /* Cap width + wrap long copy so a wordy tooltip never runs off a narrow
     viewport (was nowrap with no max-width → horizontal overflow). */
  max-width: min(16rem, calc(100vw - 1rem));
  opacity: 0;
  pointer-events: none;
  /* Tooltip: fast fade — ease-out on enter, ease-in on exit (handled by
     omitting transition-property override; same transition runs both ways
     and shorter dur keeps it from feeling sluggish on flicker-hovers) */
  transition: opacity var(--k-dur-fast, 120ms) var(--k-ease, ease);
  z-index: var(--k-z-tooltip);
}
.tt:hover .tt__pop,
.tt:focus-within .tt__pop,
.tt--always .tt__pop {
  opacity: 1;
}`,
  },
  {
    id: 'avatar',
    section: "Avatar",
    css: `/* === Avatar — sizes, group stack, status dot === */
.avatar {
  width: var(--k-avatar);
  height: var(--k-avatar);
  border-radius: 50%;
  background: var(--k-primary-soft);
  color: var(--k-primary-soft-fg);
  display: inline-grid;
  place-items: center;
  font-size: var(--k-type-eyebrow);
  font-weight: var(--k-weight-semibold);
  position: relative;
  flex: none;
}
.avatar--sm { width: calc(var(--k-avatar) - 0.375rem); height: calc(var(--k-avatar) - 0.375rem); font-size: var(--k-type-caption); }
.avatar--lg { width: calc(var(--k-avatar) + 0.5rem); height: calc(var(--k-avatar) + 0.5rem); font-size: var(--k-type-small); }
/* Photo avatar — the <img> covers the initials once it loads; on a broken/slow
   src the consumer removes it (onError) and the initials underneath show through.
   No layout shift either way (absolute-filled), and the initials stay the
   accessible name. */
.avatar__img { position: absolute; inset: 0; width: 100%; height: 100%; border-radius: inherit; object-fit: cover; }

/* Decorative-palette avatars — one per accent swatch, each with its own
   readable ink. Use for colour-coded identity (per-org / per-user) instead
   of hardcoding hex. Rotates with the brand colour + Palette character. */
.avatar--a1 { background: var(--k-accent-1); color: var(--k-accent-1-ink); }
.avatar--a2 { background: var(--k-accent-2); color: var(--k-accent-2-ink); }
.avatar--a3 { background: var(--k-accent-3); color: var(--k-accent-3-ink); }
.avatar--a4 { background: var(--k-accent-4); color: var(--k-accent-4-ink); }
.avatar--a5 { background: var(--k-accent-5); color: var(--k-accent-5-ink); }
.avatar--a6 { background: var(--k-accent-6); color: var(--k-accent-6-ink); }

/* Gradient placeholder — square media tile (cover art, category, preload).
   .ph--g1..g6 pull the 6 decorative gradient pairs. */
.ph { border-radius: var(--k-radius-md); background: var(--k-fill); }
.ph--g1 { background: var(--k-grad-1); }
.ph--g2 { background: var(--k-grad-2); }
.ph--g3 { background: var(--k-grad-3); }
.ph--g4 { background: var(--k-grad-4); }
.ph--g5 { background: var(--k-grad-5); }
.ph--g6 { background: var(--k-grad-6); }

/* Group: stacked avatars with negative margin + ring border to separate.
   Industry convention (Slack/Linear/GitHub/Notion): stacked avatars never
   show status dots — the next avatar's overlap always covers the dot's
   bottom-right corner. For status communication use the count label
   ("5 online") or a non-stacked horizontal list with gap. */
.avatar-group {
  display: inline-flex;
  align-items: center;
  padding-left: var(--k-s-6);
}
.avatar-group > .avatar {
  margin-left: calc(var(--k-s-6) * -1);
  box-shadow: 0 0 0 2.5px var(--k-surface);
}
.avatar-group .avatar__status { display: none; }
.avatar-group__more {
  font-size: var(--k-type-eyebrow);
  color: var(--k-fg-muted);
  margin-left: var(--k-s-10);
}

/* Online/offline status dot at bottom-right */
.avatar__status {
  position: absolute;
  bottom: -1px;
  right: -1px;
  width: var(--k-dot);
  height: var(--k-dot);
  border-radius: 50%;
  box-shadow: 0 0 0 2px var(--k-surface);
}
.avatar__status--online { background: var(--k-success); }
.avatar__status--away { background: var(--k-warning); }
.avatar__status--offline { background: var(--k-fg-faint); }`,
  },
  {
    id: 'switch-toggle',
    section: "Switch / toggle",
    css: `/* === Switch / toggle ===
 * Default size is Stature-driven (compact 26×14, balanced 32×18, bold 40×22).
 * .toggle--sm / .toggle--lg are explicit overrides for cases where you want
 * a smaller/bigger toggle than the stature default (e.g. a Bold-stature
 * settings page with a sm toggle inside a table cell). */
/* Toggle uses two local CSS vars (--tog-w, --tog-h) so any size variant
 * just overrides those two values and the knob + translate adapt via calc.
 * No more hardcoded "12px knob" that breaks when stature scales the track. */
.toggle {
  --tog-w: var(--k-toggle-w-default, 32px);
  --tog-h: var(--k-toggle-h-default, 18px);
  width: var(--tog-w);
  height: var(--tog-h);
  /* Off-track is a clearly-recessed muted fill (shadcn bg-input) so the OFF
     state reads unmistakably off, not just a faint tint of the card. */
  background: var(--k-track, var(--k-surface-sunken));
  border-radius: 999px;
  border: 1px solid var(--k-border);
  display: inline-flex;
  align-items: center;
  padding: var(--k-s-2);
  cursor: pointer;
  /* Fast easing for microinteraction — toggle is a tap, not a transition */
  transition: background var(--k-dur-fast, 120ms) var(--k-ease, ease),
              border-color var(--k-dur-fast, 120ms) var(--k-ease, ease);
}
/* Hover affordance (B1) — the OFF track firms its edge, the ON track lifts a
 * touch, so the toggle reads as live before you click it (the gap shadcn fills
 * with a subtle hover). Suppressed on the disabled modifier (pointer-events:none
 * already blocks it, but be explicit). */
.toggle:not(.toggle--disabled):hover { border-color: var(--k-state-border, var(--k-fg-faint)); }
.toggle--on:not(.toggle--disabled):hover { filter: brightness(1.05); }
/* Knob is always (track-h − 6px): leaves 2px padding + 1px border breathing room
 * on top and bottom regardless of stature. ON-translate is (track-w − track-h)
 * which lands the knob exactly at the right edge with matching inset. */
.toggle__knob {
  width: calc(var(--tog-h) - 6px);
  height: calc(var(--tog-h) - 6px);
  background: var(--k-surface);
  border-radius: 50%;
  /* Spring overshoot on the knob translation — the signature "click" feel.
   * Box-shadow uses the tactile token so the knob reads as a discrete
   * physical object riding the track. */
  transition: transform var(--k-dur) var(--k-ease-spring, cubic-bezier(.34,1.56,.64,1));
  box-shadow: var(--k-shadow-tactile, var(--k-shadow-sm));
}
.toggle--on { background: var(--k-fill, var(--k-primary)); border-color: var(--k-primary); }
.toggle--on .toggle__knob {
  transform: translateX(calc(var(--tog-w) - var(--tog-h)));
  background: var(--k-primary-fg);
}

/* Toggle size modifiers — explicit overrides for cases where you want a
 * smaller/bigger toggle than the stature default. Only --tog-w / --tog-h
 * change; the knob math adapts automatically. */
.toggle--sm { --tog-w: 26px; --tog-h: 14px; }
.toggle--lg { --tog-w: 40px; --tog-h: 22px; }
/* Disabled toggle — state parity with .slider--disabled / :disabled inputs:
 * muted + not-allowed + no pointer. Combine with .toggle--on for disabled-on.
 * (Add aria-disabled="true" on the control for the a11y half.) */
.toggle--disabled { opacity: var(--k-disabled-opacity, 0.55); pointer-events: none; cursor: not-allowed; }`,
  },
  {
    id: 'slider',
    section: "Slider",
    css: `/* === Slider === */
/* Slider track is stroke-3 (3px): light enough to read as a control,
 * heavy enough to grab. Pairs with the 6px progress fill — they read as
 * "sibling controls" because they share the stroke vocabulary. */
.slider {
  width: 100%;
  height: var(--k-stroke-3, 3px);
  background: var(--k-track, var(--k-surface-2));
  border-radius: 999px;
  position: relative;
}
/* Uses --k-fill so gradient mode flows along the track without affecting the knob.
   display:block is REQUIRED — the markup is a <span> (inline), so without it the
   width:%/height:100% are ignored and the fill renders 0×0 (no coloured range). */
.slider__fill { display: block; height: 100%; background: var(--k-fill, var(--k-primary)); border-radius: 999px; }
.slider__knob {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  /* Size GROWS with the Scale control (14/16/20), parallel to the toggle. */
  width: var(--k-slider-knob, 16px);
  height: var(--k-slider-knob, 16px);
  /* ALWAYS round — a slider thumb is a "round handle" metaphor, shape-locked
     like the toggle knob + radio (it does NOT follow Box radius; squaring it
     while the toggle stays round read inconsistent). */
  border-radius: 50%;
  /* White/surface fill + 2px brand rim — shadcn's slider thumb reads as a
     precise mechanical handle, not a filled bullet. Selection wraps it in the
     soft --k-ring-halo on top of the rim. */
  background: var(--k-surface);
  border: 2px solid var(--k-primary);
  box-shadow: var(--k-shadow-sm);
  transition: width var(--k-dur-fast, 120ms) var(--k-ease, ease),
              height var(--k-dur-fast, 120ms) var(--k-ease, ease),
              box-shadow var(--k-dur-fast, 120ms) var(--k-ease, ease);
}
/* Interactive states — the knob reacts like a live control. Hover/focus/drag
   wrap it in the SAME soft halo (--k-ring-halo) the form fields use on focus,
   and grabbing it (keyboard focus or active drag) grows the knob a touch. The
   track itself carries role="slider" tabindex, so we suppress its default
   outline and put the focus signal on the knob instead (shadcn pattern). */
.slider:hover .slider__knob {
  box-shadow: var(--k-shadow-sm), 0 0 0 3px var(--k-ring-halo);
}
.cockpit-preview .slider:focus-visible { outline: none; }
/* Selection = ONLY the soft halo (--k-ring-halo) around the knob — the SAME
   halo a focused field gets. The knob keeps its normal (white) ring; we do NOT
   recolour the border (that turned the knob into a big solid disc, esp. in mono
   themes where --k-ring is near-black). Halo persists on :focus and fires
   through the drag via :active / .slider--grabbing. */
.slider:focus .slider__knob,
.slider:active .slider__knob,
.slider--grabbing .slider__knob {
  width: calc(var(--k-slider-knob, 16px) + 2px);
  height: calc(var(--k-slider-knob, 16px) + 2px);
  /* LITERALLY the input focus-halo — same as \`.in:focus\` (mail input): just the
     --k-ring-halo band, nothing else. No drop shadow, no border, no white. */
  box-shadow: 0 0 0 3px var(--k-ring-halo);
}
/* Disabled — dimmed + non-interactive (shadcn parity: opacity-50 +
   pointer-events-none). The component also drops tabindex and the handlers. */
.slider--disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}`,
  },
  {
    id: 'progress',
    section: "Progress",
    css: `/* === Progress ===
 * Heavier than the slider — stroke-progress (6px) signals "ongoing work"
 * rather than "controllable value". The 2:1 thickness ratio (6 vs 3) is
 * intentional: a glance distinguishes them without reading the label. */
.progress {
  width: 100%;
  height: var(--k-stroke-progress, 6px);
  background: var(--k-surface-2);
  border-radius: 999px;
  overflow: hidden;
}
.progress__fill {
  height: 100%;
  background: var(--k-fill, var(--k-primary));
  border-radius: 999px;
}
/* Indeterminate — no known %: a 40%-wide fill sweeps the track on a loop. Use
   when there's no ETA (Radix Progress data-state="indeterminate"); the markup
   drops aria-valuenow and keeps role=progressbar. Respects reduced-motion. */
.progress--indeterminate .progress__fill {
  width: 40%;
  animation: k-progress-indet 1.4s var(--k-ease, ease) infinite;
}
@keyframes k-progress-indet {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(250%); }
}
@media (prefers-reduced-motion: reduce) {
  .progress--indeterminate .progress__fill { animation: none; width: 100%; opacity: 0.6; }
}`,
  },
  {
    id: 'skeleton',
    section: "Skeleton",
    css: `/* === Skeleton === */
.sk {
  background: linear-gradient(90deg, var(--k-surface-2) 0%, var(--k-surface-raised) 50%, var(--k-surface-2) 100%);
  background-size: 200% 100%;
  border-radius: var(--k-radius-md);
  animation: sk 1.5s ease-in-out infinite;
}
@keyframes sk { 0% { background-position: 0 0; } 100% { background-position: -200% 0; } }`,
  },
  {
    id: 'empty-state',
    section: "Empty state",
    css: `/* === Empty state ===
   The "nothing here yet" placeholder — a real tokenised recipe (was inline
   div-soup that couldn't export). One muted icon chip, a title, a sub, and a
   SINGLE primary action (two competing CTAs is the classic empty-state smell).
   shadcn's <Empty> shape. */
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--k-s-10);
  padding: var(--k-space, 16px) var(--k-s-8);
  text-align: center;
}
.empty__icon {
  display: grid;
  place-items: center;
  width: var(--k-row-h-lg, 40px);
  height: var(--k-row-h-lg, 40px);
  border-radius: 50%;
  background: var(--k-surface-2);
  color: var(--k-fg-muted);
}
.empty__icon > svg { width: var(--k-icon, 18px); height: var(--k-icon, 18px); }
.empty__title { font-weight: var(--k-weight-semibold); font-size: var(--k-type-small); }
.empty__sub { font-size: var(--k-type-small); color: var(--k-fg-muted); max-width: 32ch; }`,
  },
  {
    id: 'select-trigger',
    section: "Select trigger",
    css: `/* === Select trigger === */
.select-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  /* Same height as inputs (--k-in-h) so a select sitting beside a search
     field stays aligned at EVERY density — adjacent-element rule (#190).
     Was a fixed padding-block:8 that diverged from .in as density grew. */
  min-height: var(--k-in-h-default, 40px);
  padding-block: 0;
  padding-inline: max(var(--k-s-12), calc(var(--k-radius-md) * 0.6));
  /* --k-field-radius (not --k-radius-md) so Plain flattens to a straight
     underline — radius-md here left the bottom hairline curling up at the ends. */
  border-radius: var(--k-field-radius);
  background: var(--k-field-bg);
  border: var(--k-bw, 1px) solid var(--k-field-border-color); border-bottom-color: var(--k-field-underline-color);
  color: var(--k-fg);
  font-size: var(--k-type-small);
  font-family: inherit;
  text-align: left;
  width: 100%;
  cursor: pointer;
}
.select-trigger:hover { border-color: var(--k-state-border, var(--k-fg-faint)); }
/* Invalid state (B1) — a select with a validation error reads like an errored
 * input field: the danger border + a soft danger halo. Mirrors .in.is-error so
 * a select sitting in a form validates with the same language. Toggle with
 * .is-error or aria-invalid="true". */
.select-trigger.is-error,
.select-trigger[aria-invalid="true"] {
  border-color: var(--k-input-error-border);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--k-input-error-border) 22%, transparent);
}

/* Native <select class="select"> as a first-class PREVIEW form control.
 * The configurator chrome has its OWN unscoped \`.select\` in panel.css
 * (hardcoded 8px radius + --app-* colours). App/preview screens must not
 * borrow that — scope this one to .cockpit-preview and key it to --k-* so a
 * native select matches the .in search field beside it (same radius, surface,
 * border, height) and tracks the box/input radius like every other field.
 * Buttons keep their independent --k-radius-button on purpose (#75). */
.cockpit-preview select.select {
  min-height: var(--k-in-h-default, 40px);
  padding: 0 var(--k-s-28) 0 max(var(--k-s-12), calc(var(--k-radius-md) * 0.6));
  background-color: var(--k-field-bg);
  border: var(--k-bw, 1px) solid var(--k-field-border-color); border-bottom-color: var(--k-field-underline-color);
  border-radius: var(--k-field-radius);
  color: var(--k-fg);
  font-size: var(--k-type-small);
  font-family: var(--k-font-body);
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23888' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 11px center;
  cursor: pointer;
}
.cockpit-preview select.select:hover { border-color: var(--k-state-border, var(--k-fg-faint)); }
.cockpit-preview select.select:focus,
.cockpit-preview select.select:focus-visible {
  outline: none;
  /* Match the .in focus exactly — --k-ring border + --k-ring-halo (28%) shadow.
     Was an UNDEFINED --k-focus-ring token (silently fell back to a 22% halo) so
     the native select's focus read lighter than every sibling field. */
  border-color: var(--k-ring);
  box-shadow: 0 0 0 3px var(--k-ring-halo);
}`,
  },
  {
    id: 'spinner',
    section: "Spinner",
    css: `/* === Spinner === — uses --k-anim-spin token */
.spinner {
  width: calc(var(--k-in-h-default) / 2);
  height: calc(var(--k-in-h-default) / 2);
  border-radius: 50%;
  border: 2px solid var(--k-surface-2);
  border-top-color: var(--k-primary);
  animation: var(--k-anim-spin, k-spin 800ms linear infinite);
  display: inline-block;
  flex: none;
}
@media (prefers-reduced-motion: reduce) { .spinner { animation-duration: 2s; } }
/* Size tiers — default ≈ half the input height; sm for inline/button use, lg for
   page/section loaders. Border scales with the ring so it stays proportional. */
.spinner--sm { width: calc(var(--k-in-h-default) / 3); height: calc(var(--k-in-h-default) / 3); border-width: 1.5px; }
.spinner--lg { width: var(--k-in-h-default); height: var(--k-in-h-default); border-width: 3px; }`,
  },
  {
    id: 'navigation-row',
    section: "Navigation row",
    css: `/* === Navigation row =====================================================
 * Sidebar / settings nav follows the LG row grammar — these are destinations
 * (Home, Projects, Analytics), not picks-from-a-list. Slightly taller +
 * roomier than menu/cmdp rows, which signals "this is where you go" vs
 * "this is what you do". */
.navrow {
  display: flex;
  align-items: center;
  /* Full-width so a nested-parent row (wrapped in a <div>) lines up with flat
   * rows and the icon stays centred in the collapsed rail. */
  width: 100%;
  box-sizing: border-box;
  gap: var(--k-row-gap, 10px);
  padding: 0 var(--k-row-px, 10px);
  min-height: var(--k-row-h-lg, 40px);
  border-radius: var(--k-row-radius, 6px);
  font-size: var(--k-type-body);
  color: var(--k-fg-muted);
  cursor: pointer;
  /* Resets so a <button>/<a> nav row (now keyboard-focusable) renders exactly
     like the old <span> — no UA border, background, or link underline. */
  text-align: left;
  text-decoration: none;
  background: none;
  border: 0;
  font-family: inherit;
  appearance: none;
  -webkit-appearance: none;
  /* Nav labels are chrome — inherit UI text */
  font-weight: var(--k-ui-weight, 500);
  text-transform: var(--k-ui-transform, none);
  letter-spacing: var(--k-ui-tracking, 0);
}
.navrow > svg { width: var(--k-row-icon, 14px); height: var(--k-row-icon, 14px); flex-shrink: 0; }
.navrow:hover { background: var(--k-state-hover); color: var(--k-fg); }
.navrow--on {
  background: var(--k-state-selected-bg, var(--k-primary-soft));
  color: var(--k-state-selected-fg, var(--k-primary));
  font-weight: var(--k-weight-semibold);
}
.navrow__label { flex: 1; text-align: left; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.navrow__chev { margin-left: auto; display: inline-flex; color: var(--k-fg-faint); transition: transform var(--k-dur-fast, 140ms) var(--k-ease, ease); }
.navrow[aria-expanded='true'] .navrow__chev { transform: rotate(90deg); }
.navsub { position: relative; display: flex; flex-direction: column; gap: var(--k-s-2); margin: var(--k-s-2) 0; padding-left: var(--k-s-20); }
.navsub::before { content: ''; position: absolute; left: 19px; top: 3px; bottom: 3px; width: 1.5px; background: var(--k-border); }
.navsub__item { display: flex; align-items: center; gap: var(--k-s-8); width: 100%; min-height: var(--k-row-h-sm, 28px); padding: 0 var(--k-row-px, 10px); border-radius: var(--k-row-radius, 6px); font-size: var(--k-type-body); color: var(--k-fg-muted); cursor: pointer; font-weight: var(--k-ui-weight, 500); text-align: left; text-decoration: none; background: none; border: 0; font-family: inherit; appearance: none; -webkit-appearance: none; }
.navsub__item:hover { background: var(--k-state-hover); color: var(--k-fg); }
.navsub__item--on { color: var(--k-state-selected-fg, var(--k-primary)); font-weight: var(--k-weight-semibold); }
.nav-group { font-size: var(--k-type-eyebrow); font-weight: var(--k-weight-semibold); letter-spacing: var(--k-track-eyebrow); text-transform: uppercase; color: var(--k-fg-faint); padding: 0 var(--k-row-px, 10px); margin: var(--k-s-14) 0 var(--k-s-4); }`,
  },
  {
    id: 'sidebar',
    section: "Sidebar",
    css: `/* === Sidebar ============================================================
 * App-shell navigation column. Sits on the Chrome plane (--k-chrome-bg), which
 * the Surface axis drives: Outlined/Plain = flush with a hairline seam, Filled =
 * a sunken recessed well. Add .sidenav--floating for the lifted inset-room look.
 * Rows reuse the shared .navrow / .nav-group / .navsub recipe. Collapses to a
 * 64px icon-rail with hover tooltips; the collapse toggle lives in the brand
 * header. */
.sidenav {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  gap: var(--k-s-4);
  padding: var(--k-s-14) var(--k-s-10);
  background: var(--k-chrome-bg, var(--k-bg));
  border-right: var(--k-divider);
  transition:
    width var(--k-dur, 200ms) var(--k-ease-out, ease),
    margin var(--k-dur, 200ms) var(--k-ease-out, ease),
    border-radius var(--k-dur, 200ms) var(--k-ease-out, ease),
    box-shadow var(--k-dur, 200ms) var(--k-ease-out, ease);
}
/* FLOATING: a distinct, tinted ROOM — inset from the edges, a soft shadow, and a
 * border-radius that listens to Box radius (Raycast / Vercel-new). This was the
 * old "Floating sidebar" chrome value; per the Surface refactor it's an OPT-IN
 * utility (a lift, i.e. an Elevation expression) rather than a global mode — so
 * Surface stays scoped to fill/seam and never silently couples the sidebar to a
 * global shadow. Recessed (sunken well) now comes for free from Surface=Filled
 * via --k-chrome-bg; the border-right hairline is the seam. */
.sidenav--floating {
  margin: var(--k-s-8);
  border: 1px solid var(--k-border);
  border-radius: var(--k-radius-lg);
  box-shadow: var(--k-shadow-sm);
}
/* Brand header — app-icon launcher tile + name + the collapse toggle. */
.sidenav__brand { display: flex; align-items: center; gap: var(--k-s-8); padding: var(--k-s-6) var(--k-s-10) var(--k-s-16); font-weight: var(--k-weight-semibold); }
.sidenav__icon { width: 26px; height: 26px; border-radius: var(--k-radius-sm); background: var(--k-primary); color: var(--k-primary-fg, #fff); display: grid; place-items: center; flex: none; box-shadow: var(--k-shadow-sm); }
.sidenav__icon > svg { width: 15px; height: 15px; }
.sidenav__name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: var(--k-font-display); letter-spacing: -0.01em; }
.sidenav__toggle { display: inline-grid; place-items: center; width: 24px; height: 24px; flex: none; border: 0; border-radius: var(--k-radius-sm, 6px); background: transparent; color: var(--k-fg-faint); cursor: pointer; transition: background var(--k-dur-fast, 140ms) var(--k-ease, ease), color var(--k-dur-fast, 140ms); }
.sidenav__toggle:hover { background: var(--k-state-hover); color: var(--k-fg); }
.sidenav__toggle > svg { width: 16px; height: 16px; }
/* Pinned footer — Settings + a launcher pushed to the floor of the column. */
.sidenav__foot { margin-top: auto; display: flex; flex-direction: column; gap: var(--k-s-4); padding-top: var(--k-s-6); }
/* ---- Rail (collapsed) ---- icon-only; labels, group text, sub-lists, the app
 * icon and the name all collapse away, leaving centered icons + tooltips. */
.sidenav--rail { width: 64px; padding-left: var(--k-s-8); padding-right: var(--k-s-8); }
.sidenav--rail .sidenav__brand { padding: var(--k-s-6) 0 var(--k-s-16); justify-content: center; }
.sidenav--rail .sidenav__icon,
.sidenav--rail .sidenav__name,
.sidenav--rail .navrow__label,
.sidenav--rail .navrow__chev,
.sidenav--rail .navsub { display: none; }
.sidenav--rail .sidenav__toggle { margin: 0 auto; }
/* Group labels collapse to slim centered dividers; the first one is dropped. */
.sidenav--rail .nav-group { width: 22px; height: 0; margin: var(--k-s-6) auto var(--k-s-4); padding: 0; border-top: var(--k-divider); font-size: 0; overflow: hidden; }
.sidenav--rail .nav-group:first-of-type { border-top: 0; margin: 0; }
.sidenav--rail .sidenav__foot { border-top: var(--k-divider); padding-top: var(--k-s-8); }
.sidenav--rail .navrow { justify-content: center; gap: 0; padding: var(--k-s-8) 0; position: relative; }
/* An unread count badge collapses to a small corner dot on the icon. */
.sidenav--rail .navrow .badge--count { position: absolute; top: 4px; right: 9px; min-width: 8px; width: 8px; height: 8px; padding: 0; font-size: 0; border: 1.5px solid var(--k-chrome-bg, var(--k-surface-sunken)); }
/* Hover tooltip — flies out to the right of the rail (CSS-only, data-tip). */
.sidenav--rail .navrow[data-tip]::after,
.sidenav--rail .sidenav__toggle[data-tip]::after { content: attr(data-tip); position: absolute; left: calc(100% + 12px); top: 50%; transform: translateY(-50%) translateX(-4px); background: var(--k-fg); color: var(--k-bg); padding: var(--k-s-4) var(--k-s-8); border-radius: var(--k-radius-sm, 6px); font-size: var(--k-type-small); font-weight: var(--k-weight-medium); white-space: nowrap; opacity: 0; pointer-events: none; box-shadow: var(--k-shadow-md); z-index: var(--k-z-tooltip); transition: opacity var(--k-dur-fast, 140ms) var(--k-ease, ease), transform var(--k-dur-fast, 140ms) var(--k-ease, ease); }
.sidenav--rail .navrow[data-tip]:hover::after,
.sidenav--rail .sidenav__toggle[data-tip]:hover::after { opacity: 1; transform: translateY(-50%) translateX(0); }
@media (prefers-reduced-motion: reduce) {
  .sidenav--rail .navrow[data-tip]::after,
  .sidenav--rail .sidenav__toggle[data-tip]::after { transition: none; }
}`,
  },
  {
    id: 'activity-feed',
    section: "Activity feed",
    css: `/* === Activity feed ======================================================
 * A vertical event stream — a status-coloured dot, the event text, and a
 * trailing timestamp, with hairline-separated rows. The .activity__dot colour
 * is set by the consumer to carry status semantics. */
.activity { display: flex; flex-direction: column; gap: var(--k-s-10); }
.activity__item {
  display: flex;
  align-items: flex-start;
  gap: var(--k-s-10);
  font-size: var(--k-type-small);
  padding: var(--k-s-8) 0;
  border-bottom: var(--k-divider);
}
.activity__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: var(--k-s-6);
  flex: none;
}
.activity__meta { color: var(--k-fg-faint); font-size: var(--k-type-eyebrow); margin-left: auto; }`,
  },
  {
    id: 'danger-zone',
    section: "Danger zone",
    css: `/* === Danger zone ========================================================
 * A bordered panel that fences off destructive / irreversible settings
 * (delete account, transfer ownership). Danger-hued border + heading. */
.dangerzone {
  border: 1px solid var(--k-danger);
  border-radius: var(--k-radius-lg);
  padding: var(--k-pad, 24px);
  margin-top: var(--k-s-24);
}
.dangerzone__head {
  font-weight: var(--k-weight-semibold);
  /* Header text sits on the card surface (transparent over white/dark), so use
   * the actual --k-danger hue. *-fg is reserved for text ON a coloured fill. */
  color: var(--k-danger);
  margin-bottom: var(--k-s-6);
}`,
  },
  {
    id: 'interactive-list-row',
    section: "Interactive list row",
    css: `/* === Interactive list row (.list__row) — list family ===
 * Bordered, surface-filled row that's clickable — opens a menu/popover or
 * navigates. The standalone, card-like variant of the .list family (no .list
 * parent needed): use it for member lists, search results, file rows where
 * each row is its own bordered target. (.list__item is the flat, divider-
 * separated row INSIDE a .list.) Inline-styled rows can't express
 * :hover/:focus-visible, so any clickable row gets this class for a real
 * hover + keyboard affordance. Pair with role="button" + tabindex so the
 * global :focus-visible ring applies. */
.list__row {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--k-s-12);
  width: 100%;
  padding: calc(var(--k-space, 16px) * 0.55) calc(var(--k-space, 16px) * 0.7);
  border: var(--k-bw) solid var(--k-border);
  border-radius: var(--k-radius-md);
  background: var(--k-surface);
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: background var(--k-dur-fast, 120ms) var(--k-ease, ease),
              border-color var(--k-dur-fast, 120ms) var(--k-ease, ease);
}
.list__row:hover { background: var(--k-state-hover); }`,
  },
  {
    id: 'auth',
    section: "Auth",
    css: `/* === Auth — sign-in / sign-up screen scaffolding ===
 * Centered card flow: heading, SSO buttons, labelled "or" divider, the form
 * (reuses .in / .btn / .check), a meta row (remember + forgot) and a footer
 * link. Every app starts here, so it's a first-class screen pattern. */
.auth { display: flex; flex-direction: column; gap: var(--k-space, 16px); }
.auth__head { text-align: center; }
.auth__title { font-size: var(--k-type-h2); font-weight: var(--k-weight-bold); font-family: var(--k-font-display); letter-spacing: -0.02em; }
.auth__sub { font-size: var(--k-type-small); color: var(--k-fg-muted); margin-top: var(--k-s-4); }
/* Google / GitHub pair — adjacent buttons in a horizontal layout: the SAME
   --k-stack-gap as any other adjacent-control pair (Welcome-back = Save/Cancel,
   just rotated). One token → consistent everywhere, both axes. */
.auth__social { display: grid; gap: var(--k-stack-gap, 8px); }
.auth__social--row { grid-template-columns: 1fr 1fr; }
.auth__meta { display: flex; align-items: center; justify-content: space-between; font-size: var(--k-type-small); }
/* Rendered as a real <button> so it is keyboard-focusable (an href-less <a>
   is not) — these resets make the button read as an inline text link. */
.auth__link { color: var(--k-primary); text-decoration: none; cursor: pointer; font-weight: var(--k-weight-medium); background: none; border: 0; padding: 0; font: inherit; }
.auth__link:hover { text-decoration: underline; }
.auth__link:focus-visible { outline: var(--k-focus-ring-width, 2px) solid var(--k-ring); outline-offset: 2px; border-radius: var(--k-radius-sm, 4px); }
.auth__foot { text-align: center; font-size: var(--k-type-small); color: var(--k-fg-muted); }
/* Labelled divider ("or continue with") — hairlines flanking centered text. */
.divider-or { display: flex; align-items: center; gap: var(--k-s-12); color: var(--k-fg-faint); font-size: var(--k-type-eyebrow); text-transform: uppercase; letter-spacing: var(--k-track-eyebrow); }
.divider-or::before, .divider-or::after { content: ''; flex: 1; height: var(--k-bw); background: var(--k-border); }`,
  },
  {
    id: 'lightbox',
    section: "Lightbox",
    css: `/* === Lightbox — fullscreen image viewer overlay === */
.lightbox { position: fixed; inset: 0; z-index: var(--k-z-modal); background: var(--k-scrim-strong); display: grid; place-items: center; animation: var(--k-anim-fade-in, k-fade-in 160ms ease) both; }
.lightbox__stage { max-width: 78%; max-height: 76%; border-radius: var(--k-radius-md); box-shadow: var(--k-shadow-lg); }
.lightbox__btn { position: absolute; width: var(--k-icon-chip); height: var(--k-icon-chip); border-radius: 999px; border: 0; background: rgba(255, 255, 255, 0.12); color: #fff; display: grid; place-items: center; cursor: pointer; transition: background var(--k-dur-fast, 140ms) var(--k-ease, ease); }
.lightbox__btn:hover { background: rgba(255, 255, 255, 0.24); }
.lightbox__btn--close { top: 16px; right: 16px; }
.lightbox__btn--prev { left: 16px; top: 50%; transform: translateY(-50%); }
.lightbox__btn--next { right: 16px; top: 50%; transform: translateY(-50%); }
.lightbox__count { position: absolute; bottom: 18px; left: 50%; transform: translateX(-50%); color: rgba(255, 255, 255, 0.8); font-size: var(--k-type-small); font-variant-numeric: tabular-nums; }`,
  },
  {
    id: 'calendar',
    section: "Calendar",
    css: `/* === Calendar ===
   Single-cell selection + range pattern (shadcn / react-day-picker style).
   Range cells fill with primary-soft and lose corner radius on connection
   sides so the highlight reads as continuous. */
.calendar {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: var(--k-s-2) 0;
  font-size: var(--k-type-eyebrow);
}
.calendar__head {
  text-align: center;
  font-size: var(--k-type-caption);
  color: var(--k-fg-faint);
  padding: var(--k-s-4) 0;
  font-weight: var(--k-weight-medium);
}
/* Calendar cells follow Stature: compact = 28px (Linear/Notion slim picker),
 * balanced = 32px (shadcn default), bold = 40px (iOS-style tap target).
 * Aspect-ratio keeps cells square — min-height enforces stature minimum so
 * compact-stature really feels compact even in a wide container. */
.calendar__cell {
  aspect-ratio: 1;
  min-height: var(--k-cal-cell, 32px);
  width: 100%;
  display: grid;
  place-items: center;
  border-radius: var(--k-radius-md);
  color: var(--k-fg);
  /* Numeric controls share one digit treatment: medium weight (= system UI
     weight) at rest, tabular-nums so the date columns align. Selected/today
     bump to 600 below. Button-reset props (background/border/font) so the cell
     can be a real <button> — keyboard-operable, not a clickable <span>. */
  font-weight: var(--k-ui-weight, 500);
  font-variant-numeric: tabular-nums;
  font-family: var(--k-font-body);
  background: transparent;
  border: 0;
  cursor: pointer;
  position: relative;
}
.calendar__cell:hover { background: var(--k-state-hover); }
.calendar__cell--on { background: var(--k-primary); color: var(--k-primary-fg); font-weight: var(--k-weight-semibold); }
.calendar__cell--out { color: var(--k-fg-faint); opacity: 0.4; cursor: default; }
.calendar__cell--out:hover { background: transparent; }

/* Today: thin ring without changing background — works alongside selection */
.calendar__cell--today { box-shadow: inset 0 0 0 1px var(--k-fg-faint); }
.calendar__cell--today.calendar__cell--on { box-shadow: none; }

/* Range fill — primary-soft on dates between start and end, with edges
   flat-cornered to read as one connected band. */
.calendar__cell--range {
  background: var(--k-primary-soft);
  color: var(--k-primary-soft-fg);
  border-radius: 0;
}
.calendar__cell--range-start {
  background: var(--k-primary);
  color: var(--k-primary-fg);
  font-weight: var(--k-weight-semibold);
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}
.calendar__cell--range-end {
  background: var(--k-primary);
  color: var(--k-primary-fg);
  font-weight: var(--k-weight-semibold);
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}
/* Month-nav header (B4) — the title + prev/next cluster above the grid. Promotes
   the picker's hand-rolled header into the kit so the FULL date-picker is one
   exported pattern, not a per-app one-off. Pair the nav buttons with
   .btn--ghost.btn--icon.btn--sm; the consumer owns month-shift + keyboard nav. */
.calendar__nav { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--k-s-6); }
.calendar__nav-title { font-size: var(--k-type-small); font-weight: var(--k-weight-semibold); color: var(--k-fg); }
.calendar__nav-btns { display: inline-flex; gap: var(--k-s-2); }
/* Disabled date (B4) — a day you can't pick (past / blackout / sold-out),
   DISTINCT from --out (a faded prev/next-month day): muted + struck +
   non-interactive. The consumer adds the native \`disabled\` + this class; the
   recipe owns the look. Booking-grade pickers need this state. */
.calendar__cell--disabled { color: var(--k-fg-faint); opacity: 0.5; cursor: not-allowed; text-decoration: line-through; }
.calendar__cell--disabled:hover { background: transparent; }`,
  },
  {
    id: 'kbd',
    section: "KBD",
    css: `/* === KBD ===
   Fixed small radius (4px) — Kbd is a tactile metaphor, not a brand
   surface. Mirrors how data-viz elements stay restrained. */
.kbd {
  font-family: var(--k-font-mono);
  font-size: var(--k-type-eyebrow);
  padding: var(--k-s-2) var(--k-s-6);
  border-radius: 4px;
  border: 1px solid var(--k-border);
  background: var(--k-surface-2);
  color: var(--k-fg-muted);
}`,
  },
  {
    id: 'code',
    section: "Code",
    css: `/* === Code (inline) =======================================================
 * Inline monospace token on the sunken plane. The multi-line block with a copy
 * button + gutter is the separate "CodeBlock" recipe (.codeblock). */
.code {
  font-family: var(--k-font-mono);
  font-size: var(--k-type-small);
  background: var(--k-surface-sunken);
  color: var(--k-fg);
  border-radius: var(--k-radius-md);
  padding: var(--k-s-10) var(--k-s-12);
  border: 1px solid var(--k-border);
  white-space: pre;
  overflow-x: auto;
}`,
  },
  {
    id: 'dialog',
    section: "Dialog",
    css: `/* === Dialog === */
.dialog {
  border-radius: var(--k-radius-lg);
  border: 1px solid var(--k-border);
  background: var(--k-surface-raised);
  /* Never exceed the viewport on a narrow phone (a content-sized dialog has no
     intrinsic width cap otherwise). The frame demo's 90% rule still wins inside it. */
  max-width: calc(100vw - 2rem);
  /* Box padding floor (shadcn dialog = p-6 = 24); gap on the grid --k-space. */
  padding: var(--k-pad, 24px);
  box-shadow: var(--k-shadow-lg);
  display: flex;
  flex-direction: column;
  gap: var(--k-space, 16px);
  /* Scale-in enter — slower than popover (--k-dur-slow), more presence */
  transform-origin: center;
  animation: k-scale-in var(--k-dur-slow, 320ms) var(--k-ease-out, cubic-bezier(.05,.7,.1,1)) backwards;
}
/* Frame for modal demo — overlay backdrop, dialog centered inside */
.dialog-frame {
  position: relative;
  min-height: 220px;
  border: 1px solid var(--k-border);
  border-radius: var(--k-radius-md);
  background: var(--k-surface-sunken);
  overflow: hidden;
  display: grid;
  place-items: center;
  padding: var(--k-s-16);
}
.dialog-frame__backdrop {
  position: absolute;
  inset: 0;
  background: var(--k-scrim);
  animation: k-fade-in var(--k-dur, 200ms) var(--k-ease-out, cubic-bezier(.05,.7,.1,1)) backwards;
}
.dialog-frame .dialog { position: relative; max-width: 90%; }`,
  },
  {
    id: 'command-palette',
    section: "Command palette",
    css: `/* === Command palette ===
   Spacing scales with --k-space (density token) — Compact/Default/Comfortable
   themes get tighter/looser padding throughout. Sizes are calibrated against
   Linear / Cursor / GitHub cmdp's: input area generous, item rows breathable,
   section labels with clear top-space so each group reads as its own block. */
.cmdp {
  border-radius: var(--k-radius-lg);
  border: 1px solid var(--k-border);
  background: var(--k-surface-raised);
  box-shadow: var(--k-shadow-lg);
  overflow: hidden;
}
.cmdp__in {
  display: flex;
  align-items: center;
  gap: var(--k-s-12);
  padding: calc(var(--k-space, 16px) * 0.85) calc(var(--k-space, 16px) * 1);
  border-bottom: var(--k-divider);
}
/* Font-size uses --k-type-small to match every other input in the system.
 * Previously hardcoded to 15px ("primary tool" feel), but that meant the
 * combobox filter — which reuses .cmdp__in — rendered a different size
 * than its own select trigger and any sibling .in fields in the same form.
 * shadcn cmdk uses ~14px too; tight consistency beats marginal emphasis. */
.cmdp__in input {
  flex: 1;
  border: 0;
  outline: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: var(--k-type-small);
}
.cmdp__in input:focus,
.cmdp__in input:focus-visible { outline: 0; }
.cmdp__list {
  list-style: none;
  padding: var(--k-s-6);
  margin: 0;
  font-size: var(--k-type-small);
}
/* Command palette items follow the MD row grammar — slightly taller than
 * dropdown menu items because cmdp is a "search & select" surface, not a
 * "pick from a short list" one. The extra vertical room makes the search
 * results read as scannable cards rather than a packed menu. */
.cmdp__item {
  display: flex;
  align-items: center;
  gap: var(--k-row-gap, 10px);
  padding: 0 var(--k-row-px, 10px);
  min-height: var(--k-row-h-md, 32px);
  border-radius: var(--k-row-radius, 6px);
  color: var(--k-fg);
  width: 100%;
  text-align: left;
  background: transparent;
  border: 0;
  font-family: inherit;
  font-size: inherit;
  cursor: pointer;
}
.cmdp__item > svg { width: var(--k-row-icon, 14px); height: var(--k-row-icon, 14px); flex-shrink: 0; }
/* Mouse hover highlights a row the same way arrow-keys do — without this the
   list feels dead vs cmdk (hovering a command did nothing). Active (--on) and
   hover share one highlight token so only one row ever reads as "current". */
.cmdp__item:hover { background: var(--k-state-hover); }
.cmdp__item--on { background: var(--k-state-hover); }
/* Empty-state — cmdk's defining "no results" affordance. */
.cmdp__empty {
  padding: var(--k-s-14) var(--k-s-14) var(--k-s-20);
  text-align: center;
  color: var(--k-fg-muted);
  font-size: var(--k-type-small);
}
/* Section label between items — clear top-space so each group reads as its
   own block, not "one extra row that happens to be uppercase". */
.cmdp__section {
  padding: var(--k-s-14) var(--k-s-14) var(--k-s-4);
  font-size: var(--k-type-caption);
  text-transform: uppercase;
  letter-spacing: var(--k-track-eyebrow);
  color: var(--k-fg-faint);
  font-weight: var(--k-weight-medium);
}
.cmdp__list + .cmdp__section { border-top: var(--k-divider); margin-top: var(--k-s-6); }
/* Per-item leading icon + trailing shortcut — shadcn pattern */
.cmdp__item-icon { color: var(--k-fg-muted); display: inline-flex; flex: none; }
.cmdp__shortcut {
  margin-left: auto;
  display: inline-flex;
  gap: var(--k-s-4);
  font-family: var(--k-font-mono);
  font-size: var(--k-type-caption);
  color: var(--k-fg-faint);
}`,
  },
  {
    id: 'accordion',
    section: "Accordion",
    css: `/* === Accordion === */
.accordion details + details { border-top: var(--k-divider); }
.accordion summary {
  list-style: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--k-s-10) 0;
  cursor: pointer;
  font-size: var(--k-type-small);
  font-weight: var(--k-weight-medium);
}
.accordion summary::-webkit-details-marker { display: none; }
/* Chevron — rotates 180° when open. Uses inline SVG so it inherits color. */
.accordion__chevron {
  width: 14px;
  height: 14px;
  color: var(--k-fg-faint);
  transition: transform var(--k-dur, 200ms) var(--k-ease, ease);
  flex: none;
}
.accordion details[open] .accordion__chevron { transform: rotate(180deg); }
.accordion p { font-size: var(--k-type-small); color: var(--k-fg-muted); padding-bottom: var(--k-s-10); }`,
  },
  {
    id: 'pagination-breadcrumb',
    section: "Pagination & breadcrumb",
    css: `/* === Pagination & breadcrumb === */
.pagination { display: inline-flex; gap: var(--k-s-4); }
/* Pagination buttons — same count-chip formula as .badge--count.
 * Em-based so chip scales with --k-type-small. 2.25em on 12-13px font
 * lands ~27-29px (current visual target). Multi-digit ("10", "99")
 * auto-pills via min-width + padding-inline, keeping height constant. */
.pagination button {
  height: 2.25em;
  min-width: 2.25em;
  padding-inline: 0.63em;
  padding-block: 0;
  border-radius: 999px;
  border: 1px solid var(--k-border);
  background: var(--k-surface);
  font-size: var(--k-type-small);
  font-weight: var(--k-ui-weight, 500);
  line-height: 1;
  cursor: pointer;
  font-variant-numeric: tabular-nums;
  /* center single-child content (digits or chevrons) — without this an SVG
     icon falls back to vertical-align: baseline and drifts off-center. */
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.pagination button[aria-current='true'] { background: var(--k-primary); color: var(--k-primary-fg); border-color: var(--k-primary); }
/* Prev/next at the ends are disabled — a real pager never lets you page past
   the first/last. Greys out + blocks the click instead of silently no-op'ing. */
.pagination button:disabled { opacity: var(--k-disabled-opacity, 0.5); cursor: not-allowed; pointer-events: none; }
.pagination__ellipsis {
  display: inline-grid;
  place-items: center;
  min-width: 1.6em;
  height: 2.25em;
  color: var(--k-fg-faint);
  font-size: var(--k-type-small);
}
.breadcrumb {
  display: inline-flex;
  align-items: center;
  gap: var(--k-s-4);
  font-size: var(--k-type-small);
  color: var(--k-fg-muted);
}
.breadcrumb a { color: var(--k-fg); }
.breadcrumb svg { color: var(--k-fg-faint); }`,
  },
  {
    id: 'chart',
    section: "Chart",
    css: `/* === Chart ===
   Data-viz elements (bars, sparklines) deliberately do NOT scale with the
   theme's radius — a pill-shaped bar reads as a pill, not as data. A small
   fixed radius keeps the chart legible across all 5 radius choices.
   The accent color (not primary) sits here on purpose: a chart is where
   the user's brand accent earns its keep in a SaaS dashboard.

   Bar sizing follows shadcn/Recharts convention: bars 16-30px with ~2:1
   bar-to-gap ratio. flex:1 gave fat bars filling the row — slimmer + more
   breathing room reads as data rather than blocks. */
.barchart {
  display: flex;
  align-items: flex-end;
  gap: var(--k-s-8);
  height: 80px;
}
.barchart__bar {
  flex: 1 1 0;
  min-width: 14px;
  max-width: 30px;
  position: relative;
  background: var(--k-accent);
  /* Bar-top follows the system radius but stays CAPPED: a chart bar should
   * read square-ish, never a pill. Couples to the (scaling) inner radius so a
   * square Style → square tops, but min()-clamps at 4px so round Styles don't
   * give lozenge-topped bars (bad charting practice). Same idiom as
   * --k-row-radius. Was a hardcoded 3px, decoupled from the Radius control. */
  border-radius: min(4px, var(--k-radius-sm)) min(4px, var(--k-radius-sm)) 0 0;
  opacity: 0.9;
  transform-origin: bottom;
  /* Easing follows the theme's --k-ease-out so Playful gives the bars a soft overshoot too */
  animation: bar-rise 700ms var(--k-ease-out, cubic-bezier(.2, .8, .2, 1)) backwards;
  /* Hover lifts the bar to full opacity — pairs with the value tooltip below. */
  transition: opacity var(--k-dur-fast, 120ms) var(--k-ease, ease);
}
@keyframes bar-rise { from { transform: scaleY(0); } to { transform: scaleY(1); } }
/* Hover/focus value tooltip — CSS-only so it survives the framework-neutral
   export (no JS runtime); same dark-pill look as .tt__pop. Bars carry
   tabindex + aria-label, so the global :focus-visible ring plus this tip make
   the data keyboard-reachable, not just hover-only. */
.barchart__bar:hover,
.barchart__bar:focus-visible { opacity: 1; }
.barchart__tip {
  position: absolute;
  bottom: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%) translateY(3px);
  background: var(--k-fg);
  color: var(--k-bg);
  font-size: var(--k-type-eyebrow);
  font-weight: var(--k-weight-semibold);
  line-height: 1;
  padding-block: var(--k-s-4);
  padding-inline: var(--k-s-6);
  border-radius: var(--k-radius-sm);
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--k-dur-fast, 120ms) var(--k-ease, ease),
              transform var(--k-dur-fast, 120ms) var(--k-ease, ease);
  z-index: var(--k-z-tooltip);
}
.barchart__bar:hover .barchart__tip,
.barchart__bar:focus-visible .barchart__tip {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}
/* Stagger up to 7 bars — covers gallery card (7) and dashboard 7-day chart */
.barchart__bar:nth-child(1) { animation-delay: 0ms; }
.barchart__bar:nth-child(2) { animation-delay: 60ms; }
.barchart__bar:nth-child(3) { animation-delay: 120ms; }
.barchart__bar:nth-child(4) { animation-delay: 180ms; }
.barchart__bar:nth-child(5) { animation-delay: 240ms; }
.barchart__bar:nth-child(6) { animation-delay: 300ms; }
.barchart__bar:nth-child(7) { animation-delay: 360ms; }
/* Categorical variant — each bar is a distinct series, colored from the
 * derived chart palette (chart-1..6). For by-category breakdowns; the default
 * single-series time chart above stays one accent color. */
.barchart--series .barchart__bar { opacity: 1; }
.barchart--series .barchart__bar:nth-child(1) { background: var(--k-chart-1); }
.barchart--series .barchart__bar:nth-child(2) { background: var(--k-chart-2); }
.barchart--series .barchart__bar:nth-child(3) { background: var(--k-chart-3); }
.barchart--series .barchart__bar:nth-child(4) { background: var(--k-chart-4); }
.barchart--series .barchart__bar:nth-child(5) { background: var(--k-chart-5); }
.barchart--series .barchart__bar:nth-child(6) { background: var(--k-chart-6); }
/* Legend — series swatch + label row under a categorical chart */
.chart-legend { display: flex; flex-wrap: wrap; gap: var(--k-s-6) var(--k-s-12); margin-top: var(--k-s-10); }
.chart-legend__item { display: inline-flex; align-items: center; gap: var(--k-s-4); font-size: var(--k-type-eyebrow); color: var(--k-fg-muted); }
.chart-legend__dot { width: 8px; height: 8px; border-radius: 2px; flex: none; }

/* ChartFrame — presentational chart family on the --k-chart-1..6 palette.
 * One container, five render modes (line / area / bar / stacked / donut).
 * The SVG fills its frame; series colours come straight from the palette. */
.chart { display: flex; flex-direction: column; gap: var(--k-s-2); }
.chart__canvas { width: 100%; position: relative; }
.chart__svg { width: 100%; height: 100%; display: block; }
.chart__svg--donut { max-width: 220px; margin: 0 auto; }
.chart__axis { stroke: var(--k-border); stroke-width: 1; vector-effect: non-scaling-stroke; }
.chart__donut-num { font-size: var(--k-type-h3); font-weight: var(--k-weight-bold); fill: var(--k-fg); font-family: var(--k-font-display); }
.chart__donut-cap { font-size: var(--k-type-caption); fill: var(--k-fg-faint); text-transform: uppercase; letter-spacing: var(--k-track-eyebrow); }
.chart__legend { display: flex; flex-wrap: wrap; gap: var(--k-s-6) var(--k-s-12); margin-top: var(--k-s-10); }
.chart__legend-item { display: inline-flex; align-items: center; gap: var(--k-s-4); font-size: var(--k-type-eyebrow); color: var(--k-fg-muted); }
.chart__swatch { width: 9px; height: 9px; border-radius: 2px; flex: none; }
/* Gridlines — faint horizontal guides behind the marks. Baseline reuses
 * .chart__axis (stronger). Both are non-scaling so they stay 1px under the
 * stretched (preserveAspectRatio:none) viewBox. */
.chart__grid { stroke: var(--k-border); stroke-width: 1; opacity: 0.5; vector-effect: non-scaling-stroke; }
/* y-axis ticks — crisp HTML overlay (SVG text would stretch). Sits in the
 * top-left, three labels spread top→bottom matching the gridlines. */
.chart__yaxis { position: absolute; inset: 0 auto 0 0; display: flex; flex-direction: column; justify-content: space-between; padding: 0 var(--k-s-4) 0 0; pointer-events: none; z-index: 1; }
.chart__ytick { font-size: var(--k-type-caption); color: var(--k-fg-faint); font-variant-numeric: tabular-nums; line-height: 1; background: var(--k-surface); padding: 0 var(--k-s-2) 0 0; border-radius: 2px; }
/* x-axis labels — evenly distributed under the canvas. */
.chart__xlabels { display: flex; justify-content: space-between; margin-top: var(--k-s-4); }
.chart__xlabel { font-size: var(--k-type-caption); color: var(--k-fg-faint); font-variant-numeric: tabular-nums; transition: color var(--k-dur-fast, 140ms) var(--k-ease, ease); }
.chart__xlabel--on { color: var(--k-fg); font-weight: var(--k-weight-semibold); }
/* Tracking cursor — vertical hairline at the hovered column. */
.chart__cursor { stroke: var(--k-fg-faint); stroke-width: 1; stroke-dasharray: 3 3; vector-effect: non-scaling-stroke; opacity: 0.7; pointer-events: none; }
/* Hover tooltip — floats above the hovered column, centred + clamped inside. */
.chart__tip { position: absolute; top: var(--k-s-2); transform: translateX(-50%); min-width: 116px; max-width: 180px; padding: var(--k-s-6) var(--k-s-8); background: var(--k-surface-overlay, var(--k-surface-raised)); border: var(--k-hairline, 1px solid var(--k-border)); border-radius: var(--k-radius-sm); box-shadow: var(--k-shadow-md); font-size: var(--k-type-caption); pointer-events: none; z-index: 3; }
.chart__tip-label { font-weight: var(--k-weight-semibold); color: var(--k-fg); margin-bottom: var(--k-s-4); }
.chart__tip-row { display: flex; align-items: center; gap: var(--k-s-4); line-height: 1.5; }
.chart__tip-dot { width: 8px; height: 8px; border-radius: 2px; flex: none; }
.chart__tip-name { color: var(--k-fg-muted); }
.chart__tip-val { margin-left: auto; font-weight: var(--k-weight-semibold); color: var(--k-fg); font-variant-numeric: tabular-nums; }

/* ----- TreeView (.tree) -----
 * Disclosure tree — rows with a rotating chevron; nested .tree__group is
 * indented with a guide-line. Selected row follows the selection accent. */
.tree { font-size: var(--k-type-small); }
.tree__row { display: flex; align-items: center; gap: var(--k-s-6); min-height: var(--k-row-h-sm, 28px); padding: 0 var(--k-s-8); border-radius: var(--k-radius-sm, 6px); cursor: pointer; color: var(--k-fg-muted); }
.tree__row:hover { background: var(--k-state-hover); color: var(--k-fg); }
.tree__row--on { background: var(--k-state-selected-bg, var(--k-primary-soft)); color: var(--k-state-selected-fg, var(--k-primary)); font-weight: var(--k-weight-semibold); }
.tree__chev { display: inline-flex; color: var(--k-fg-faint); transition: transform var(--k-dur-fast, 140ms) var(--k-ease, ease); flex: none; }
.tree__chev--leaf { visibility: hidden; }
.tree__row[aria-expanded='true'] .tree__chev { transform: rotate(90deg); }
.tree__icon { display: inline-flex; color: var(--k-fg-faint); flex: none; }
.tree__group { margin-left: var(--k-s-12); border-left: var(--k-divider); padding-left: var(--k-s-6); }

/* ----- StatusPage (.statuspage) -----
 * Service status board — overall banner + per-service 90-day uptime ticks.
 * Tick tone uses the semantic colours (success / warning / danger). */
.statuspage { display: flex; flex-direction: column; gap: var(--k-s-12); }
.statuspage__banner { display: flex; align-items: center; gap: var(--k-s-8); padding: var(--k-s-10) var(--k-s-12); border-radius: var(--k-radius-md); background: var(--k-success-soft); color: var(--k-success-soft-fg); font-weight: var(--k-weight-semibold); font-size: var(--k-type-small); }
.statuspage__row { display: flex; align-items: center; gap: var(--k-s-10); }
.statuspage__name { font-size: var(--k-type-small); width: 116px; flex: none; }
.statuspage__bars { display: flex; gap: var(--k-s-2); flex: 1; min-width: 0; }
.statuspage__tick { flex: 1; height: 22px; border-radius: 2px; background: var(--k-success); }
.statuspage__tick--warn { background: var(--k-warning); }
.statuspage__tick--down { background: var(--k-danger); }
.statuspage__pct { font-size: var(--k-type-eyebrow); color: var(--k-fg-muted); width: 46px; text-align: right; flex: none; }

/* NotificationCenter — now just the LIST system: \`.list .list--flush\` rows with
 * \`.list__lead--icon-muted\` + \`.list__title--lg\` + \`.list__sub\` + a trailing
 * \`.list__dot\` (unread). No separate .notif-item/.notif-center family. */

/* ----- Kanban (.kanban) -----
 * Presentational board — equal-width sunken columns with a header count and
 * stacked draggable-looking cards. (No DnD — the layout is the deliverable.) */
/* Columns keep a 220px floor and the board scrolls horizontally rather than
 * crushing 4 columns into a phone width (the standard kanban-on-mobile pattern);
 * on wide screens 1fr lets them share the space. */
.kanban { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(min(220px, 100%), 1fr); gap: var(--k-s-10); overflow-x: auto; }
.kanban__col { background: var(--k-surface-sunken); border-radius: var(--k-radius-md); padding: var(--k-stack-gap, 8px); display: flex; flex-direction: column; gap: var(--k-stack-gap, 8px); }
.kanban__col-head { display: flex; align-items: center; justify-content: space-between; font-size: var(--k-type-eyebrow); font-weight: var(--k-weight-semibold); color: var(--k-fg-muted); padding: var(--k-s-2) var(--k-s-4); }
.kanban__count { background: var(--k-surface); border-radius: 999px; padding: 1px var(--k-s-6); font-size: var(--k-type-caption); }
/* Real <button> issue card — focusable + keyboard-activatable. The resets make
 * it read like the old div; hover/active use the shared discrete-card system
 * (border + lift) so it matches .stat-tile--clickable / .quickact__tile. */
.kanban__card { width: 100%; text-align: left; font-family: inherit; color: inherit; appearance: none; -webkit-appearance: none; background: var(--k-surface); border: 1px solid var(--k-border); border-radius: var(--k-radius-sm, 6px); padding: var(--k-space, 16px); font-size: var(--k-type-small); display: flex; flex-direction: column; gap: var(--k-stack-gap, 8px); box-shadow: var(--k-shadow-sm); cursor: pointer; transition: border-color var(--k-dur-fast, 140ms) var(--k-ease, ease), box-shadow var(--k-dur-fast, 140ms) var(--k-ease, ease), transform var(--k-dur-fast, 140ms) var(--k-ease, ease); }
.kanban__card:hover { border-color: var(--k-state-border, var(--k-border)); box-shadow: var(--k-shadow-md); transform: translateY(-1px); }
.kanban__card:active { transform: translateY(0); }
/* Title is CONTENT, so it rides --k-type-body (scales with the Text-size
 * control: 14→16 S→XL) — NOT --k-type-small, which is reserved for the
 * meta/labels below it. The card base stays small so key/points/tag default
 * small; only the title is lifted to the content tier. */
.kanban__card-title { font-size: var(--k-type-body); font-weight: var(--k-weight-medium); line-height: 1.35; }
.kanban__card-foot { display: flex; align-items: center; justify-content: space-between; gap: var(--k-s-8); }
/* Rich board-card parts (issue-tracker style): epic tag, issue key + type
 * glyph, story-point pill, inline meta glyphs, assignee avatar. */
.kanban__tag { align-self: flex-start; max-width: 100%; font-size: var(--k-type-caption); font-weight: var(--k-weight-bold); letter-spacing: var(--k-track-eyebrow); text-transform: uppercase; padding: var(--k-s-2) var(--k-s-6); border-radius: var(--k-radius-sm, 4px); background: var(--k-primary); color: var(--k-primary-fg); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.kanban__stats { display: inline-flex; align-items: center; gap: var(--k-s-6); min-width: 0; }
.kanban__key { display: inline-flex; align-items: center; gap: var(--k-s-4); font-size: var(--k-type-eyebrow); font-weight: var(--k-weight-semibold); color: var(--k-fg-muted); white-space: nowrap; }
.kanban__key svg, .kanban__icons svg { width: 14px; height: 14px; flex: none; }
.kanban__pts { display: inline-flex; align-items: center; justify-content: center; min-width: 18px; height: 18px; padding: 0 var(--k-s-4); border-radius: 999px; background: var(--k-surface-sunken); font-size: var(--k-type-caption); font-weight: var(--k-weight-semibold); color: var(--k-fg-muted); }
.kanban__icons { display: inline-flex; align-items: center; gap: var(--k-s-6); color: var(--k-fg-faint); }
.kanban__prio { display: inline-flex; flex-direction: column; gap: 1.5px; width: 11px; color: var(--k-fg-faint); }
.kanban__prio i { height: 1.5px; border-radius: 1px; background: currentColor; }`,
  },
  {
    id: 'sparkline',
    section: "Sparkline",
    css: `/* === Sparkline ===
   Inline micro-chart inside a stat-tile. Fixed dimensions so it reads as a
   "trend hint", not a real chart. Uses --k-primary (not --k-accent) so it
   matches the stat-tile's tone. */
.sparkline {
  display: block;
  width: 100%;
  height: 30px;
  margin-top: var(--k-s-6);
  overflow: visible;
}
.sparkline__path {
  fill: none;
  stroke: var(--k-primary);
  stroke-width: 1.5;
}
.sparkline__area {
  fill: var(--k-primary);
  opacity: 0.12;
  stroke: none;
}`,
  },
  {
    id: 'usage-meter',
    section: "Usage meter",
    css: `/* === Usage meter ===
   Progress bar with title + percentage + CTA. Banded color shifts from
   primary at low % to warning at 75%+ to danger at 90%+ — visual urgency
   without a separate alert. */
.usage {
  border: 1px solid var(--k-border);
  border-radius: var(--k-radius-md);
  padding: calc(var(--k-space, 14px) * 0.75);
  background: var(--k-surface);
  display: flex;
  flex-direction: column;
  gap: var(--k-s-10);
}
.usage__head { display: flex; align-items: baseline; justify-content: space-between; }
.usage__title { font-weight: var(--k-weight-semibold); font-size: var(--k-type-body); }
.usage__pct { font-size: var(--k-type-eyebrow); color: var(--k-fg-muted); font-variant-numeric: tabular-nums; }
.usage__bar {
  width: 100%;
  height: 6px;
  background: var(--k-surface-2);
  border-radius: 999px;
  overflow: hidden;
}
.usage__fill {
  height: 100%;
  background: var(--k-fill, var(--k-primary));
  border-radius: 999px;
  animation: progress-grow 800ms var(--k-ease-out, cubic-bezier(.2,.8,.2,1)) backwards;
  transform-origin: left;
}
.usage--warn .usage__fill { background: var(--k-warning); }
.usage--danger .usage__fill { background: var(--k-danger); }
.usage__foot { display: flex; align-items: center; justify-content: space-between; }
.usage__hint { font-size: var(--k-type-caption); color: var(--k-fg-muted); }`,
  },
  {
    id: 'combobox',
    section: "Combobox",
    css: `/* === Combobox ===
   Autocomplete input — trigger looks like a select but opens a filtered list.
   Used in command palette style but inline-anchored. */
.combobox { position: relative; }
/* Absolute by default — in real apps combobox always floats above content.
   Use .combobox__pop--inline to flow inline (rare, e.g. for nested forms). */
/* Combobox dropdown — same overlay grammar as .menu (overlay surface, soft
 * shadow, sub-tile scrollbar). Items follow the SM row grammar so a long
 * autocomplete list reads with the same rhythm as the dropdown menu. */
.combobox__pop {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  min-width: 200px;
  background: var(--k-surface-overlay, var(--k-surface-raised));
  border: var(--k-hairline, 1px solid var(--k-border));
  border-radius: var(--k-radius-md);
  box-shadow: var(--k-shadow-lg, var(--k-shadow-md));
  max-height: 200px;
  overflow-y: auto;
  overflow-x: hidden;
  font-size: var(--k-type-small);
  animation: var(--k-anim-menu, k-menu-roll 180ms cubic-bezier(.05,.7,.1,1) both);
  transform-origin: top;
  z-index: var(--k-z-dropdown);
  /* Container exposes its nested radius for child items (outer − padding).
   * Without this, the first/last item's hover state would have an 8px corner
   * that doesn't visually nest inside a 10-12px container corner. */
  --k-nest-radius: max(2px, calc(var(--k-radius-md) - 4px));
}
.combobox__pop--inline { position: static; }
.combobox__list { list-style: none; padding: var(--k-s-4); margin: 0; }
.combobox__item {
  display: flex;
  align-items: center;
  gap: var(--k-row-gap, 10px);
  padding: 0 var(--k-row-px, 10px);
  min-height: var(--k-row-h-sm, 28px);
  border-radius: var(--k-nest-radius, var(--k-row-radius, 6px));
  cursor: pointer;
}
.combobox__item:hover, .combobox__item--on { background: var(--k-state-hover); }
.combobox__item--selected .combobox__check { color: var(--k-primary); }
.combobox__check { width: 14px; flex: none; color: transparent; }
.combobox__empty { padding: var(--k-s-10); text-align: center; color: var(--k-fg-faint); font-size: var(--k-type-small); }`,
  },
  {
    id: 'dropdown-menu',
    section: "Dropdown menu",
    css: `/* === Dropdown menu ===
   Kebab-triggered menu with sections, separators, checkmarks. Different from
   command palette (no search) and from popover (focused on actions). */
.menu {
  min-width: 180px;
  padding: var(--k-s-4);
  background: var(--k-surface-overlay, var(--k-surface-raised));
  border: var(--k-hairline, 1px solid var(--k-border));
  border-radius: var(--k-radius-md);
  box-shadow: var(--k-shadow-lg, var(--k-shadow-md));
  font-size: var(--k-type-small);
  animation: var(--k-anim-menu, k-menu-roll 200ms cubic-bezier(.05,.7,.1,1) both);
  transform-origin: top;
  overflow: hidden;
  /* Nested radius — items pick this up via their border-radius rule.
   * Math: outer (radius-md) − padding (4px) = inner radius needed for
   * concentric curves. Without this, hover state of first/last item
   * corners look "boxy" against a rounded menu corner. */
  --k-nest-radius: max(2px, calc(var(--k-radius-md) - 4px));
}`,
  },
  {
    id: 'roll-down-item-stagger',
    section: "Roll-down item stagger",
    css: `/* === Roll-down item stagger (#210) — Material-3 signature ==============
 * Each menu item rolls out from under the panel's advancing top edge:
 * translateY(-10px)→0 + fade, staggered by --stagger-i × --k-menu-stagger.
 * The stagger step is 0ms when Motion=None, so the cascade collapses to an
 * instant reveal. Per-panel selector strategy:
 *  - .menu__item   → nth-of-type (items are <button>; labels/seps are <div>,
 *    so type-counting skips them and the index never drifts).
 *  - .combobox__item / .cmdp__item → nth-child (uniform sibling lists).
 *    Index capped at 9 via :nth-…(n+10). */
.menu__item, .combobox__item, .cmdp__item {
  animation: var(--k-anim-menu-item, k-menu-item 200ms cubic-bezier(.05,.7,.1,1) both);
  animation-delay: calc(var(--stagger-i, 0) * var(--k-menu-stagger, 0ms));
}
.menu__item:nth-of-type(1){--stagger-i:0} .menu__item:nth-of-type(2){--stagger-i:1}
.menu__item:nth-of-type(3){--stagger-i:2} .menu__item:nth-of-type(4){--stagger-i:3}
.menu__item:nth-of-type(5){--stagger-i:4} .menu__item:nth-of-type(6){--stagger-i:5}
.menu__item:nth-of-type(7){--stagger-i:6} .menu__item:nth-of-type(8){--stagger-i:7}
.menu__item:nth-of-type(9){--stagger-i:8} .menu__item:nth-of-type(n+10){--stagger-i:9}
.combobox__item:nth-child(1){--stagger-i:0} .combobox__item:nth-child(2){--stagger-i:1}
.combobox__item:nth-child(3){--stagger-i:2} .combobox__item:nth-child(4){--stagger-i:3}
.combobox__item:nth-child(5){--stagger-i:4} .combobox__item:nth-child(6){--stagger-i:5}
.combobox__item:nth-child(7){--stagger-i:6} .combobox__item:nth-child(n+8){--stagger-i:7}
.cmdp__item:nth-child(1){--stagger-i:0} .cmdp__item:nth-child(2){--stagger-i:1}
.cmdp__item:nth-child(3){--stagger-i:2} .cmdp__item:nth-child(4){--stagger-i:3}
.cmdp__item:nth-child(5){--stagger-i:4} .cmdp__item:nth-child(n+6){--stagger-i:5}

/* Menu items follow the SM row grammar — dense, scannable, designed for
 * lists of 5-15 options. Height locked to --k-row-h-sm (28px) so rows
 * stack on the same rhythm as table rows and dropdown options.
 * Border-radius prefers --k-nest-radius (set by parent .menu) so the
 * item corners visually nest inside the menu container corners. */
.menu__item {
  display: flex;
  align-items: center;
  gap: var(--k-row-gap, 10px);
  padding: 0 var(--k-row-px, 10px);
  min-height: var(--k-row-h-sm, 28px);
  border-radius: var(--k-nest-radius, var(--k-row-radius, 6px));
  cursor: pointer;
  color: var(--k-fg);
  background: transparent;
  border: 0;
  width: 100%;
  text-align: left;
  font: inherit;
  /* --k-type-small (not body) — match .combobox__item / .cmdp__item and stay ≤ the
     trigger button's own size. Was --k-type-body, which made dropdown rows render
     LARGER than the button that opened them. */
  font-size: var(--k-type-small);
}
.menu__item > svg { width: var(--k-row-icon, 14px); height: var(--k-row-icon, 14px); flex-shrink: 0; }
.menu__item:hover { background: var(--k-state-hover); }
/* Destructive menu items — pattern parity with shadcn/Radix DropdownMenu:
 * red text on transparent base, danger-soft tint background on hover. The
 * earlier \`--k-danger-fg\` value was the FOREGROUND used ON a danger fill
 * (white text on a red button), which rendered invisible white-on-white
 * when applied as \`color:\` on a transparent menu row. */
.menu__item--danger { color: var(--k-danger); }
.menu__item--danger:hover { background: var(--k-danger-soft); color: var(--k-danger); }
.menu__item--check::before {
  content: '✓';
  margin-right: var(--k-s-4);
  color: var(--k-primary);
  font-weight: var(--k-weight-semibold);
}
.menu__item--uncheck::before { content: ''; display: inline-block; width: 12px; margin-right: var(--k-s-4); }
.menu__shortcut { margin-left: auto; font-family: var(--k-font-mono); font-size: var(--k-type-caption); color: var(--k-fg-faint); }
.menu__sep { height: var(--k-bw); background: var(--k-border); margin: var(--k-s-4) 0; }
.menu__label { padding: var(--k-s-6) var(--k-s-10) var(--k-s-2); font-size: var(--k-type-caption); text-transform: uppercase; letter-spacing: var(--k-track-eyebrow); color: var(--k-fg-faint); font-weight: var(--k-weight-medium); }`,
  },
  {
    id: 'menubar',
    section: "Menubar",
    css: `/* === Menubar === — the desktop app menu bar (File / Edit / View …). A thin
   horizontal strip of triggers; each opens the shared .menu popup. WAI-ARIA
   menubar: role=menubar + roving tabindex across .menubar__item triggers. */
.menubar {
  display: flex;
  align-items: center;
  gap: var(--k-s-2);
  padding: var(--k-s-2);
  background: var(--k-chrome-bg, var(--k-surface));
  border: var(--k-bw) solid var(--k-border);
  border-radius: var(--k-radius-md);
}
.menubar__item {
  appearance: none;
  -webkit-appearance: none;
  background: none;
  border: 0;
  font: inherit;
  font-size: var(--k-type-small);
  color: var(--k-fg);
  padding: var(--k-s-4) var(--k-s-10);
  border-radius: var(--k-radius-sm);
  cursor: pointer;
  white-space: nowrap;
}
.menubar__item:hover { background: var(--k-state-hover); }
.menubar__item[aria-expanded="true"] { background: var(--k-state-hover); }
.menubar__item:focus-visible { outline: var(--k-focus-w, 2px) solid var(--k-ring); outline-offset: -2px; }`,
  },
  {
    id: 'resizable',
    section: "Resizable",
    css: `/* === Resizable === — draggable split panes (IDE / editor split-pane). Two
   .resizable__pane around a .resizable__handle window-splitter (role=separator,
   focusable, Arrow keys to resize). The consumer drives the first pane's
   flex-basis; the handle is the drag affordance + keyboard target. */
.resizable {
  display: flex;
  width: 100%;
  min-height: 0;
  border: var(--k-bw) solid var(--k-border);
  border-radius: var(--k-radius-md);
  overflow: hidden;
  background: var(--k-surface);
}
.resizable__pane { overflow: auto; min-width: 0; }
.resizable__handle {
  flex: none;
  align-self: stretch;
  width: var(--k-s-10);
  padding: 0;
  border: 0;
  background: var(--k-surface-2);
  cursor: col-resize;
  position: relative;
  touch-action: none;
}
.resizable__handle::before {
  content: '';
  position: absolute;
  top: 50%; left: 50%;
  width: 2px; height: var(--k-s-24, 24px);
  transform: translate(-50%, -50%);
  border-radius: 999px;
  background: var(--k-fg-faint);
}
.resizable__handle:hover { background: var(--k-state-hover); }
.resizable__handle:hover::before { background: var(--k-fg-muted); }
.resizable__handle:focus-visible { outline: var(--k-focus-w, 2px) solid var(--k-ring); outline-offset: -2px; }`,
  },
  {
    id: 'stepper',
    section: "Stepper",
    css: `/* === Stepper ===
   Linear progress through a wizard. 4 dots with connecting lines, current
   step filled, past steps shown as checkmarks. */
.stepper {
  display: flex;
  align-items: center;
  gap: 0;
  padding: var(--k-s-8) 0;
}
.stepper__step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--k-s-6);
  flex: 1;
  position: relative;
  font-size: var(--k-type-eyebrow);
  color: var(--k-fg-muted);
}
.stepper__dot {
  width: calc(var(--k-in-h-default) - 0.75rem);
  height: calc(var(--k-in-h-default) - 0.75rem);
  border-radius: 50%;
  background: var(--k-surface-2);
  color: var(--k-fg-muted);
  display: inline-grid;
  place-items: center;
  font-size: var(--k-type-eyebrow);
  font-weight: var(--k-weight-semibold);
  border: max(1.5px, var(--k-bw)) solid var(--k-border);
  position: relative;
  z-index: 1;
  transition: background var(--k-dur, 200ms) var(--k-ease, ease);
}
.stepper__dot svg { width: 13px; height: 13px; }
.stepper__step--done .stepper__dot { background: var(--k-primary); color: var(--k-primary-fg); border-color: var(--k-primary); }
.stepper__step--current .stepper__dot { background: var(--k-surface); color: var(--k-primary); border-color: var(--k-primary); box-shadow: 0 0 0 3px var(--k-primary-soft); }
.stepper__step--current { color: var(--k-fg); font-weight: var(--k-weight-medium); }
.stepper__step + .stepper__step::before {
  content: '';
  position: absolute;
  top: 12px;
  left: -50%;
  right: 50%;
  height: 1.5px;
  background: var(--k-border);
  z-index: 0;
}
.stepper__step--done + .stepper__step::before,
.stepper__step--current + .stepper__step::before { background: var(--k-primary); }`,
  },
  {
    id: 'file-upload-dropzone',
    section: "File upload dropzone",
    css: `/* === File upload dropzone === */
.dropzone {
  border: 2px dashed var(--k-border);
  border-radius: var(--k-radius-md);
  padding: var(--k-s-24) var(--k-s-16);
  text-align: center;
  background: var(--k-surface-sunken);
  color: var(--k-fg-muted);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--k-s-6);
  cursor: pointer;
  transition: border-color var(--k-dur, 200ms), background var(--k-dur, 200ms);
}
.dropzone:hover, .dropzone--over {
  border-color: var(--k-primary);
  background: var(--k-primary-soft);
  color: var(--k-primary-soft-fg);
}
.dropzone__icon {
  width: var(--k-icon-chip);
  height: var(--k-icon-chip);
  border-radius: 50%;
  background: var(--k-surface-2);
  color: var(--k-fg);
  display: inline-grid;
  place-items: center;
}
.dropzone__title { font-weight: var(--k-weight-semibold); color: var(--k-fg); font-size: var(--k-type-body); }
.dropzone__hint { font-size: var(--k-type-caption); }`,
  },
  {
    id: 'toast-stack',
    section: "Toast stack",
    css: `/* === Toast stack ===
   In production this stack pins bottom-right of the viewport (use position:
   fixed + bottom/right). In the gallery demo it lives inside a bordered
   .toast-demo-frame with trigger buttons — clearly a sandbox, not chrome.
   The tone-coded left border + dismiss button are the actual pattern;
   positioning is a consumer concern, not a token concern. */
.toast-demo-frame {
  position: relative;
  min-height: 110px;
  border: 1px dashed var(--k-border);
  border-radius: var(--k-radius-md);
  background: var(--k-surface-sunken);
  padding: var(--k-s-10);
  display: flex;
  align-items: flex-end;
  overflow: hidden;
}
.toast-demo-frame__empty {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: var(--k-type-eyebrow);
  color: var(--k-fg-faint);
  pointer-events: none;
}
.toast-stack {
  display: flex;
  flex-direction: column-reverse;
  gap: var(--k-s-6);
  align-items: stretch;
  width: 100%;
}
.toast {
  display: flex;
  align-items: flex-start;
  gap: var(--k-s-10);
  padding: var(--k-s-10) var(--k-s-12);
  background: var(--k-surface-raised);
  border: 1px solid var(--k-border);
  border-radius: var(--k-radius-md);
  box-shadow: var(--k-shadow-md);
  font-size: var(--k-type-small);
  animation: var(--k-anim-slide-up, k-slide-up 240ms ease) backwards;
}
.toast--success { border-left: 3px solid var(--k-success); }
.toast--info    { border-left: 3px solid var(--k-info); }
.toast--warn    { border-left: 3px solid var(--k-warning); }
.toast--error   { border-left: 3px solid var(--k-danger); }
.toast__body { flex: 1; min-width: 0; }
.toast__title { font-weight: var(--k-weight-semibold); }
.toast__sub { color: var(--k-fg-muted); font-size: var(--k-type-small); margin-top: 1px; }
.toast__close {
  background: transparent;
  border: 0;
  padding: var(--k-s-2);
  cursor: pointer;
  color: var(--k-fg-muted);
  display: inline-flex;
  border-radius: var(--k-radius-md);
}
.toast__close:hover { color: var(--k-fg); background: var(--k-state-hover); }`,
  },
  {
    id: 'tag-input',
    section: "Tag input",
    css: `/* === Tag input ===
   Multi-value input where each value is a removable chip. */
.taginput {
  display: flex;
  flex-wrap: wrap;
  gap: var(--k-s-4);
  padding: var(--k-s-4) var(--k-s-8);
  border: var(--k-bw, 1px) solid var(--k-field-border-color); border-bottom-color: var(--k-field-underline-color);
  border-radius: var(--k-field-radius);
  background: var(--k-field-bg);
  min-height: var(--k-in-h-default);
  align-items: center;
}
.taginput:focus-within { outline: 2px solid transparent; outline-offset: 2px; border-color: var(--k-ring); box-shadow: 0 0 0 3px var(--k-ring-halo); }
/* Filter-chip pattern (Linear/Vercel-style) — these are user-added
 * filter VALUES, not brand statements. Neutral surface + fg gives
 * legible contrast in both light and dark mode, where the previous
 * primary-soft + primary combo was low-contrast in dark. The hairline
 * border anchors the pill against the input's own surface. */
.taginput__chip {
  display: inline-flex;
  align-items: center;
  gap: var(--k-s-4);
  padding: var(--k-s-2) var(--k-s-4) var(--k-s-2) var(--k-s-8);
  border-radius: 999px;
  background: var(--k-surface-2);
  color: var(--k-fg);
  border: var(--k-bw) solid var(--k-border);
  font-size: var(--k-type-eyebrow);
  font-weight: var(--k-weight-medium);
}
.taginput__remove {
  background: transparent;
  border: 0;
  padding: 0;
  width: 16px;
  height: 16px;
  display: inline-grid;
  place-items: center;
  cursor: pointer;
  color: inherit;
  border-radius: 50%;
  opacity: 0.7;
}
.taginput__remove:hover { opacity: 1; background: var(--k-state-hover); }
.taginput input {
  flex: 1;
  min-width: 80px;
  border: 0;
  outline: 0;
  background: transparent;
  font: inherit;
  color: inherit;
  font-size: var(--k-type-small);
  padding: var(--k-s-2) var(--k-s-4);
}
.taginput input:focus,
.taginput input:focus-visible { outline: 0; }`,
  },
  {
    id: 'popover',
    section: "Popover",
    css: `/* === Popover ===
   Floating panel anchored to a trigger. Always-open variant for the gallery
   uses .popover--open; in real apps, toggle the class on click. */
.popover-wrap { position: relative; display: inline-flex; }
.popover {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  min-width: 200px;
  padding: var(--k-s-12);
  background: var(--k-surface-raised);
  border: 1px solid var(--k-border);
  border-radius: var(--k-radius-lg);
  box-shadow: var(--k-shadow-lg);
  font-size: var(--k-type-small);
  color: var(--k-fg);
  z-index: var(--k-z-popover);
  /* shadcn/Radix enter — scale + fade anchored to trigger via transform-origin */
  transform-origin: top left;
  animation: var(--k-anim-scale-in, k-scale-in 200ms cubic-bezier(.05,.7,.1,1)) backwards;
}
/* Arrow pointing back at the trigger — single rotated square, border-clipped */
.popover__arrow {
  position: absolute;
  top: -5px;
  left: 16px;
  width: 10px;
  height: 10px;
  background: var(--k-surface-raised);
  border-top: var(--k-divider);
  border-left: var(--k-divider);
  transform: rotate(45deg);
}`,
  },
  {
    id: 'hover-card',
    section: "Hover Card",
    css: `/* === Hover Card ===
   Like Popover, but auto-reveals on hover/focus. Used for inline profile
   previews, definitions, link expansions. */
.hover-card {
  position: relative;
  display: inline-flex;
  cursor: pointer;
  text-decoration: underline;
  text-decoration-style: dotted;
  text-underline-offset: 3px;
  color: var(--k-primary);
}
.hover-card__pop {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  min-width: 240px;
  padding: var(--k-s-12);
  background: var(--k-surface-raised);
  border: 1px solid var(--k-border);
  border-radius: var(--k-radius-lg);
  box-shadow: var(--k-shadow-lg);
  font-size: var(--k-type-small);
  color: var(--k-fg);
  opacity: 0;
  pointer-events: none;
  transform: translateY(-2px);
  transition: opacity var(--k-dur-fast) var(--k-ease, ease), transform var(--k-dur-fast) var(--k-ease, ease);
  z-index: var(--k-z-popover);
}
.hover-card:hover .hover-card__pop,
.hover-card:focus-within .hover-card__pop,
.hover-card--open .hover-card__pop {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}`,
  },
  {
    id: 'sheet-drawer',
    section: "Sheet / Drawer",
    css: `/* === Sheet / Drawer ===
   Side-pull panel. Demo here is a static slice — real app slides in.
   --sheet-w sets the width; default 280px reads sensibly in a card. */
.sheet-frame {
  position: relative;
  height: 220px;
  border: 1px solid var(--k-border);
  border-radius: var(--k-radius-md);
  background: var(--k-surface-sunken);
  overflow: hidden;
}
.sheet-frame__backdrop {
  position: absolute;
  inset: 0;
  background: var(--k-scrim);
}
.sheet {
  --sheet-w: 280px;
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
  width: var(--sheet-w);
  /* Never wider than the viewport — a 360px sheet must not overflow a 320px phone. */
  max-width: 100vw;
  background: var(--k-surface-raised);
  border-left: var(--k-divider);
  box-shadow: var(--k-shadow-lg);
  display: flex;
  flex-direction: column;
  /* Slow + emphasized-decelerate — large surface, expressive enter */
  animation: sheet-in var(--k-dur-slow, 320ms) var(--k-ease-out, cubic-bezier(.05,.7,.1,1));
}
.sheet--left { right: auto; left: 0; border-left: 0; border-right: var(--k-divider); animation-name: sheet-in-left; }
.sheet__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--k-space, 16px);
  border-bottom: var(--k-divider);
}
/* .sheet__title — folded into the shared panel-heading rule (see .card__title). */
.sheet__body {
  padding: var(--k-space, 16px);
  flex: 1;
  font-size: var(--k-type-small);
  color: var(--k-fg);
  overflow: auto;
  /* Stack form rows vertically so checkboxes don't run together as inline labels */
  display: flex;
  flex-direction: column;
  gap: var(--k-s-10);
}
.sheet__foot { padding: var(--k-space, 16px); border-top: var(--k-divider); display: flex; gap: var(--k-gap, var(--k-s-8)); justify-content: flex-end; }
@keyframes sheet-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
@keyframes sheet-in-left { from { transform: translateX(-100%); } to { transform: translateX(0); } }`,
  },
  {
    id: 'segmented-control-toggle-group',
    section: "Segmented control / Toggle group",
    css: `/* === Segmented control / Toggle group ===
   iOS-style multi-option button. Wrapper holds a quiet recessed background,
   active item rises with surface + shadow (the "floating thumb" pattern).
   Used as a smaller alternative to Tabs for compact / inline contexts. */
.segctrl {
  display: inline-flex;
  background: var(--k-track, var(--k-surface-2));
  border-radius: var(--k-radius-md);
  padding: var(--k-s-2);
  gap: 0;
  /* The track is a contained surface → its rim follows the Surface axis
     (--k-field-border-color): Outlined keeps a hairline, Filled/Plain drop it
     for a flatter rail. The track FILL stays --k-track (a fixed muted grey) so
     the white active thumb stays legible at any Elevation — we tie the border to
     Surface, not the fill. Tabs (.tab underline) stay their own semantic choice;
     Surface never swaps segmented ↔ underline. */
  border: 1px solid var(--k-field-border-color);
}
.segctrl__btn {
  padding: var(--k-s-4) var(--k-s-12);
  border: 0;
  background: transparent;
  font-size: var(--k-type-small);
  font-weight: var(--k-ui-weight, 500);
  /* Same line-height: 1 treatment as .btn / .badge / .tab — keeps icons
     visually centered with labels in the dense 27-30px tall segment chip. */
  line-height: 1;
  text-transform: var(--k-ui-transform, none);
  letter-spacing: var(--k-ui-tracking, 0);
  color: var(--k-fg-muted);
  border-radius: calc(var(--k-radius-md) - 2px);
  cursor: pointer;
  transition: color var(--k-dur-fast, 120ms) var(--k-ease, ease);
  display: inline-flex;
  align-items: center;
  gap: var(--k-s-4);
}
.segctrl__btn > svg { flex-shrink: 0; display: block; }
.segctrl__btn:hover { color: var(--k-fg); }
.segctrl__btn--on {
  background: var(--k-surface);
  color: var(--k-fg);
  /* Lift shadow + a layout-neutral inset hairline. The shadow gives elevation;
     the inset ring is the depth-independent edge that keeps the active thumb
     legible even at Flat surface depth (where --k-shadow-sm and the
     surface/surface-2 tonal step both collapse). Mirrors the chrome
     .viewtoggle's white-pill-on-grey-track clarity via a real edge instead of
     relying on elevation alone. */
  box-shadow: var(--k-shadow-sm), inset 0 0 0 var(--k-bw, 1px) var(--k-border);
}`,
  },
  {
    id: 'separator',
    section: "Separator",
    css: `/* === Separator ===
   Hairline divider. .sep--labeled puts a centered label between two lines
   ("OR continue with email" auth pattern). Vertical variant for inline gaps. */
.sep {
  height: var(--k-bw);
  background: var(--k-border);
  border: 0;
  margin: calc(var(--k-space, 16px) * 0.6) 0;
}
.sep--vertical {
  width: 1px;
  height: auto;
  align-self: stretch;
  margin: 0 var(--k-s-8);
}
.sep--labeled {
  display: flex;
  align-items: center;
  gap: var(--k-s-12);
  color: var(--k-fg-faint);
  font-size: var(--k-type-eyebrow);
  text-transform: uppercase;
  letter-spacing: var(--k-track-eyebrow);
  font-weight: var(--k-weight-medium);
  background: transparent;
  height: auto;
}
.sep--labeled::before,
.sep--labeled::after {
  content: '';
  flex: 1;
  height: var(--k-bw);
  background: var(--k-border);
}`,
  },
  {
    id: 'description-list',
    section: "Description list",
    css: `/* === Description list ===
   Key-value pairs (account info, plan details, profile fields). Uses
   semantic <dl><dt><dd>. Two-column grid keeps labels right-aligned-ish
   while values flow naturally to the right. */
.dl {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: var(--k-s-10) var(--k-s-24);
  margin: 0;
}
.dl dt {
  font-size: var(--k-type-small);
  color: var(--k-fg-muted);
  font-weight: var(--k-ui-weight, 500);
  text-transform: var(--k-ui-transform, none);
  letter-spacing: var(--k-ui-tracking, 0);
}
.dl dd {
  font-size: var(--k-type-small);
  color: var(--k-fg);
  margin: 0;
}`,
  },
  {
    id: 'banner',
    section: "Banner",
    css: `/* === Banner ===
   Page-level alert — wider than a toast, persistent until dismissed.
   Sits at the very top of the content area. Tone variants mirror alerts. */
.banner {
  display: flex;
  align-items: center;
  gap: var(--k-s-10);
  padding: var(--k-space, 16px);
  background: var(--k-info-soft);
  color: var(--k-info-soft-fg);
  font-size: var(--k-type-small);
  border-bottom: var(--k-divider);
}
.banner--success { background: var(--k-success-soft); color: var(--k-success-soft-fg); }
.banner--warn    { background: var(--k-warning-soft); color: var(--k-warning-soft-fg); }
.banner--danger  { background: var(--k-danger-soft);  color: var(--k-danger-soft-fg); }
/* Explicit info variant — the base is already info-toned, but defining the
 * modifier completes the semantic family (success/warn/danger/info) so
 * \`banner--info\` (used by Cloud's status notice) is correct by definition,
 * not by accident, and survives a future change to the base default. */
.banner--info    { background: var(--k-info-soft);    color: var(--k-info-soft-fg); }
.banner__body { flex: 1; min-width: 0; }
.banner__link { color: inherit; text-decoration: underline; text-underline-offset: 3px; }
.banner__close {
  background: transparent;
  border: 0;
  padding: var(--k-s-4);
  cursor: pointer;
  color: inherit;
  opacity: 0.7;
  display: inline-flex;
  border-radius: var(--k-radius-md);
}
.banner__close:hover { opacity: 1; background: var(--k-state-hover); }`,
  },
  {
    id: 'alert-dialog',
    section: "Alert Dialog",
    css: `/* === Alert Dialog ===
   Dialog variant with a destructive emphasis — used for "Delete account?",
   "Discard changes?" confirmations where the consequence is irreversible.
   Identical to .dialog visually but role="alertdialog" semantically + the
   primary CTA is danger-styled. The class adds a left-border accent. */
.dialog--alert {
  border-left: 3px solid var(--k-danger);
}
.dialog--alert .dialog__icon {
  width: var(--k-icon-chip);
  height: var(--k-icon-chip);
  border-radius: 50%;
  background: var(--k-danger-soft);
  color: var(--k-danger-soft-fg);
  display: inline-grid;
  place-items: center;
  margin-bottom: var(--k-s-4);
}`,
  },
  {
    id: 'input-otp',
    section: "Input OTP",
    css: `/* === Input OTP ===
   Single-character boxes for one-time codes (2FA, email verification).
   Each slot is its own input — focus jumps to the next on type. Visual
   pattern: monospace + generous height so digits read clearly. */
.otp {
  display: inline-flex;
  /* Wrap the slot row instead of overflowing on a narrow viewport (6 × ~40px
     slots + gaps exceed a 320px phone). */
  flex-wrap: wrap;
  gap: var(--k-s-6);
}
.otp__slot {
  width: var(--k-in-h-default);
  height: var(--k-control-h-lg);
  text-align: center;
  font-size: var(--k-type-body);
  font-family: var(--k-font-mono);
  font-weight: var(--k-weight-semibold);
  border: max(1.5px, var(--k-bw)) solid var(--k-input-border);
  background: var(--k-field-bg);
  color: var(--k-fg);
  border-radius: var(--k-radius-md);
  padding: 0;
  transition: border-color var(--k-dur-fast, 120ms) var(--k-ease, ease);
}
.otp__slot:focus {
  outline: 2px solid transparent;
  outline-offset: 2px;
  border-color: var(--k-ring);
  box-shadow: 0 0 0 3px var(--k-ring-halo);
}
.otp__sep {
  align-self: center;
  color: var(--k-fg-faint);
  font-size: var(--k-type-h3);
  margin: 0 var(--k-s-2);
}`,
  },
  {
    id: 'stat-tile',
    section: "Stat tile",
    css: `/* === Stat tile (#111) ====================================================
 * Premium metric tile pattern. Two tiles fit in one gallery card; each tile
 * stacks: eyebrow label + icon box (top row) → big tabular number → sparkline
 * + delta pill (foot row). Sparkline draws in on mount via stroke-dasharray. */
.stat-tile-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--k-s-10);
}
.stat-tile {
  display: flex;
  flex-direction: column;
  gap: var(--k-s-8);
  padding: var(--k-space, 16px);
  background: var(--k-surface-2);
  border-radius: var(--k-radius-md);
  border: var(--k-hairline, 1px solid var(--k-border));
  box-shadow: var(--k-shadow-tactile);
  min-width: 0;
}
.stat-tile__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--k-s-6);
}
.stat-tile__label {
  font-size: var(--k-type-caption);
  font-weight: var(--k-weight-medium);
  letter-spacing: var(--k-track-eyebrow);
  text-transform: uppercase;
  color: var(--k-fg-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.stat-tile__icon {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  display: grid;
  place-items: center;
  border-radius: var(--k-radius-sm);
}
.stat-tile__icon--primary { background: var(--k-primary-soft); color: var(--k-primary-soft-fg); }
.stat-tile__icon--accent { background: var(--k-secondary-soft); color: var(--k-secondary-soft-fg); }
.stat-tile__icon svg { width: 12px; height: 12px; }
.stat-tile__value {
  font-size: var(--k-type-h2);
  font-weight: var(--k-weight-semibold);
  font-family: var(--k-font-display);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
  line-height: 1.05;
  color: var(--k-fg);
}
.stat-tile__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--k-s-8);
}
.stat-tile__spark {
  width: 60%;
  max-width: 80px;
  height: 22px;
  flex-shrink: 1;
}
.stat-tile__spark path {
  stroke-dasharray: 200;
  stroke-dashoffset: 200;
  animation: stat-spark-draw 600ms cubic-bezier(.05, .7, .1, 1) both;
  animation-delay: 240ms;
}
@keyframes stat-spark-draw {
  to { stroke-dashoffset: 0; }
}
.stat-tile__delta {
  display: inline-flex;
  align-self: flex-start; /* hug content — don't stretch to the column's full width */
  align-items: center;
  gap: var(--k-s-2);
  padding: var(--k-s-2) var(--k-s-6);
  border-radius: 999px;
  font-size: var(--k-type-eyebrow);
  font-weight: var(--k-weight-semibold);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.stat-tile__delta svg { flex-shrink: 0; }
/* Delta tone modifiers — avoid per-instance inline colours. */
.stat-tile__delta--up { color: var(--k-success); background: var(--k-success-soft); }
.stat-tile__delta--down { color: var(--k-danger); background: var(--k-danger-soft); }
/* Clickable KPI tile — drills into a detail view (hover lift + a trailing
 * chevron that nudges right, "there's more behind this number"). */
.stat-tile--clickable { cursor: pointer; transition: border-color var(--k-dur-fast, 140ms) var(--k-ease, ease), box-shadow var(--k-dur-fast, 140ms) var(--k-ease, ease), transform var(--k-dur-fast, 140ms) var(--k-ease, ease); }
.stat-tile--clickable:hover { border-color: var(--k-state-border); box-shadow: var(--k-shadow-sm); transform: translateY(-1px); }
.stat-tile--clickable:focus-visible { outline: 2px solid var(--k-ring, var(--k-primary)); outline-offset: 2px; }
.stat-tile__drill { margin-left: auto; display: inline-flex; color: var(--k-fg-faint); transition: transform var(--k-dur-fast, 140ms) var(--k-ease, ease); }
.stat-tile--clickable:hover .stat-tile__drill { transform: translateX(2px); color: var(--k-fg-muted); }
@media (prefers-reduced-motion: reduce) { .stat-tile--clickable, .stat-tile__drill { transition: none; } }
/* Bare metric strip — joined cells in one box with internal hairlines (was
 * .statgrp). Reuses .stat-tile__value / .stat-tile__label; no per-cell card. */
.stat-tile-strip { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0; }
.stat-tile-strip__cell { padding: var(--k-space, 16px); border-right: var(--k-divider); border-bottom: var(--k-divider); display: flex; flex-direction: column; gap: var(--k-s-2); }
.stat-tile-strip__cell:nth-child(2n) { border-right: 0; }
.stat-tile-strip__cell:nth-last-child(-n+2) { border-bottom: 0; }`,
  },
  {
    id: 'attachment-chip-family',
    section: "Attachment chip family",
    css: `/* === Attachment chip family (#113) ====================================
 * Pill with left thumb (icon-box) + label/meta stack + remove button.
 * Mid-string truncation via direction:rtl on the label clips from the
 * left when there's not enough room — Apple Finder pattern. */
.att-chip-stack {
  display: flex;
  flex-direction: column;
  /* The kit's standard vertical gap for stacked cards/rows — one token shared
   * by radio-cards, kanban column, slot picker, event lists. Scales w/ density. */
  gap: var(--k-stack-gap, 8px);
}
.att-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--k-s-8);
  padding: var(--k-s-4) var(--k-s-6) var(--k-s-4) var(--k-s-4);
  background: var(--k-surface-2);
  border: var(--k-hairline, 1px solid var(--k-border));
  border-radius: var(--k-radius-md);
  min-width: 0;
}
.att-chip__thumb {
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border-radius: var(--k-radius-sm);
  background: var(--k-surface);
  color: var(--k-fg-muted);
}
.att-chip--file .att-chip__thumb { background: var(--k-primary-soft); color: var(--k-primary-soft-fg); }
.att-chip--link .att-chip__thumb { background: var(--k-info-soft); color: var(--k-info); }
.att-chip--audio .att-chip__thumb { background: var(--k-warning-soft); color: var(--k-warning); }
.att-chip--image .att-chip__thumb { background: var(--k-success-soft); color: var(--k-success); }
.att-chip__thumb svg { width: 13px; height: 13px; }
.att-chip__body {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
  flex: 1;
}
.att-chip__label {
  font-size: var(--k-type-small);
  font-weight: var(--k-weight-medium);
  color: var(--k-fg);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.att-chip__meta {
  font-size: var(--k-type-caption);
  color: var(--k-fg-faint);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.att-chip__x {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  border-radius: 999px;
  border: 0;
  background: transparent;
  color: var(--k-fg-muted);
  cursor: pointer;
  font-size: var(--k-type-body);
  line-height: 1;
  transition: background var(--k-dur-fast, 110ms) var(--k-ease, ease);
}
.att-chip__x:hover { background: var(--k-state-hover); color: var(--k-fg); }`,
  },
  {
    id: 'inline-status-meta-micro-components',
    section: "Inline status & meta micro-components",
    css: `/* === Inline status & meta micro-components (#117) =====================
 * Tiny semantic atoms: NEW pill, beta/pro/ai tags, status dots, verified
 * checkmark, notification badge, sort arrow. Each works standalone and
 * composes into list rows / nav items / table cells. */
/* NEW / BETA / PRO tags use the canonical .badge system (badge--primary /
 * badge--warn / badge--neutral) — there is ONE label vocabulary, no parallel
 * .meta-new / .meta-pill family. */
.meta-status {
  display: inline-flex;
  align-items: center;
  gap: var(--k-s-4);
  font-size: var(--k-type-eyebrow);
  color: var(--k-fg-muted);
}
.meta-status__dot {
  width: var(--k-dot);
  height: var(--k-dot);
  border-radius: 50%;
  position: relative;
}
.meta-status__dot--online::after {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 50%;
  background: var(--k-success);
  opacity: 0.25;
  animation: meta-status-pulse 1.8s ease-in-out infinite;
}
@keyframes meta-status-pulse {
  0%, 100% { transform: scale(1);   opacity: 0.25; }
  50%      { transform: scale(1.4); opacity: 0;    }
}
.meta-status__dot--online { background: var(--k-success); }
.meta-status__dot--away   { background: var(--k-warning); }
.meta-status__dot--busy   { background: var(--k-danger); }
.meta-row {
  display: inline-flex;
  align-items: center;
  gap: var(--k-s-6);
  font-size: var(--k-type-small);
  color: var(--k-fg);
}
.meta-avatar {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--k-primary-soft);
  color: var(--k-primary-soft-fg);
  display: grid;
  place-items: center;
  font-size: var(--k-type-caption);
  font-weight: var(--k-weight-semibold);
}
.meta-verified {
  display: inline-grid;
  place-items: center;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--k-info);
  color: var(--k-info-fg);
}
.meta-verified svg { width: 9px; height: 9px; }
.meta-notif {
  position: relative;
  display: inline-grid;
  place-items: center;
  width: 28px;
  height: 28px;
  /* Sits inside a 28px .btn--icon flex button at the same size — without this
   * it flex-shrinks to min-content (collapsing the bell to a sliver). */
  flex: none;
  color: var(--k-fg-muted);
}
.meta-notif svg { width: 14px; height: 14px; flex: none; }
/* Unread indicator — a clean corner DOT, not a number. A count pill would
 * overlap the bell glyph inside the tight 28px button; the count itself lives
 * where there's room (the Inbox row's .badge--count, a "N unread" label). The
 * surface ring lifts the dot off the icon. Any numeric child stays in the DOM
 * for screen-readers but is clipped to the dot. */
.meta-notif__dot {
  position: absolute;
  top: 3px;
  right: 3px;
  width: 8px;
  height: 8px;
  min-width: 0;
  padding: 0;
  border-radius: 999px;
  background: var(--k-danger);
  border: 1.5px solid var(--k-surface);
  box-sizing: content-box;
  font-size: 0;
  overflow: hidden;
}
.meta-sort {
  display: inline-flex;
  align-items: center;
  gap: var(--k-s-4);
  padding: var(--k-s-2) var(--k-s-8);
  background: transparent;
  border: 0;
  color: var(--k-fg-muted);
  font-size: var(--k-type-eyebrow);
  font-weight: var(--k-weight-medium);
  cursor: pointer;
  border-radius: var(--k-radius-sm);
  font-family: var(--k-font-body);
}
.meta-sort:hover { background: var(--k-state-hover); color: var(--k-fg); }
.meta-sort__arrow {
  color: var(--k-primary);
  font-weight: var(--k-weight-bold);
}
.meta-sort--asc .meta-sort__arrow { color: var(--k-fg-muted); }`,
  },
  {
    id: 'carousel',
    section: "Carousel",
    css: `/* === Carousel (.carousel) — shadcn gap filler ========================
 * Sliding track of equal-width slides + absolute prev/next arrows. Dots
 * reuse the existing .cdots component. Radius follows the Box token. */
.carousel { display: flex; flex-direction: column; gap: var(--k-s-12); }
.carousel__viewport { position: relative; overflow: hidden; border-radius: var(--k-radius-lg); }
.carousel__track { display: flex; transition: transform var(--k-dur, 280ms) var(--k-ease, ease); }
.carousel__slide {
  flex: 0 0 100%; aspect-ratio: 16 / 7; display: flex; align-items: flex-end;
  padding: var(--k-s-16); color: #fff;
}
.carousel__caption { font-size: var(--k-type-body); font-weight: var(--k-weight-semibold); text-shadow: 0 1px 3px hsl(0 0% 0% / 0.4); }
.carousel__arrow {
  position: absolute; top: 50%; transform: translateY(-50%);
  width: var(--k-icon-chip); height: var(--k-icon-chip); border-radius: 50%; border: 0; cursor: pointer;
  display: grid; place-items: center; color: var(--k-fg);
  background: var(--k-surface); box-shadow: var(--k-shadow-md, 0 2px 8px hsl(0 0% 0% / 0.18));
}
.carousel__arrow:hover { background: var(--k-state-hover); }
.carousel__arrow--prev { left: var(--k-s-10); }
.carousel__arrow--next { right: var(--k-s-10); }

/* ----- Pagination dots (.cdots) — the carousel's position indicator; also
 * reusable standalone for onboarding / story progress. Three shapes via a
 * modifier: dots (default), numbers (--num), segment bars (--bars). ----- */
.cdots {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--k-s-4);
  padding: var(--k-s-4) 0;
}
.cdots__dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: var(--k-fg-faint);
  border: 0;
  padding: 0;
  cursor: pointer;
  opacity: 0.4;
  transition:
    width var(--k-dur-fast, 110ms) var(--k-ease, ease),
    background var(--k-dur-fast, 110ms) var(--k-ease, ease),
    opacity var(--k-dur-fast, 110ms) var(--k-ease, ease);
}
.cdots__dot.is-on {
  width: 18px;
  background: var(--k-primary);
  opacity: 1;
}
.cdots--num { gap: var(--k-s-4); }
.cdots__num {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: transparent;
  border: 0;
  color: var(--k-fg-muted);
  font-size: var(--k-type-caption);
  font-weight: var(--k-weight-semibold);
  cursor: pointer;
  font-variant-numeric: tabular-nums;
  font-family: var(--k-font-body);
}
.cdots__num.is-on {
  background: var(--k-primary);
  color: var(--k-primary-fg);
}
.cdots--bars { gap: var(--k-s-4); }
.cdots__bar {
  flex: 1;
  height: 3px;
  border-radius: 2px;
  background: var(--k-fg-faint);
  opacity: 0.35;
  position: relative;
  overflow: hidden;
}
.cdots__bar.is-done {
  background: var(--k-primary);
  opacity: 1;
}
.cdots__bar.is-on {
  background: var(--k-fg-faint);
  opacity: 0.6;
}
.cdots__bar.is-on::after {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--k-primary);
  transform-origin: left;
  animation: cdots-fill 3s linear infinite;
}
@keyframes cdots-fill {
  from { transform: scaleX(0); }
  to   { transform: scaleX(1); }
}`,
  },
  {
    id: 'navigation-menu',
    section: "Navigation menu",
    css: `/* === Navigation menu (.navmenu) — shadcn gap filler ==================
 * Horizontal top nav; one item opens a .menu flyout positioned below. */
.navmenu { display: flex; align-items: center; gap: var(--k-s-2); flex-wrap: wrap; }
.navmenu__item {
  display: inline-flex; align-items: center; gap: var(--k-s-4);
  min-height: var(--k-row-h-md, 36px); padding: 0 var(--k-s-12);
  border: 0; background: transparent; color: var(--k-fg-muted);
  font: inherit; font-size: var(--k-type-small); font-weight: var(--k-weight-medium);
  border-radius: var(--k-radius-md); cursor: pointer;
  transition: background var(--k-dur-fast, 140ms) var(--k-ease, ease), color var(--k-dur-fast, 140ms) var(--k-ease, ease);
}
.navmenu__item:hover { background: var(--k-state-hover); color: var(--k-fg); }
.navmenu__item--on { background: var(--k-state-hover); color: var(--k-fg); }
.navmenu__group { position: relative; }
.navmenu__panel { position: absolute; top: calc(100% + var(--k-s-4)); left: 0; min-width: 184px; z-index: var(--k-z-dropdown); }`,
  },
  {
    id: 'context-menu',
    section: "Context menu",
    css: `/* === Context menu (.ctxmenu) — shadcn gap filler =====================
 * A right-click drop area; the popup reuses the .menu component, placed
 * at the cursor via inline left/top. */
.ctxmenu {
  position: relative; display: grid; place-items: center;
  min-height: 120px; padding: var(--k-s-16);
  border: max(1px, var(--k-bw)) dashed var(--k-border); border-radius: var(--k-radius-md);
  background: var(--k-surface-sunken); color: var(--k-fg-muted);
  font-size: var(--k-type-small); user-select: none; cursor: context-menu;
}
.ctxmenu__hint { pointer-events: none; }
.ctxmenu__pop { position: absolute; min-width: 184px; z-index: var(--k-z-dropdown); }`,
  },
  {
    id: 'form-primitives',
    section: "Form primitives",
    css: `/* === Form primitives (Tier 4) ==========================================
 * Four primitives that live next to the standard .in recipe but each has
 * its own grammar: NumberInput (steppers), PasswordInput (eye + strength),
 * SearchInput (leading icon + clear + suggestions), PhoneInput (country
 * picker + national field). All follow the same height/padding token
 * vocabulary as .in so they stack neatly in forms. */
.numinput,
.pwinput,
.searchinput,
.phoneinput {
  display: flex;
  align-items: center;
  min-height: var(--k-in-h-default, 40px);
  /* Same filled-field signature as .in / .select-trigger / .taginput / .otp:
     the brand-tinted --k-input-bg, so EVERY field type reads as one family
     (was --k-surface-2 → these composed inputs sat lighter than plain .in). */
  background: var(--k-field-bg);
  /* Tokenized border thickness — see .in for rationale. */
  border: var(--k-bw, 1px) solid var(--k-field-border-color); border-bottom-color: var(--k-field-underline-color);
  border-radius: var(--k-field-radius);
  /* Flat default — focus halo carries the emphasis (shadcn pattern). */
  box-shadow: none;
  transition:
    border-color var(--k-dur-fast, 110ms) var(--k-ease, ease),
    box-shadow var(--k-dur-fast, 110ms) var(--k-ease, ease),
    background var(--k-dur-fast, 110ms) var(--k-ease, ease);
}
/* Hover state — subtle border tone shift so the field reads as
 * interactive without being noisy. Skipped when focused (focus owns
 * the visual emphasis). */
.numinput:hover:not(:focus-within),
.pwinput:hover:not(:focus-within),
.searchinput:hover:not(:focus-within),
.phoneinput:hover:not(:focus-within) {
  border-color: var(--k-state-border, var(--k-fg-faint));
}
.numinput:focus-within,
.pwinput:focus-within,
.searchinput:focus-within,
.phoneinput:focus-within,
/* The select/combobox trigger is focusable too — give it the SAME soft halo
   as every other field instead of falling through to the global solid
   :focus-visible outline (the one field control that read inconsistently). */
.select-trigger:focus,
.select-trigger:focus-visible {
  outline: 2px solid transparent;
  outline-offset: 2px;
  border-color: var(--k-ring);
  box-shadow: 0 0 0 3px var(--k-ring-halo);
}
.numinput__field,
.pwinput__field,
.searchinput__field,
.phoneinput__field {
  background: transparent;
  border: 0;
  outline: 0;
  flex: 1;
  /* Fill the wrapper height so the caret isn't clipped by overflow:clip at a
   * line-height-tight box (see .in--inline input). */
  align-self: stretch;
  font: inherit;
  font-size: var(--k-type-small);
  color: var(--k-fg);
  /* Match .in's horizontal padding floor (12px Linear/shadcn-equiv)
   * so all input types — direct .in, wrapper variants — line up text
   * at the same offset from the wrapper edge. Was 10px (--k-row-px)
   * which made wrapper inputs feel cramped against the left border
   * compared to standalone .in text inputs. */
  padding-block: 0;
  padding-inline: max(var(--k-s-12), calc(var(--k-radius-md) * 0.6));
}
/* Suppress per-field focus outline on wrapper-children. The wrapper
 * (.numinput, .pwinput, .searchinput, .phoneinput) already paints the
 * focus halo via :focus-within. Without this override, the global
 * .cockpit-preview :focus-visible rule (line ~44) paints a second
 * outline ON the inner <input>, creating a visible inner rectangle
 * inside the wrapper's ring — the persistent "binnenring" bug. */
.numinput__field:focus,
.numinput__field:focus-visible,
.pwinput__field:focus,
.pwinput__field:focus-visible,
.searchinput__field:focus,
.searchinput__field:focus-visible,
.phoneinput__field:focus,
.phoneinput__field:focus-visible {
  outline: 0;
  font-family: var(--k-font-body);
  padding: 0 var(--k-row-px, 10px);
  min-width: 0;
}`,
  },
  {
    id: 'numberinput',
    section: "NumberInput",
    css: `/* === NumberInput (#5) === */
.numinput { padding: 0; }
.numinput__field { font-variant-numeric: tabular-nums; text-align: center; }
.numinput__step {
  width: var(--k-in-h-default, 40px);
  align-self: stretch;     /* fill the wrapper height so the hover fill reaches the edges */
  display: grid;           /* centre the −/+ glyph in BOTH axes (stretched height
                              would otherwise top-align it → looks crooked at rest) */
  place-items: center;
  border: 0;
  background: transparent;
  color: var(--k-fg-muted);
  font-size: var(--k-type-body);
  font-weight: var(--k-weight-medium);
  line-height: 1;
  cursor: pointer;
  border-radius: 0;        /* outer corners only (below) — square inner edges keep it plumb */
}
.numinput__step:first-child {
  border-top-left-radius: calc(var(--k-radius-md) - var(--k-bw, 1px));
  border-bottom-left-radius: calc(var(--k-radius-md) - var(--k-bw, 1px));
}
.numinput__step:last-child {
  border-top-right-radius: calc(var(--k-radius-md) - var(--k-bw, 1px));
  border-bottom-right-radius: calc(var(--k-radius-md) - var(--k-bw, 1px));
}
.numinput__step:hover { background: var(--k-state-hover); color: var(--k-fg); }
.numinput__step:active { color: var(--k-primary); }
.numinput--with-suffix .numinput__field { text-align: left; padding-right: var(--k-s-4); }
.numinput__suffix {
  padding-right: var(--k-s-8);
  font-size: var(--k-type-eyebrow);
  color: var(--k-fg-muted);
  font-variant-numeric: tabular-nums;
}
.numinput__steps {
  display: flex;
  flex-direction: column;
  border-left: var(--k-divider);
  align-self: stretch;
}
.numinput__chev {
  flex: 1;
  width: 24px;
  border: 0;
  background: transparent;
  color: var(--k-fg-muted);
  cursor: pointer;
  display: grid;
  place-items: center;
  padding: 0;
  transition:
    background var(--k-dur-fast, 110ms) var(--k-ease, ease),
    color var(--k-dur-fast, 110ms) var(--k-ease, ease);
}
/* Round the column's OUTER corners to the field radius so the hover wash
 * sits flush inside the rounded wrapper (the container can't use
 * overflow:hidden — that would clip the focus halo). −bw keeps the radius
 * just inside the wrapper's own border. */
.numinput__steps .numinput__chev:first-child {
  border-top-right-radius: calc(var(--k-radius-md) - var(--k-bw, 1px));
}
.numinput__steps .numinput__chev:last-child {
  border-bottom-right-radius: calc(var(--k-radius-md) - var(--k-bw, 1px));
}
.numinput__chev:hover { background: var(--k-state-hover); color: var(--k-fg); }
.numinput__chev:active { color: var(--k-primary); }  /* press feedback */
.numinput__chev + .numinput__chev { border-top: var(--k-divider); }
/* Suppress per-button focus outline — parent .numinput already shows
 * :focus-within ring, so a second outline on chev/step is visual noise.
 * Accessibility: container-level focus indicator covers keyboard users. */
.numinput__chev:focus,
.numinput__chev:focus-visible,
.numinput__step:focus,
.numinput__step:focus-visible { outline: none; }`,
  },
  {
    id: 'passwordinput',
    section: "PasswordInput",
    css: `/* === PasswordInput (#6) === */
.pwinput__eye {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  margin-right: var(--k-s-4);
  border: 0;
  background: transparent;
  color: var(--k-fg-muted);
  cursor: pointer;
  display: grid;
  place-items: center;
  border-radius: 999px;
}
.pwinput__eye:hover { background: var(--k-state-hover); color: var(--k-fg); }
/* Strength meter — wider bars (48px vs 36px) + thicker (4px vs 3px) read
 * more confidently. Smooth background transition so a level change feels
 * dynamic rather than stepped. Nielsen Norman / Baymard both recommend
 * visible scale + named feedback label. */
.pwinput__strength {
  display: flex;
  align-items: center;
  gap: var(--k-s-4);
  margin-top: var(--k-s-8);
}
.pwinput__bar {
  flex: 1;
  max-width: 48px;
  height: 4px;
  border-radius: 999px;
  background: var(--k-surface-2);
  border: var(--k-hairline, 1px solid var(--k-border));
  transition: background var(--k-dur, 200ms) var(--k-ease), border-color var(--k-dur, 200ms) var(--k-ease);
}
.pwinput__bar--on[data-level="1"] { background: var(--k-danger); border-color: transparent; }
.pwinput__bar--on[data-level="2"] { background: var(--k-warning); border-color: transparent; }
.pwinput__bar--on[data-level="3"] { background: var(--k-success); border-color: transparent; }
.pwinput__label {
  font-size: var(--k-type-caption);
  color: var(--k-fg-muted);
  margin-left: var(--k-s-6);
}`,
  },
  {
    id: 'searchinput',
    section: "SearchInput",
    css: `/* === SearchInput (#7) ===
 * Best-practice layout: padding column at the start anchors the magnifier
 * icon (14px, large enough to read at body size), field flexes between,
 * end column holds the optional kbd hint + clear button. The clear is a
 * ghost icon-button — transparent until hover (state-hover overlay), since
 * a tinted bg against the surface-2 input chrome looked muddy. */
.searchinput {
  padding-left: var(--k-s-12);
  padding-right: var(--k-s-6);
  gap: var(--k-s-8);
}
.searchinput > svg {
  width: 14px;
  height: 14px;
  color: var(--k-fg-muted);
  flex-shrink: 0;
}
.searchinput__field { padding-left: 0; padding-right: 0; }
.searchinput__clear {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--k-fg-muted);
  font-size: var(--k-type-body);
  line-height: 1;
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: background var(--k-dur-fast, 110ms) var(--k-ease);
}
.searchinput__clear:hover { background: var(--k-state-hover); color: var(--k-fg); }
.searchinput__clear:focus-visible {
  outline: 2px solid var(--k-ring-soft);
  outline-offset: 1px;
}
.searchinput__kbd {
  flex-shrink: 0;
  margin-left: var(--k-s-6);
  margin-right: var(--k-s-6);
  padding: var(--k-s-2) var(--k-s-6);
  font-size: var(--k-type-caption);
  font-family: var(--k-font-mono);
  color: var(--k-fg-muted);
  background: var(--k-surface);
  border: var(--k-hairline, 1px solid var(--k-border));
  border-radius: 4px;
}
.searchinput__sugg {
  margin-top: var(--k-s-6);
  padding: var(--k-s-4);
  background: var(--k-surface-overlay, var(--k-surface-raised));
  border: var(--k-hairline, 1px solid var(--k-border));
  border-radius: var(--k-radius-md);
  box-shadow: var(--k-shadow-lg, var(--k-shadow-md));
  --k-nest-radius: max(2px, calc(var(--k-radius-md) - 4px));
}
.searchinput__group {
  padding: var(--k-s-6) var(--k-s-10) var(--k-s-2);
  font-size: var(--k-type-caption);
  text-transform: uppercase;
  letter-spacing: var(--k-track-eyebrow);
  color: var(--k-fg-faint);
  font-weight: var(--k-weight-medium);
}
.searchinput__item {
  display: flex;
  align-items: center;
  gap: var(--k-s-8);
  padding: 0 var(--k-row-px, 10px);
  min-height: var(--k-row-h-sm, 28px);
  border: 0;
  background: transparent;
  color: var(--k-fg);
  border-radius: var(--k-nest-radius, 6px);
  width: 100%;
  text-align: left;
  font: inherit;
  font-size: var(--k-type-small);
  cursor: pointer;
}
.searchinput__item svg { width: 11px; height: 11px; color: var(--k-fg-muted); flex-shrink: 0; }
.searchinput__item--on,
.searchinput__item:hover { background: var(--k-state-hover); }`,
  },
  {
    id: 'phoneinput',
    section: "PhoneInput",
    css: `/* === PhoneInput (#8) === */
.phoneinput { padding: 0; }
.phoneinput__country {
  display: inline-flex;
  align-items: center;
  gap: var(--k-s-6);
  padding: 0 var(--k-s-8) 0 var(--k-s-10);
  height: 100%;
  background: transparent;
  border: 0;
  border-right: var(--k-divider);
  color: var(--k-fg);
  font: inherit;
  font-size: var(--k-type-small);
  cursor: pointer;
}
.phoneinput__country:hover { background: var(--k-state-hover); }
.phoneinput__flag { font-size: var(--k-type-body); line-height: 1; }
.phoneinput__code { font-variant-numeric: tabular-nums; }
/* .phoneinput--invalid border + focus halo defined in the unified
 * validation block at top of file (state-matched halo system). */
.phoneinput + .phoneinput { margin-top: var(--k-s-6); }`,
  },
  {
    id: 'infocard',
    section: "InfoCard",
    css: `/* === InfoCard (Tier 4 #10) ===========================================
 * Compact sidebar info tile — full-width label-row pattern, stacks
 * vertical in admin sidebars. */
.info-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--k-s-10);
  padding: var(--k-s-12) 0;
  border-bottom: var(--k-divider);
}
.info-card:last-of-type { border-bottom: 0; }
.info-card__label {
  font-size: var(--k-type-small);
  font-weight: var(--k-weight-semibold);
  color: var(--k-fg);
}
.info-card__value {
  font-size: var(--k-type-small);
  color: var(--k-fg-muted);
  text-align: right;
}
.info-card__value--link {
  color: var(--k-primary);
  text-decoration: none;
  font-variant-numeric: tabular-nums;
}
.info-card__value--link:hover { text-decoration: underline; }`,
  },
  {
    id: 'list',
    section: "List",
    css: `/* === List (Tier 4 #16) ===============================================
 * Generic list primitive — sections, dividers, leading slot (icon or
 * avatar circle), title + sub, optional trailing slot (chevron / value
 * / text-link). Rows volgen het row grammar (--k-row-h-lg). */
.list {
  display: flex;
  flex-direction: column;
  margin: calc(var(--k-s-4) * -1) 0;
}
.list__section {
  padding: var(--k-s-12) 0 var(--k-s-4);
  font-size: var(--k-type-caption);
  font-weight: var(--k-weight-semibold);
  letter-spacing: var(--k-track-eyebrow);
  text-transform: uppercase;
  color: var(--k-fg-faint);
}
.list__section:first-child { padding-top: var(--k-s-4); }
.list__item {
  display: flex;
  align-items: center;
  gap: var(--k-row-gap, 10px);
  /* Horizontal padding + matching negative margin = the hover bg breathes into
     the card padding while the CONTENT stays edge-aligned with the section
     labels. border-radius makes the hover follow the Box radius (no more square
     grey at Soft). Same idiom as menu/nav rows. */
  position: relative;
  padding: var(--k-s-8);
  margin-inline: calc(var(--k-s-8) * -1);
  border: 0;
  border-radius: var(--k-radius-sm);
  background: transparent;
  text-align: left;
  font: inherit;
  color: var(--k-fg);
  cursor: pointer;
}
/* Divider = a FLAT top line via a pseudo-element, NOT border-top — so it never
   inherits the row's Box radius (border-top would curve down at the corners on
   Soft). The radius now rounds only the hover bg; the divider stays straight.
   Width follows the Borders control (--k-bw → gone at Off); inset by the radius
   so it meets the rounded hover corner cleanly (full-bleed at Box=None). */
.list__item::before {
  content: '';
  position: absolute;
  top: 0;
  left: var(--k-radius-sm);
  right: var(--k-radius-sm);
  height: var(--k-bw, 1px);
  background: var(--k-border);
}
.list__item:first-of-type::before { content: none; }
.list__item:hover { background: var(--k-state-hover); }
.list__lead {
  flex-shrink: 0;
  width: calc(var(--k-in-h-default) - 0.25rem);
  height: calc(var(--k-in-h-default) - 0.25rem);
  display: grid;
  place-items: center;
  border-radius: var(--k-radius-sm);
}
.list__lead--icon {
  background: var(--k-primary-soft);
  color: var(--k-primary-soft-fg);
}
.list__lead--icon svg { width: 14px; height: 14px; }
.list__lead--avatar {
  background: var(--k-secondary-soft);
  color: var(--k-secondary-soft-fg);
  border-radius: 50%;
  font-size: var(--k-type-eyebrow);
  font-weight: var(--k-weight-semibold);
}
.list__body { flex: 1; min-width: 0; }
.list__title {
  font-size: var(--k-type-small);
  font-weight: var(--k-weight-medium);
  color: var(--k-fg);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.list__sub {
  font-size: var(--k-type-eyebrow);
  color: var(--k-fg-muted);
  margin-top: 1px;
}
.list__trail {
  flex-shrink: 0;
  color: var(--k-fg-muted);
  display: flex;
  align-items: center;
}
.list__trail--text {
  font-size: var(--k-type-eyebrow);
  font-weight: var(--k-weight-medium);
  color: var(--k-primary);
}
/* --- List CONTAINER variants — one row system; the container sets divider +
   hover behaviour, the slot/title modifiers do the rest.
     .list           default — top-divider rows, hover (data / entity lists)
     .list--flush    no dividers, hover (tight feeds: notifications, inbox)
     .list--settings bottom-divider rows, static (settings: title/desc + control) */
.list--flush .list__item::before { content: none; }
.list--settings .list__item {
  border-top: 0;
  border-bottom: var(--k-divider);
  padding: var(--k-s-14) 0;
  margin-inline: 0;
  border-radius: 0;
  cursor: default;
}
/* Settings rows are square (radius 0) + keep their own straight border-bottom. */
.list--settings .list__item::before { content: none; }
.list--settings .list__item:hover { background: transparent; }
.list--settings .list__item:last-of-type { border-bottom: 0; }
.list--settings .list__title { font-weight: var(--k-weight-semibold); }
/* Lead variant — neutral round icon chip (notifications / system rows) */
.list__lead--icon-muted {
  background: var(--k-surface-sunken);
  color: var(--k-fg-muted);
  border-radius: 50%;
}
.list__lead--icon-muted svg { width: 15px; height: 15px; }
/* Title size — larger + wrapping, for notification/feed rows */
.list__title--lg { font-size: var(--k-type-body); white-space: normal; }
/* Unread row — bold title + trailing dot */
.list__item--unread .list__title { font-weight: var(--k-weight-bold); }
.list__dot { width: var(--k-dot); height: var(--k-dot); border-radius: 50%; background: var(--k-primary); flex: none; align-self: center; }`,
  },
  {
    id: 'timeline',
    section: "Timeline",
    css: `/* === Timeline (Tier 4 #17) ===========================================
 * Verticale events met dots + connecting line. De line is een ::before
 * pseudo-element die door alle items loopt; eindigt op het laatste item.
 * Dots: filled (done), pulse-ring (current), hollow (future). */
.timeline {
  list-style: none;
  margin: 0;
  padding: 0;
  position: relative;
}
.timeline::before {
  content: '';
  position: absolute;
  left: 10px;
  top: 10px;
  bottom: 10px;
  width: 1.5px;
  background: var(--k-border);
}
.timeline__item {
  position: relative;
  display: flex;
  gap: var(--k-s-14);
  padding: var(--k-s-6) 0;
  z-index: 1;
}
.timeline__dot {
  flex-shrink: 0;
  width: calc(var(--k-in-h-default) - 0.875rem);
  height: calc(var(--k-in-h-default) - 0.875rem);
  border-radius: 50%;
  background: var(--k-surface);
  border: max(1.5px, var(--k-bw)) solid var(--k-border);
  display: grid;
  place-items: center;
  color: var(--k-fg-muted);
  margin-top: 1px;
}
.timeline__dot svg { width: 11px; height: 11px; }
.timeline__item--done .timeline__dot {
  background: var(--k-primary);
  border-color: transparent;
  color: var(--k-primary-fg);
}
.timeline__item--current .timeline__dot {
  background: var(--k-surface);
  border-color: var(--k-primary);
  position: relative;
}
.timeline__pulse {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--k-primary);
  position: relative;
}
.timeline__pulse::after {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  background: var(--k-primary);
  opacity: 0.25;
  animation: timeline-pulse 1.6s ease-in-out infinite;
}
@keyframes timeline-pulse {
  0%, 100% { transform: scale(1); opacity: 0.25; }
  50% { transform: scale(1.6); opacity: 0; }
}
.timeline__body { flex: 1; min-width: 0; padding-bottom: var(--k-s-4); }
.timeline__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--k-s-8);
}
.timeline__title { font-size: var(--k-type-body); font-weight: var(--k-weight-semibold); color: var(--k-fg); }
.timeline__time {
  font-size: var(--k-type-caption);
  color: var(--k-fg-faint);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.timeline__desc { font-size: var(--k-type-small); color: var(--k-fg-muted); margin-top: var(--k-s-2); }`,
  },
  {
    id: 'codeblock',
    section: "CodeBlock",
    css: `/* === CodeBlock (Tier 4 #18) ==========================================
 * Multi-line code met line numbers + filename header. Geen syntax-
 * highlighting in MVP — monospace + tabular-nums dragen de leesbaarheid.
 * Header is sticky binnen scroll-context. */
.codeblock {
  border: var(--k-hairline, 1px solid var(--k-border));
  border-radius: var(--k-radius-md);
  background: var(--k-surface-2);
  overflow: hidden;
  --k-nest-radius: max(2px, calc(var(--k-radius-md) - 4px));
}
.codeblock__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--k-s-6) var(--k-s-10);
  background: var(--k-surface);
  border-bottom: var(--k-divider);
}
.codeblock__file {
  font-size: var(--k-type-eyebrow);
  font-family: var(--k-font-mono);
  color: var(--k-fg-muted);
}
.codeblock__copy {
  display: inline-flex;
  align-items: center;
  gap: var(--k-s-4);
  padding: var(--k-s-2) var(--k-s-8);
  border: 0;
  background: transparent;
  color: var(--k-fg-muted);
  font-size: var(--k-type-eyebrow);
  cursor: pointer;
  border-radius: var(--k-radius-sm);
  font-family: var(--k-font-body);
}
.codeblock__copy:hover { background: var(--k-state-hover); color: var(--k-fg); }
.codeblock__pre {
  margin: 0;
  padding: var(--k-s-8) 0;
  overflow-x: auto;
  font-family: var(--k-font-mono);
  font-size: var(--k-type-eyebrow);
  line-height: 1.5;
  color: var(--k-fg);
}
.codeblock__line {
  display: flex;
  gap: var(--k-s-12);
  padding: 0 var(--k-s-12) 0 0;
  white-space: pre;
}
.codeblock__gutter {
  flex-shrink: 0;
  width: 24px;
  text-align: right;
  color: var(--k-fg-faint);
  user-select: none;
  font-variant-numeric: tabular-nums;
}
.codeblock__text { flex: 1; }`,
  },
  {
    id: 'pricing',
    section: "Pricing",
    css: `/* === Pricing (#12) === */
.pricing {
  /* Self-responsive tier row: auto-fit lays the tiers side-by-side (3-up, the
     canonical pricing layout) whenever the card is wide enough, and falls back
     to stacked 1-up in a narrow card — no media query, adapts to the card span. */
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  align-items: start;
  gap: var(--k-s-8);
  margin: calc(var(--k-s-4) * -1) 0;
}
.pricing__tier {
  background: var(--k-surface-2);
  border: var(--k-hairline, 1px solid var(--k-border));
  border-radius: var(--k-radius-md);
  padding: var(--k-s-12);
  display: flex;
  flex-direction: column;
  gap: var(--k-s-8);
  position: relative;
}
.pricing__tier--featured {
  background: var(--k-surface);
  border: 2px solid var(--k-primary);
  box-shadow: var(--k-shadow-md);
}
.pricing__badge {
  position: absolute;
  top: -8px;
  right: 12px;
  padding: var(--k-s-2) var(--k-s-8);
  background: var(--k-primary);
  color: var(--k-primary-fg);
  font-size: var(--k-type-caption);
  font-weight: var(--k-weight-bold);
  letter-spacing: var(--k-track-eyebrow);
  /* Marketing tag — follows box radius like .badge (text chip, not a count). */
  border-radius: var(--k-radius-md);
}
.pricing__name {
  font-size: var(--k-type-eyebrow);
  font-weight: var(--k-weight-semibold);
  letter-spacing: var(--k-track-eyebrow);
  text-transform: uppercase;
  color: var(--k-fg-muted);
}
.pricing__price {
  display: flex;
  align-items: baseline;
  gap: var(--k-s-4);
}
.pricing__amount {
  font-size: var(--k-type-h2);
  font-weight: var(--k-weight-semibold);
  font-family: var(--k-font-display);
  font-variant-numeric: tabular-nums;
  color: var(--k-fg);
  letter-spacing: -0.02em;
}
.pricing__period {
  font-size: var(--k-type-eyebrow);
  color: var(--k-fg-muted);
}
.pricing__feats {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--k-s-4);
}
.pricing__feats li {
  font-size: var(--k-type-small);
  color: var(--k-fg);
  padding-left: var(--k-s-16);
  position: relative;
}
.pricing__feats li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: var(--k-success);
  font-weight: var(--k-weight-semibold);
}

/* StatGroup metric strip → unified into the .stat-tile family as
 * .stat-tile-strip / .stat-tile-strip__cell (defined with the stat-tile
 * block above; cells reuse .stat-tile__value / .stat-tile__label). */`,
  },
  {
    id: 'twocolumnlayout',
    section: "TwoColumnLayout",
    css: `/* === TwoColumnLayout (#11) — composed demo === */
.twocol {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: var(--k-s-10);
}
/* Stack the asymmetric two-column to a single column on a phone (the 1.4fr/1fr
 * split is unreadable below ~36rem). */
@media (max-width: 640px) {
  .twocol { grid-template-columns: 1fr; }
}
.twocol__main {
  display: flex;
  flex-direction: column;
  gap: var(--k-s-6);
}
.twocol__side {
  display: flex;
  flex-direction: column;
  gap: var(--k-s-6);
}
.twocol__block,
.twocol__tile {
  padding: var(--k-space, 16px);
  background: var(--k-surface-2);
  border: var(--k-hairline, 1px solid var(--k-border));
  border-radius: var(--k-radius-md);
}
.twocol__tile {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--k-s-6);
}`,
  },
  {
    id: 'wizardstepper',
    section: "WizardStepper",
    css: `/* === WizardStepper (Tier 4 #20) ====================================== */
.wstepper {
  display: flex;
  flex-direction: column;
  gap: var(--k-s-12);
}
/* The wizard's step bar reuses the canonical .stepper recipe above — only the
 * content slot + footer below are wizard-specific. One stepper system. */
.wstepper__content {
  background: var(--k-surface-2);
  border: var(--k-hairline, 1px solid var(--k-border));
  border-radius: var(--k-radius-md);
  padding: var(--k-s-12);
  display: flex;
  flex-direction: column;
  gap: var(--k-s-8);
}
.wstepper__title { font-size: var(--k-type-body); font-weight: var(--k-weight-semibold); color: var(--k-fg); font-family: var(--k-font-display); }
.wstepper__sub { font-size: var(--k-type-small); color: var(--k-fg-muted); }
.wstepper__foot {
  display: flex;
  justify-content: space-between;
  gap: var(--k-s-8);
}`,
  },
  {
    id: 'file-grid',
    section: "File grid",
    css: `/* === File grid (.filegrid) ============================================
 * Generic 4-column thumbnail grid voor media libraries, album collections,
 * cloud storage, AI artifacts. Tiles: cover (aspect 4/3) + name + type
 * badge + meta. Hover lift met spring curve (signature). Modifier voor
 * 2/3/5 cols beschikbaar voor verschillende contexten. */
.filegrid {
  display: grid;
  /* minmax(0,1fr) — NOT plain 1fr. Plain 1fr defaults to minmax(auto,1fr),
   * so a track can't shrink below its content's min-content width and the
   * grid overflows its container (the tiles push past the card edge in the
   * narrow masonry column). minmax(0,…) lets tracks shrink so the filename
   * ellipsis kicks in instead. */
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--k-s-12);
}
.filegrid--2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.filegrid--3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.filegrid--5 { grid-template-columns: repeat(5, minmax(0, 1fr)); }
.filegrid__tile {
  display: flex;
  flex-direction: column;
  gap: var(--k-s-8);
  padding: var(--k-space, 16px);
  border: var(--k-hairline, 1px solid var(--k-border));
  border-radius: var(--k-radius-md);
  background: var(--k-surface);
  cursor: pointer;
  text-align: left;
  font: inherit;
  color: var(--k-fg);
  transition: transform var(--k-dur-fast) var(--k-ease-spring, cubic-bezier(.34,1.56,.64,1)), box-shadow var(--k-dur-fast) var(--k-ease-spring), border-color var(--k-dur-fast) var(--k-ease);
}
.filegrid__tile:hover {
  transform: translateY(-2px);
  box-shadow: var(--k-shadow-md);
}
.filegrid__cover {
  aspect-ratio: 4 / 3;
  background: var(--k-surface-sunken);
  border-radius: calc(var(--k-radius-md) * 0.6);
  display: grid;
  place-items: center;
  color: var(--k-fg-muted);
  overflow: hidden;
}
.filegrid__cover svg { width: 22px; height: 22px; }
.filegrid__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--k-s-4);
}
.filegrid__name {
  font-size: var(--k-type-small);
  font-weight: var(--k-weight-medium);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
}
.filegrid__meta {
  font-size: var(--k-type-eyebrow);
  color: var(--k-fg-muted);
}`,
  },
  {
    id: 'radio-card',
    section: "Radio card",
    css: `/* === Radio card — a selectable option card (radio + body + trailing meta) ==
 * Generic: delivery options, plan tiers, payment methods, shipping speeds…
 * Reuses the system .radio for the dot. Selected = kit selection convention:
 * SOFT solid brand fill + brand border. */
.radio-cards { display: flex; flex-direction: column; gap: var(--k-stack-gap, 8px); }
.radio-card {
  display: flex; align-items: center; gap: var(--k-s-12); padding: var(--k-space, 16px);
  border: var(--k-bw, 1px) solid var(--k-border); border-radius: var(--k-radius-md);
  cursor: pointer; transition: border-color var(--k-dur-fast,110ms) var(--k-ease,ease),
    background var(--k-dur-fast,110ms) var(--k-ease,ease);
}
.radio-card:hover:not(.radio-card--on) { border-color: var(--k-state-border); }
.radio-card--on { border-color: var(--k-ring); background: var(--k-primary-soft); }
.radio-card > .radio { flex: none; }
.radio-card__body { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.radio-card__title { font-size: var(--k-type-body); font-weight: var(--k-weight-semibold); color: var(--k-fg); }
.radio-card__desc { font-size: var(--k-type-small); color: var(--k-fg-muted); margin-top: var(--k-s-2); line-height: 1.4; }
.radio-card__meta { font-size: var(--k-type-small); font-weight: var(--k-weight-bold); color: var(--k-fg); white-space: nowrap; }

/* ----- Slot picker (.slotpicker / .slot) -----
 * A grid of selectable time/option pills — booking & scheduling screens.
 * Selection follows the kit convention: soft brand fill + ring border. */
.slotpicker { display: grid; grid-template-columns: repeat(auto-fill, minmax(82px, 1fr)); gap: var(--k-stack-gap, 8px); }
.slot {
  display: flex; align-items: center; justify-content: center;
  min-height: var(--k-row-h-md, 38px); padding: 0 var(--k-s-10);
  border: var(--k-bw, 1px) solid var(--k-border); border-radius: var(--k-radius-md);
  background: var(--k-surface); color: var(--k-fg);
  font-size: var(--k-type-small); font-weight: var(--k-weight-medium); cursor: pointer;
  transition: background var(--k-dur-fast, 140ms) var(--k-ease, ease), border-color var(--k-dur-fast, 140ms) var(--k-ease, ease);
}
.slot:hover { border-color: var(--k-ring); background: var(--k-state-hover); }
.slot--on { background: var(--k-primary-soft); border-color: var(--k-ring); color: var(--k-primary-soft-fg); font-weight: var(--k-weight-semibold); }
.slot--off { opacity: 0.4; pointer-events: none; text-decoration: line-through; }`,
  },
  {
    id: 'form-panel',
    section: "Form panel",
    css: `/* === Form panel ===
   The editing-surface BLOCK — what you reach for when a screen needs a real form,
   not a loose stack of inputs. A bordered panel with a titled header, a body of
   labelled fields on a responsive grid, sectioned groups, an inline validation
   summary, and a footer action bar (Cancel / Save). COMPOSES the field atoms
   (.field / .lab + .in · .select · .numinput · .phoneinput · .switch · .radio-card)
   and .buttons, so a labelled, validated, sectioned form is rebuildable from the
   kit — not hand-assembled per screen.

   Anatomy
     .formpanel                  frame (border + radius + surface)
       .formpanel__head          title + description (divider below)
       .formpanel__body          padded field area (vertical rhythm)
         .formpanel__error       inline validation summary (when submit fails)
         .formpanel__grid        responsive 2-up field grid; a child takes
           .formpanel__full      to span the full width
         .formpanel__section     a titled sub-group (divider above)
           .formpanel__section-title
       .formpanel__foot          action bar — note (left) + buttons (right) */
.formpanel { border: 1px solid var(--k-border); border-radius: var(--k-radius-md); background: var(--k-surface); overflow: hidden; container: formpanel / inline-size; }
/* Container query (B2) — the field grid already collapses to one column via
 * auto-fit; the query adds what auto-fit can't: under ~380px the action FOOT
 * stacks (note above, buttons full-width block) so the primary action stays
 * thumb-reachable on a narrow container. Responds to the panel's own width. */
@container formpanel (max-width: 380px) {
  .formpanel__foot { flex-direction: column; align-items: stretch; }
  .formpanel__foot-note { margin-right: 0; }
  .formpanel__foot .btn { width: 100%; }
}
.formpanel__head { padding: var(--k-s-16); border-bottom: var(--k-divider); }
.formpanel__title { font-size: var(--k-type-h3); font-weight: var(--k-weight-semibold); color: var(--k-fg); }
.formpanel__desc { font-size: var(--k-type-small); color: var(--k-fg-muted); margin-top: var(--k-s-2); }
.formpanel__body { padding: var(--k-s-16); display: flex; flex-direction: column; gap: var(--k-s-16); }

/* Responsive field grid — two columns on a roomy panel, collapses to one when the
 * panel is narrow (no container query needed: minmax floor + auto-fit). This is
 * the field-layout grammar a bare card lacks; a full-width field opts out. */
.formpanel__grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr)); gap: var(--k-s-16); }
.formpanel__full { grid-column: 1 / -1; }

/* A titled sub-group inside the body — divider above + an eyebrow label, so a long
 * form reads as sections ("Profile", "Security") instead of one undifferentiated wall. */
.formpanel__section { display: flex; flex-direction: column; gap: var(--k-s-16); padding-top: var(--k-s-16); border-top: var(--k-divider); }
.formpanel__section-title { font-size: var(--k-type-eyebrow); font-weight: var(--k-weight-semibold); text-transform: uppercase; letter-spacing: var(--k-track-eyebrow); color: var(--k-fg-muted); }

/* Inline validation summary — an alert band at the top of the body when submit
 * fails, in the danger-soft tone so it matches the .alert atom's error variant. */
.formpanel__error { display: flex; align-items: flex-start; gap: var(--k-s-8); padding: var(--k-s-10) var(--k-s-12); border-radius: var(--k-radius-sm); background: var(--k-danger-soft); color: var(--k-danger-soft-fg, var(--k-danger)); font-size: var(--k-type-small); }
.formpanel__error svg { flex: none; }

/* Footer action bar — mirrors the data-table foot surface for family consistency:
 * a sunken band with a top divider, an optional note on the left, the primary
 * action trailing right. */
.formpanel__foot { display: flex; align-items: center; gap: var(--k-s-12); flex-wrap: wrap; padding: var(--k-s-12) var(--k-s-16); border-top: var(--k-divider); background: var(--k-surface-sunken); }
.formpanel__foot-note { margin-right: auto; font-size: var(--k-type-small); color: var(--k-fg-muted); }`,
  },
  {
    id: 'filter-bar',
    section: "Filter bar",
    css: `/* === Filter bar ===
   The query BLOCK that sits above a list or table: a search field, faceted selects,
   an autocomplete, a range, plus an active-filter chip row that summarises and
   clears the current query. COMPOSES the querying atoms (.searchinput · .select /
   .combobox · .taginput chips · .segctrl · .slider) on the height-invariant
   .toolbar, so a real filtering UI is rebuildable from the kit.

   Anatomy
     .filterbar                  frame (surface + border + radius)
       .toolbar                  the controls row (search · selects · range · actions)
       .filterbar__active        active-filter chips + "Clear all" (only when filtered)
         .filterbar__active-label
       .filterbar__count         result count (trailing, in the active row) */
.filterbar { border: 1px solid var(--k-border); border-radius: var(--k-radius-md); background: var(--k-surface); padding: var(--k-s-12); display: flex; flex-direction: column; gap: var(--k-s-10); container: filterbar / inline-size; }
/* Container query (B2) — the facet toolbar already wraps; under ~440px it stacks
 * each control full-width so every facet is clearly tappable on a narrow
 * container (vs wrapped-but-cramped). Responds to the bar's own width. */
@container filterbar (max-width: 440px) {
  .filterbar .toolbar { flex-direction: column; align-items: stretch; }
  .filterbar .toolbar__spacer { display: none; }
}
/* A labelled control cluster inside the bar (e.g. "Score" + a slider) — the eyebrow
 * names the control without stealing height from the toolbar's one-row invariant. */
.filterbar__group { display: inline-flex; align-items: center; gap: var(--k-gap, var(--k-s-8)); white-space: nowrap; }
.filterbar__group-label { font-size: var(--k-type-eyebrow); font-weight: var(--k-weight-medium); text-transform: uppercase; letter-spacing: var(--k-track-eyebrow); color: var(--k-fg-muted); }
/* Active-filter row — divider above, the current facets as removable chips, a
 * trailing result count, and a text "Clear all". Hidden until something is filtered. */
.filterbar__active { display: flex; align-items: center; flex-wrap: wrap; gap: var(--k-s-8); padding-top: var(--k-s-10); border-top: var(--k-divider); }
.filterbar__active-label { font-size: var(--k-type-eyebrow); font-weight: var(--k-weight-semibold); text-transform: uppercase; letter-spacing: var(--k-track-eyebrow); color: var(--k-fg-muted); }
.filterbar__count { margin-left: auto; font-size: var(--k-type-small); color: var(--k-fg-muted); white-space: nowrap; }
.filterbar__clear { font-size: var(--k-type-small); color: var(--k-primary); background: none; border: 0; cursor: pointer; padding: 0; }
.filterbar__clear:hover { text-decoration: underline; }`,
  },
  {
    id: 'layout-primitives',
    section: "Layout primitives",
    css: `/* === Layout primitives ===
   Framework-neutral layout utilities (the "Every Layout" set), token-driven so they
   inherit your space + measure scale. FOUNDATION glue: composable wrappers that
   replace ad-hoc flex/grid and magic px widths — the layout grammar the blocks
   needed (the form-panel grid + filter rows generalised). Each exposes one CSS var
   to tune; defaults come from the kit so they look right untouched.

     .l-stack      vertical rhythm — even space between stacked children (--l-gap)
     .l-cluster    a wrapping row of items sharing one gap (--l-gap)
     .l-switcher   a row that flips to a column when it can't fit --l-threshold
     .l-grid       responsive auto-fit grid, min column = --l-min (default 16rem)
     .l-sidebar    a side (--l-side) + a flexible main that wraps under it
     .l-center     centered column capped at a readable --l-measure (no magic px) */
.l-stack { display: flex; flex-direction: column; }
.l-stack > * { margin-block: 0; }
.l-stack > * + * { margin-block-start: var(--l-gap, var(--k-space)); }

.l-cluster { display: flex; flex-wrap: wrap; gap: var(--l-gap, var(--k-space)); align-items: var(--l-align, center); }

/* The Switcher: each child grows to fill, but the moment the row's width drops below
 * --l-threshold the basis flips hugely negative and they stack — a container-query-
 * free responsive switch. */
.l-switcher { display: flex; flex-wrap: wrap; gap: var(--l-gap, var(--k-space)); }
.l-switcher > * { flex-grow: 1; flex-basis: calc((var(--l-threshold, 28rem) - 100%) * 999); }

.l-grid { display: grid; gap: var(--l-gap, var(--k-space)); grid-template-columns: repeat(auto-fit, minmax(min(100%, var(--l-min, 16rem)), 1fr)); }

.l-sidebar { display: flex; flex-wrap: wrap; gap: var(--l-gap, var(--k-space)); }
.l-sidebar__side { flex-grow: 1; flex-basis: var(--l-side, 16rem); }
.l-sidebar__main { flex-grow: 999; flex-basis: 0; min-width: var(--l-threshold, 50%); }

/* The Center: a readable column. Caps at a ch-based measure token (tracks the body
 * font) instead of an arbitrary px width — the answer to "kill the 375/640px". */
.l-center { box-sizing: content-box; max-width: var(--l-measure, var(--k-measure-prose)); margin-inline: auto; padding-inline: var(--l-pad, var(--k-s-16)); }
.l-center--narrow { --l-measure: var(--k-measure-narrow); }
.l-center--wide { --l-measure: var(--k-measure-wide); }`,
  },
]
