/* global CONFIG, Hooks, game, console */

import { resolveMccTable } from './mcc-tables.mjs'

/**
 * MCC Glowburn manifestation.
 *
 * Glowburn — sacrificing physical ability points (Strength / Agility /
 * Stamina) for +1 per point to a check — is mechanically DCC spellburn, which
 * the DCC roll-modifier dialog already offers for MCC's generic-casting-mode
 * items. The MCC-specific consequence is the per-patron manifestation: when a
 * shaman glowburns while running one of a patron's programs, roll that patron's
 * 1d4 table. This handler supplies that roll.
 *
 * It listens to `dcc.afterSpellCheckResult` and fires when (a) ability points
 * were burned this cast (`spellburn > 0`, surfaced by the DCC hook) and (b) the
 * cast item is a patron program (carries `flags.mcc-core-book.programPatron`).
 * Mutant / manimal / plantient mutation casts can also glowburn but have no
 * manifestation table — those items carry no patron flag, so they're correctly
 * skipped. `Glowburn: <PATRON>` resolves world-tables-first via
 * `resolveMccTable`, so a judge can supply their own without the mcc-core-book.
 *
 * Recovery of glowburned ability points (one point per day of non-use, per the
 * book) is intentionally NOT automated — it's left to the judge, the same way
 * DCC leaves spellburn recovery to play. This handler only fires the
 * manifestation roll.
 */

/**
 * Patron identifier (uppercase, matching the table-name suffix) for a cast
 * patron program, or null when the item isn't patron-bound. Prefers the
 * authoritative `flags.mcc-core-book.programPatron`; falls back to parsing an
 * `Invoke Patron AI (<PATRON>)` name.
 */
export function patronFromProgram (item) {
  const flagPatron = item?.flags?.['mcc-core-book']?.programPatron
  if (flagPatron) return flagPatron.toUpperCase()

  const nameMatch = item?.name?.match(/^Invoke Patron AI \(([^)]+)\)/)
  return nameMatch ? nameMatch[1] : null
}

/**
 * `dcc.afterSpellCheckResult` listener. Bails cheaply unless glowburn (a
 * spellburn of one or more points) was used on a patron program.
 */
export async function onSpellCheckResult (actor, payload) {
  const { item, spellburn } = payload || {}
  if (!item || !(spellburn > 0)) return

  const patron = patronFromProgram(item)
  if (!patron) return

  const tableName = `Glowburn: ${patron}`
  const table = await resolveMccTable(CONFIG.MCC?.glowburnPacks, tableName)
  if (!table) {
    console.warn(`MCC | Glowburn table "${tableName}" not found — no world RollTable of that name and no registered glowburn compendium. Skipping manifestation.`)
    return
  }

  await table.draw({ rollMode: game.settings.get('core', 'rollMode') })
}

/**
 * Register the glowburn manifestation handler. Call at `init` so the listener
 * is live before any cast reaches `dcc.afterSpellCheckResult`.
 */
export function registerGlowburnHandler () {
  Hooks.on('dcc.afterSpellCheckResult', onSpellCheckResult)
}
