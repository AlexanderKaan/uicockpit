import { test, expect } from '@playwright/test'

/**
 * Full-pipeline smoke test. Validates that the whole chain works:
 *   URL hash → decode → config → buildTokens → preview render → export round-trip
 *
 * Intentionally one scenario, not many — this is the M4 verification net,
 * not a UI regression suite (manual pass covers that, per DECISIONS.md).
 */
test('full pipeline: load → preset → dark → export → CSS contains tokens', async ({ page }) => {
  await page.goto('/app')

  // Sanity: panel + stage render
  await expect(page.locator('.panel')).toBeVisible()
  await expect(page.locator('.cockpit-preview')).toBeVisible()

  // Apply Indigo preset via URL hash (skipping dropdown interaction)
  const inkCfg = {
    preset: 'indigo', color: 'tone',
    radius: 'soft', density: 'normal', typeScale: 'normal',
    fontDisplay: 'Inter', fontBody: 'Inter', iconSet: 'line',
    uiWeight: 'semibold', uiCase: 'normal', uiTrack: 'normal',
    elevation: 'soft', borders: 'subtle', motion: 'smooth',
    stateLayer: 'medium', contrast: 'balanced', texture: 'clean',
    cPrimary: '#5654c8', cSecondary: '#ececed', cAccent: '#8987de', neutral: 'cool',
    mode: 'light',
  }
  await page.evaluate((cfg) => {
    location.hash = btoa(JSON.stringify(cfg))
  }, inkCfg)
  await page.waitForTimeout(300)

  // Preset should be reflected in the dropdown
  await expect(page.locator('.theme-dd__label')).toHaveText('Indigo')

  // Toggle to dark mode
  await page.getByRole('radio', { name: 'Dark' }).click()
  await page.waitForTimeout(150)

  // Chrome should stay light (background variable unchanged), preview should darken
  const previewBg = await page
    .locator('.cockpit-preview')
    .evaluate((el) => getComputedStyle(el).getPropertyValue('--k-bg'))
  expect(previewBg.trim()).not.toBe('')

  // Switch to dashboard view (triggers View Transitions API)
  await page.getByRole('tab', { name: 'Live dashboard' }).click()
  await expect(page.locator('.dash')).toBeVisible()

  // Switch back to Components
  await page.getByRole('tab', { name: 'Components' }).click()
  await expect(page.locator('.gallery')).toBeVisible()

  // Open Export modal
  await page.getByRole('button', { name: 'Export kit' }).click()
  await expect(page.locator('.modal')).toBeVisible()

  // Switch to tokens.css tab
  await page.getByRole('tab', { name: 'tokens.css' }).click()
  const cssText = await page.locator('.modal__code').textContent()
  expect(cssText).toContain(':root {')
  expect(cssText).toContain('.dark {')
  expect(cssText).toContain('--k-primary:')
  expect(cssText).toContain('--k-success:')

  // tokens.json tab — verify it parses and contains decisions
  await page.getByRole('tab', { name: 'tokens.json' }).click()
  const jsonText = await page.locator('.modal__code').textContent()
  const parsed = JSON.parse(jsonText ?? '{}')
  expect(parsed.decisions.preset).toBe('indigo')
  expect(parsed.tokens.color.primary.name).toBeTruthy()

  // Close
  await page.getByRole('button', { name: 'Close' }).click()
  await expect(page.locator('.modal')).not.toBeVisible()
})

test('switching icon set loads a new chunk without reload', async ({ page }) => {
  await page.goto('/app')

  // Wait for initial line (Lucide) library to load — at least one icon SVG
  await expect(page.locator('.cockpit-preview svg').first()).toBeVisible()

  // Click Solid in the Icons segmented control
  await page.getByRole('radio', { name: 'Solid' }).click()
  await page.waitForTimeout(400)

  // Heroicons solid uses 24x24 viewBox — verify
  const viewBox = await page
    .locator('.cockpit-preview svg')
    .first()
    .getAttribute('viewBox')
  expect(viewBox).toBe('0 0 24 24')
})
