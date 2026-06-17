/* eslint-disable no-undef -- Browser globals (game, Actor, Roll, ui, etc.) used in page.evaluate callbacks */
const { test, expect } = require('@playwright/test')

/**
 * E2E tests for the §9.2 MCC sheet schema corrections — the live behaviour the
 * unit tests can't reach:
 *
 *   - 9.2a Mutant Horror initiative die: the additive horror die is folded into
 *     `system.attributes.init.die` as `1d20+<die>`. DCC's `computeInitiative`
 *     recomputes `init.value` from agl.mod on every prepare, so the die MUST ride
 *     on `init.die` (which computeInitiative never touches). The sheet's "Roll
 *     Initiative" button uses the legacy/dialog init path, which reads `init.die`
 *     verbatim and rolls `1d20+1d3`.
 *     KNOWN LIMITATION: the combat-tracker init path (`DCCCombatant.getInitiativeRoll`
 *     → the adapter path) runs `init.die` through `normalizeLibDie`, which keeps
 *     only the first die (`1d20+1d3` → `d20`), so combat-tracker initiative does
 *     NOT add the horror die. Only the sheet-button roll does. This test asserts
 *     the working (sheet/legacy) path and that computeInitiative preserves init.die.
 *
 *   - 9.2e Plantient Hide in Greenery: a percentile (roll-under) check wired to a
 *     custom `rollHideInGreenery` action — rolls 1d100 and succeeds on roll <=
 *     value, posting a Hidden!/Spotted! chat card.
 *
 * PREREQUISITES:
 *   1. Start Foundry on the `v14` world (dcc + mcc-classes + mcc-core-book enabled,
 *      packs compiled — including the §9.2 mcc-class-level-data recompile).
 *   2. npm install && npm run install:browsers
 *   3. npm test
 */

