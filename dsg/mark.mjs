/**
 * THE MARK.
 *
 * The real UIcockpit logo, recovered from the archived app: a disc with a
 * cockpit-window glyph cut out of it. The disc takes `currentColor` and the
 * glyph takes `--wm-glyph` (set to whatever is behind it), so the mark inverts
 * with its surroundings instead of a dark disc disappearing into a dark bar.
 *
 * It was drawn once and it is not being redrawn. A lucide box standing in for
 * it was a placeholder that quietly became the logo.
 */
const DISC = 'M255.5 41C269.346 41 282.885 42.3113 296 44.8174V203.73C284.839 194.986 270.778 189.773 255.5 189.773C219.2 189.773 189.773 219.2 189.773 255.5C189.773 291.8 219.2 321.227 255.5 321.227C270.778 321.227 284.838 316.013 296 307.269V466.182C282.885 468.688 269.346 470 255.5 470C137.035 470 41 373.965 41 255.5C41 137.035 137.035 41 255.5 41Z'

export const mark = (size = 18) =>
  `<svg class="wm" viewBox="0 0 512 512" width="${size}" height="${size}" role="img" aria-label="UIcockpit" fill="none">
    <circle cx="256" cy="256" r="256" fill="currentColor"/><path d="${DISC}" fill="var(--wm-glyph,#fff)"/></svg>`
