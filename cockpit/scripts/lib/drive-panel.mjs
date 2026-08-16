/**
 * Driving the configurator's own controls — and REFUSING to do it silently.
 *
 * 🚨 THE BUG THIS EXISTS TO MAKE IMPOSSIBLE. `a11y-matrix.mjs` set the density by
 * writing to `.fmrow input[type="range"]`. The panel was refactored to one row
 * shape on 2026-08-15 and that input stopped existing. The setter returned
 * `false`; nobody read the return value; and the matrix went on printing
 *
 *     light  compact      ✓ 0
 *     light  default      ✓ 0
 *     light  comfortable  ✓ 0
 *
 * for months. Three lines, one measurement. "0 violations across 6
 * configurations" — the headline claim on the conformance report — was 0
 * violations across TWO, repeated three times. Nothing was wrong with the page;
 * everything was wrong with the instrument, and it looked exactly like success.
 *
 * So this module has two rules, and they are the whole point of it:
 *
 *   1. A DRIVER THROWS WHEN IT CANNOT DRIVE. Never a boolean nobody checks.
 *   2. IT VERIFIES ITS OWN EFFECT. Clicking the right element is not evidence
 *      that anything changed — the panel could rerender, the option could be
 *      disabled, the click could land on a label. So each setter reads a witness
 *      out of the page before and after, and throws if it did not move.
 */

/** The one witness that proves a density change reached the preview.
 *
 * ⚠️ Read the TOKEN, not a rendered button. The first version measured
 * `.cockpit-preview .btn`, and the first button on the wall happens to be a
 * `btn--sm` with its own height — so it sat at 28px through every density and the
 * driver declared its own successful click a failure. A witness has to watch the
 * thing the control actually moves. */
const DENSITY_WITNESS = () => {
  const cs = getComputedStyle(document.querySelector('.cockpit-preview'))
  return cs.getPropertyValue('--k-btn-h-default').trim() + '|' + cs.getPropertyValue('--k-in-h-default').trim()
}

/**
 * Set a flyout row (Scale, Conformance, Brand, …) to a named option.
 *
 * @param page      Playwright page
 * @param rowLabel  the row's visible label, e.g. 'Scale'
 * @param optionRe  a source-string regex matching the option, e.g. 'Compact'
 * @param witness   optional page function returning a comparable value; when
 *                  given, the call throws unless the value changes
 */
export async function setRow(page, rowLabel, optionRe, { witness = null, expectChange = true } = {}) {
  const before = witness ? await page.evaluate(witness) : null

  const opened = await page.evaluate((label) => {
    const rows = [...document.querySelectorAll('.fmrow')]
    const row = rows.find((r) => r.querySelector('.fmrow__label')?.textContent?.trim().startsWith(label))
    if (!row) return { ok: false, why: `no .fmrow labelled "${label}" (found: ${rows.map((r) => r.querySelector('.fmrow__label')?.textContent?.trim()).join(', ')})` }
    const head = row.querySelector('.fmrow__head')
    if (!head) return { ok: false, why: `row "${label}" has no .fmrow__head to open` }
    head.click()
    return { ok: true }
  }, rowLabel)
  if (!opened.ok) throw new Error(`setRow(${rowLabel}): ${opened.why}`)

  await page.waitForTimeout(220)

  const picked = await page.evaluate(({ label, re }) => {
    const rows = [...document.querySelectorAll('.fmrow')]
    const row = rows.find((r) => r.querySelector('.fmrow__label')?.textContent?.trim().startsWith(label))
    const pop = row?.querySelector('.fmrow__pop')
    if (!pop) return { ok: false, why: `the flyout for "${label}" did not open` }
    const rx = new RegExp(re, 'i')
    const opts = [...pop.querySelectorAll('button, [role="menuitem"], [role="option"]')]
    const hit = opts.find((o) => rx.test(o.textContent || ''))
    if (!hit) return { ok: false, why: `no option matching /${re}/i in "${label}" (offered: ${opts.map((o) => o.textContent?.trim()).join(' · ')})` }
    hit.click()
    return { ok: true, chose: hit.textContent?.trim() }
  }, { label: rowLabel, re: optionRe })
  if (!picked.ok) throw new Error(`setRow(${rowLabel}): ${picked.why}`)

  await page.waitForTimeout(500)
  // Close the flyout so the next read is not taken through an open overlay.
  await page.evaluate(() => document.body.click())
  await page.waitForTimeout(200)

  if (witness && expectChange) {
    const after = await page.evaluate(witness)
    if (JSON.stringify(before) === JSON.stringify(after)) {
      throw new Error(
        `setRow(${rowLabel} → ${picked.chose}): the control was operated but NOTHING MOVED ` +
        `(witness stayed ${JSON.stringify(before)}). Either the option was already active or the ` +
        `control is not wired — both mean this configuration was never measured.`,
      )
    }
  }
  return picked.chose
}

/**
 * The three densities, driven for real.
 *
 * `default` is the starting state, so it is the one position where the witness
 * legitimately does not move — that exception is declared here rather than by
 * weakening the check for every position.
 */
export async function setDensity(page, scale) {
  const label = { compact: 'Compact', default: 'Default', comfortable: 'Comfortable' }[scale]
  if (!label) throw new Error(`setDensity: unknown scale "${scale}"`)
  return setRow(page, 'Scale', `^${label}$`, { witness: DENSITY_WITNESS })
}

export { DENSITY_WITNESS }