test.describe('MCC Sheet Mechanics E2E (§9.2)', () => {
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

    // Wait until the MCC class sheets are registered (mcc-classes loaded).
    await page.waitForFunction(
      () => globalThis.game?.ready === true &&
        !!globalThis.CONFIG?.Actor?.sheetClasses?.Player?.['mcc-mutant.ActorSheetMutant'] &&
        !!globalThis.CONFIG?.Actor?.sheetClasses?.Player?.['mcc-plantient.ActorSheetPlantient'],
      { timeout: 15000 }
    )

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

  test('9.2a: Mutant Horror folds into init.die and survives computeInitiative; the sheet init roll uses the compound die', async ({ page }) => {
    const out = await page.evaluate(async () => {
      const actor = await Actor.create({ name: 'MCC E2E Mutant Init', type: 'Player' })
      // Mimic the §9.2a L1 level-data: the Mutant Horror die folded into init.die.
      await actor.update({ 'system.attributes.init.die': '1d20+1d3' })

      // computeInitiative runs in prepareData and recomputes init.value from
      // agl.mod + otherMod (+ level), but must NOT touch init.die — that's the
      // load-bearing claim for §9.2a. (We avoid calling getInitiativeRoll here:
      // the legacy/dialog path the sheet button uses can open a modifier dialog,
      // which would hang headless. Tim verified that path live — see screenshot
      // in the §9.2a session notes. This test locks in the data contract that
      // path depends on.)
      actor.prepareData()
      const dieAfterPrepare = actor.system.attributes.init.die

      // A Roll built straight from init.die (exactly what the sheet's legacy init
      // path feeds Foundry) evaluates to a two-die result in the expected range —
      // proving the compound formula is a valid additive roll, not a single die.
      const probe = await new Roll(actor.system.attributes.init.die).evaluate()
      const dieCount = probe.dice.reduce((n, d) => n + d.number, 0)

      return { dieAfterPrepare, probeTotal: probe.total, dieCount }
    })

    expect(out.dieAfterPrepare, 'computeInitiative must not clobber init.die').toBe('1d20+1d3')
    expect(out.dieCount, 'init.die should roll two dice (1d20 + 1d3)').toBe(2)
    expect(out.probeTotal).toBeGreaterThanOrEqual(2)
    expect(out.probeTotal).toBeLessThanOrEqual(23)
  })

  test('9.2e: Plantient Hide in Greenery rolls a d% check and posts a Hidden!/Spotted! card', async ({ page }) => {
    // Create a Plantient PC routed to the MCC Plantient sheet, with the d% value.
    await page.evaluate(async () => {
      const actor = await Actor.create({
        name: 'MCC E2E Plantient Hide',
        type: 'Player',
        'flags.core.sheetClass': 'mcc-plantient.ActorSheetPlantient'
      })
      await actor.update({ 'system.skills.hideInGreenery': { label: 'Plantient.HideInGreenery', value: '50' } })
      await actor.sheet.render(true)
      await new Promise(r => setTimeout(r, 600))
      // The cell lives in the (non-initial) plantient tab — switch to it so the
      // rollable is visible.
      actor.sheet.changeTab('plantient', 'sheet')
    })

    // The sheet's Hide in Greenery cell carries data-action="rollHideInGreenery".
    const rollable = page.locator('[data-action="rollHideInGreenery"]').first()
    await rollable.waitFor({ state: 'visible', timeout: 10000 })

    const start = await page.evaluate(() => Date.now())
    await rollable.click()

    // Poll chat for the resulting Hide in Greenery card.
    const out = await page.evaluate(async (startTs) => {
      let found = null
      for (let i = 0; i < 40 && !found; i++) {
        await new Promise(r => setTimeout(r, 100))
        found = game.messages.contents.find(m =>
          m.timestamp >= startTs && /Hide in Greenery/i.test(`${m.flavor || ''} ${m.content || ''}`)
        )
      }
      return {
        found: !!found,
        flavor: found?.flavor ?? null,
        hasOutcome: found ? /Hidden!|Spotted!/.test(`${found.flavor || ''} ${found.content || ''}`) : false,
        newMessages: game.messages.contents
          .filter(m => m.timestamp >= startTs)
          .map(m => ({ flavor: m.flavor, snippet: (m.content || '').slice(0, 100) }))
      }
    }, start)

    expect(out.found, `No Hide in Greenery card found. New messages:\n${JSON.stringify(out.newMessages, null, 2)}`).toBe(true)
    expect(out.hasOutcome, `Card should report Hidden!/Spotted! (flavor: ${out.flavor})`).toBe(true)
  })

  test('extension-API migration: all 7 MCC classes register through game.dcc, fields land via mixins, and the mutant sheet composes the expected tabs', async ({ page }) => {
    const out = await page.evaluate(async () => {
      const CLASS_IDS = ['mutant', 'manimal', 'plantient', 'rover', 'sentinel', 'shaman', 'healer']
      const registries = {
        mixins: Object.keys(CONFIG.DCC.classMixins || {}),
        defaults: Object.keys(CONFIG.DCC.classDefaults || {}),
        sheetParts: Object.keys(CONFIG.DCC.sheetParts || {})
      }

      // Schema fields contributed by the per-class mixins + shared hook.
      const actor = await Actor.create({ name: 'MCC E2E Schema', type: 'Player' })
      const s = actor.system
      const fields = {
        mutantHorror: s.class.mutantHorror?.value ?? null, // mutant mixin
        artifactDie: s.class.artifactDie?.value ?? null, // sentinel mixin
        aiPatron: !!s.class.aiPatron, // shaman mixin
        manimalSubType: !!s.class.manimalSubType, // manimal mixin
        plantientSubType: !!s.class.plantientSubType, // plantient mixin
        doorsAndSecurity: !!s.skills.doorsAndSecurity, // rover mixin
        hideInGreenery: s.skills.hideInGreenery?.value ?? null, // plantient mixin
        naturopathyHasPool: typeof s.skills.naturopathy?.usesPerDay === 'number', // healer mixin
        archaicAlignment: !!s.class.archaicAlignment, // shared hook
        artifactCheckAbility: s.skills.artifactCheck?.ability ?? null // shared hook
      }
      await actor.delete()

      // Mutant sheet composes its tabs from the registerSheetPart entry +
      // first-open defaults via registerClassDefaults.
      const mutant = await Actor.create({ name: 'MCC E2E Mutant Tabs', type: 'Player' })
      await mutant.setFlag('core', 'sheetClass', 'mcc-mutant.ActorSheetMutant')
      await mutant.sheet.render(true)
      await new Promise(r => setTimeout(r, 1200))
      const tabs = mutant.sheet._getTabsConfig('sheet').tabs.map(t => t.id)
      const applied = { sheetClass: mutant.system.details.sheetClass, critRange: mutant.system.details.critRange }
      await mutant.sheet.close()
      await mutant.delete()

      return { registries, fields, tabs, applied }
    })

    for (const id of ['mutant', 'manimal', 'plantient', 'rover', 'sentinel', 'shaman', 'healer']) {
      expect(out.registries.mixins, `mixin ${id}`).toContain(id)
      expect(out.registries.defaults, `defaults ${id}`).toContain(id)
      expect(out.registries.sheetParts, `sheetPart ${id}`).toContain(id)
    }
    expect(out.fields.mutantHorror).toBe('1d3')
    expect(out.fields.artifactDie).toBe('1d3')
    expect(out.fields.aiPatron).toBe(true)
    expect(out.fields.manimalSubType).toBe(true)
    expect(out.fields.plantientSubType).toBe(true)
    expect(out.fields.doorsAndSecurity).toBe(true)
    expect(out.fields.hideInGreenery).toBe('50')
    expect(out.fields.naturopathyHasPool).toBe(true)
    expect(out.fields.archaicAlignment).toBe(true)
    expect(out.fields.artifactCheckAbility).toBe('int')
    expect(out.applied.sheetClass).toBe('Mutant')
    expect(out.applied.critRange).toBe(20)
    expect(out.tabs).toContain('mutant')
    expect(out.tabs).toContain('spells')
    expect(out.tabs).toContain('skills')
    expect(out.tabs).toContain('effects')
    expect(out.tabs).toContain('notes')
    // skills auto-adds once via showSkills — must not double.
    expect(out.tabs.filter(t => t === 'skills')).toHaveLength(1)
  })
})

/**
 * Delete actors / windows created by these tests so reruns start clean.
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
