/* eslint-disable no-undef -- Browser globals (game, Actor, Roll, CONFIG, etc.) used in page.evaluate callbacks */
const { test, expect } = require('@playwright/test')

/**
 * E2E tests for MCC patron mechanics, validating the live chain that the unit
 * tests can only mock: a real cast -> DCC's dcc.afterSpellCheckResult hook ->
 * the mcc-classes handler -> resolveMccTable against the loaded compendium ->
 * RollTable.draw -> a chat card.
 *
 *   - Patron Taint: a natural 1 (forced via the new ctrl/meta+shift force-fumble,
 *     here passed as `forceFumble`) on an Invoke Patron AI cast draws the
 *     patron's 1d6 "Patron Taint: <PATRON>" table.
 *   - Glowburn: burning ability points (spellburn) on a patron program draws
 *     the patron's 1d4 "Glowburn: <PATRON>" table.
 *
 * PREREQUISITES:
 *   1. Start Foundry on the `v14` world (dcc on feature/spell-check-hooks +
 *      mcc-classes + mcc-core-book enabled, packs compiled).
 *   2. npm install && npm run install:browsers
 *   3. npm test
 */

test.describe('MCC Patron Mechanics E2E', () => {
  let consoleErrors = []

  test.beforeAll(async () => {
    let response
    try {
      response = await fetch('http://localhost:30000/', { signal: AbortSignal.timeout(5000) })
    } catch {
      throw new Error(
        'Could not connect to Foundry VTT at http://localhost:30000.\n\n' +
        'Start Foundry and launch the v14 world (dcc + mcc-classes + mcc-core-book enabled), then re-run: npm test'
      )
    }
    // A launched world serves /join; the setup/auth screens mean no world is
    // active, so there is nothing to log into.
    if (/\/(setup|auth|license)/.test(response.url)) {
      throw new Error(
        `Foundry is at the setup screen (${response.url}) — no world is launched.\n\n` +
        'Launch the v14 world (dcc + mcc-classes + mcc-core-book enabled), then re-run: npm test'
      )
    }
  })

  test.beforeEach(async ({ page }) => {
    consoleErrors = []
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })

    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('http://localhost:30000/join')
    await page.waitForTimeout(1000)

    const isInGame = await page.locator('.game.system-dcc').isVisible({ timeout: 1000 }).catch(() => false)
    if (!isInGame) {
      await page.locator('select[name="userid"]').waitFor({ state: 'visible', timeout: 10000 })
      await page.selectOption('select[name="userid"]', { label: 'Gamemaster' })
      await page.click('button[name="join"]')
      await page.waitForSelector('.game.system-dcc', { timeout: 30000 })
    }

    await page.waitForSelector('#actors', { timeout: 10000, state: 'attached' })
    await page.evaluate(() => document.querySelectorAll('#notifications .notification').forEach(n => n.remove()))

    // Wait until both systems are fully initialized: DCC's spell-check API and
    // the mcc-classes content-table registries.
    await page.waitForFunction(
      () => globalThis.game?.ready === true &&
        globalThis.game?.dcc?.processSpellCheck !== undefined &&
        globalThis.CONFIG?.MCC?.patronTaintPacks !== undefined,
      { timeout: 15000 }
    )

    // Dismiss any welcome dialogs.
    for (const id of ['#dcc-welcome-dialog', '#mcc-core-book-welcome-dialog', '#dcc-core-book-welcome-dialog']) {
      const dialog = page.locator(id)
      if (await dialog.isVisible({ timeout: 300 }).catch(() => false)) {
        await page.keyboard.press('Escape')
        await page.waitForTimeout(200)
      }
    }

    await cleanup(page)
  })

  test.afterEach(async ({ page }) => {
    await cleanup(page).catch(() => {})
    const significantErrors = consoleErrors.filter(err => !err.includes('favicon.ico'))
    expect(significantErrors, `Console errors detected:\n${significantErrors.join('\n')}`).toHaveLength(0)
  })

  test('a natural 1 on an Invoke Patron AI cast draws the Patron Taint table', async ({ page }) => {
    const out = await page.evaluate(async () => {
      // Ensure the taint pack is registered (the mcc-core-book broadcast / the
      // registerDisapproval setting normally does this); addPack is idempotent.
      CONFIG.MCC.patronTaintPacks?.addPack('mcc-core-book.mcc-core-disapproval')

      const pack = game.packs.get('mcc-core-book.mcc-core-ai-programs')
      if (!pack) return { error: 'pack mcc-core-ai-programs not found' }
      await pack.getIndex()
      const entry = pack.index.find(e => e.name === 'Invoke Patron AI (HALE-E)')
      if (!entry) return { error: 'Invoke Patron AI (HALE-E) not found in pack' }
      const itemDoc = await pack.getDocument(entry._id)

      const actor = await Actor.create({ name: 'MCC E2E Taint Shaman', type: 'Player' })
      const [item] = await actor.createEmbeddedDocuments('Item', [itemDoc.toObject()])

      const start = Date.now()
      // Force a fumble (natural 1) — the trigger for Patron Taint.
      await item.rollSpellCheck('int', { forceFumble: true, showModifierDialog: false })

      // afterSpellCheckResult handlers are async and not awaited by
      // Hooks.callAll, so poll for the resulting Patron Taint chat card.
      let found = null
      for (let i = 0; i < 40 && !found; i++) {
        await new Promise(r => setTimeout(r, 100))
        found = game.messages.contents.find(m =>
          m.timestamp >= start && /Patron Taint/i.test(`${m.flavor || ''} ${m.content || ''}`)
        )
      }
      return {
        found: !!found,
        newMessages: game.messages.contents
          .filter(m => m.timestamp >= start)
          .map(m => ({ flavor: m.flavor, snippet: (m.content || '').slice(0, 100) }))
      }
    })

    expect(out.error, out.error).toBeUndefined()
    expect(out.found, `No Patron Taint card found. New messages:\n${JSON.stringify(out.newMessages, null, 2)}`).toBe(true)
  })

  test('burning ability points on a patron program draws the Glowburn table', async ({ page }) => {
    const out = await page.evaluate(async () => {
      CONFIG.MCC.glowburnPacks?.addPack('mcc-core-book.mcc-core-glowburn')

      const pack = game.packs.get('mcc-core-book.mcc-core-ai-programs')
      if (!pack) return { error: 'pack mcc-core-ai-programs not found' }
      await pack.getIndex()
      const entry = pack.index.find(e => e.name === 'Invoke Patron AI (GAEA)')
      if (!entry) return { error: 'Invoke Patron AI (GAEA) not found in pack' }
      const itemDoc = await pack.getDocument(entry._id)

      const actor = await Actor.create({ name: 'MCC E2E Glowburn Shaman', type: 'Player' })
      const [item] = await actor.createEmbeddedDocuments('Item', [itemDoc.toObject()])

      // Deterministic non-natural-1 roll so the patron-taint handler does NOT
      // also fire — glowburn keys off spellburn > 0, not the die result.
      const roll = await new Roll('1d20').evaluate()
      roll.terms[0].results[0].result = 15
      roll.terms[0]._total = 15
      roll._total = 15

      const start = Date.now()
      await game.dcc.processSpellCheck(actor, {
        item,
        roll,
        spellburn: 1,
        suppressPatronTaint: true,
        rollTable: null,
        flavor: item.name
      })

      let found = null
      for (let i = 0; i < 40 && !found; i++) {
        await new Promise(r => setTimeout(r, 100))
        found = game.messages.contents.find(m =>
          m.timestamp >= start && /Glowburn/i.test(`${m.flavor || ''} ${m.content || ''}`)
        )
      }
      return {
        found: !!found,
        newMessages: game.messages.contents
          .filter(m => m.timestamp >= start)
          .map(m => ({ flavor: m.flavor, snippet: (m.content || '').slice(0, 100) }))
      }
    })

    expect(out.error, out.error).toBeUndefined()
    expect(out.found, `No Glowburn card found. New messages:\n${JSON.stringify(out.newMessages, null, 2)}`).toBe(true)
  })
})

/**
 * Delete actors / messages created by these tests so reruns start clean.
 */
async function cleanup (page) {
  await page.evaluate(async () => {
    for (const app of Object.values(ui.windows)) {
      await app.close()
    }
    for (const actor of game.actors.filter(a => a.name.startsWith('MCC E2E '))) {
      await actor.delete()
    }
  })
}
