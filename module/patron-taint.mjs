/* global CONFIG, Hooks, game, console */

import { resolveMccTable } from './mcc-tables.mjs'

/**
 * MCC Patron Taint.
 *
 * In MCC a natural 1 on an *Invoke Patron AI* wetware check incurs Patron
 * Taint — roll that patron's 1d6 taint table. This is distinct from DCC's
 * cleric disapproval (range-based, escalating), so MCC casts suppress DCC's
 * built-in d100 patron-taint via the `suppressPatronTaint` flag (set at cast
 * time, alongside glowburn) and this handler rolls the MCC table instead.
 *
 * It listens to `dcc.afterSpellCheckResult`, the post-result hook the DCC
 * system fires once per spell check. The taint table is resolved
 * world-tables-first via `resolveMccTable`, so a judge can supply
 * `Patron Taint: <PATRON>` tables in their own world (or a compendium named in
 * settings) without owning the mcc-core-book.
 */

/**
 * Derive the patron identifier (uppercase, matching the table-name suffix)
 * from a cast Invoke Patron AI item. Prefers the authoritative
 * `flags.mcc-core-book.programPatron` (lowercase) the content parser stamps;
 * falls back to parsing the item name `Invoke Patron AI (<PATRON>)` so a
 * homebrew Invoke item without the flag still works. Returns null when the
 * item is not an Invoke Patron AI program.
 */
export function patronFromInvokeItem (item) {
  const flagPatron = item?.flags?.['mcc-core-book']?.programPatron
  if (flagPatron) return flagPatron.toUpperCase()

  const nameMatch = item?.name?.match(/^Invoke Patron AI \(([^)]+)\)/)
  return nameMatch ? nameMatch[1] : null
}

/**
 * `dcc.afterSpellCheckResult` listener. Bails cheaply for every spell check
 * that isn't a natural-1 Invoke Patron AI cast.
 */
export async function onSpellCheckResult (actor, payload) {
  const { item, naturalRoll } = payload || {}
  if (!item || naturalRoll !== 1) return

  const patron = patronFromInvokeItem(item)
  if (!patron) return

  const tableName = `Patron Taint: ${patron}`
  const table = await resolveMccTable(CONFIG.MCC?.patronTaintPacks, tableName)
  if (!table) {
    console.warn(`MCC | Patron Taint table "${tableName}" not found — no world RollTable of that name and no registered patron-taint compendium. Skipping taint roll.`)
    return
  }

  // Roll the patron's 1d6 taint table and render the result to chat. The
  // drawn table is a plain RollTable, not a spell check, so it does not
  // re-trigger this hook.
  await table.draw({ rollMode: game.settings.get('core', 'rollMode') })
}

/**
 * Register the Patron Taint handler. Call at `init` so the listener is live
 * before any cast reaches `dcc.afterSpellCheckResult`.
 */
export function registerPatronTaintHandler () {
  Hooks.on('dcc.afterSpellCheckResult', onSpellCheckResult)
}
