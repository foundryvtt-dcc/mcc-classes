/* global CONFIG, game, console */

/**
 * MCC critical-hit / fumble precedence enforcement.
 *
 * Both `mcc-core-book` and `dcc-core-book` feed the DCC system's crit/fumble
 * registries through the SAME hooks during their own `dcc.ready` handlers:
 *   - `dcc.registerCriticalHitsPack` → CONFIG.DCC.criticalHitPacks (a
 *     TablePackManager; first pack with a matching table name wins, then a
 *     world-table fallback — see dcc/module/utilities.js `resolveCritTable`).
 *   - `dcc.setFumbleTable` → CONFIG.DCC.fumbleTable (a single pack path;
 *     `onSetFumbleTable` is first-write-wins unless `fromSystemSetting`).
 *
 * The two books ship identically-named tables — `Crit Table I`–`V`,
 * `Crit Table M`, and `Table 4-2: Fumbles` — so when both are active the
 * winner is decided purely by module load order. This module makes MCC the
 * authoritative source whenever `mcc-core-book` is active: it promotes the MCC
 * crit pack ahead of any others and force-points `CONFIG.DCC.fumbleTable` at
 * the MCC fumble table.
 *
 * Why REORDER rather than remove dcc-core-book's pack: dcc-core-book also
 * carries crit tables MCC has no equivalent for (`Crit Table DN`/`DR`/`G`/`U`
 * — Devils & Demons, Dragons, Giants, Un-dead). Keeping the DCC pack in the
 * list, just after MCC's, lets those resolve by fall-through while the
 * colliding names resolve to MCC. Removing it would strip the MCC-absent
 * tables.
 *
 * Enforcement runs once, deferred past the whole `dcc.ready` chain (so both
 * books have already broadcast) — see mcc-classes.js. It is gated on
 * mcc-core-book being active; with the book absent there is nothing MCC to
 * promote and the function is a no-op.
 */

/** The mcc-core-book compendium that holds the MCC crit + fumble tables. */
export const MCC_CRIT_FUMBLE_PACK = 'mcc-core-book.mcc-core-crits-and-fumbles'

/** Full DCC fumble-table path (`<module>.<pack>.<table name>`) for the MCC PC fumble table. */
export const MCC_FUMBLE_TABLE_PATH = `${MCC_CRIT_FUMBLE_PACK}.Table 4-2: Fumbles`

/**
 * Move `packName` to the front of a TablePackManager so it takes precedence in
 * `criticalHitPacks.packs` iteration, preserving every other entry (and its
 * `fromSystemConfig` flag) in their existing relative order.
 *
 * TablePackManager exposes only `packs` (insertion-ordered keys) and
 * add/removePack (both APPEND), so there is no public way to move an existing
 * entry forward. We rebuild the backing `_packs` object instead — its shape is
 * stable and identical to the copy this project ports verbatim
 * (table-pack-manager.js).
 *
 * @param {object} manager A TablePackManager (e.g. CONFIG.DCC.criticalHitPacks).
 * @param {string} packName The pack to promote to highest precedence.
 * @returns {boolean} true if the pack is present (already-first counts), false otherwise.
 */
export function promotePackToFront (manager, packName) {
  if (!manager || !packName) return false
  const keys = manager.packs
  const index = keys.indexOf(packName)
  if (index < 0) return false // not registered — nothing to promote
  if (index === 0) return true // already highest precedence

  const existing = manager._packs
  const reordered = { [packName]: existing[packName] }
  for (const key of keys) {
    if (key !== packName) reordered[key] = existing[key]
  }
  manager._packs = reordered
  return true
}

/**
 * Safely read a boolean world setting that belongs to another module: returns
 * false (rather than throwing) when the setting was never registered — e.g. an
 * older mcc-core-book build, or the book inactive.
 */
function isSettingEnabled (namespace, key) {
  const id = `${namespace}.${key}`
  if (!game.settings?.settings?.has?.(id)) return false
  try {
    return Boolean(game.settings.get(namespace, key))
  } catch {
    return false
  }
}

/**
 * Make MCC the authoritative crit/fumble source when `mcc-core-book` is active.
 * Idempotent and safe to run with dcc-core-book absent (the promote/override
 * just collapse to no-ops). Intended to run deferred at `dcc.ready`, after both
 * books have broadcast their registrations.
 */
export function enforceMccCritFumblePrecedence () {
  const coreBook = game.modules?.get('mcc-core-book')
  if (!coreBook?.active) return

  // Crits — promote MCC ahead of dcc-core-book. Self-gating: if mcc-core-book's
  // `registerCriticalHits` setting is off it never broadcast its pack, so the
  // pack is absent and `promotePackToFront` is a no-op.
  const promoted = promotePackToFront(CONFIG.DCC?.criticalHitPacks, MCC_CRIT_FUMBLE_PACK)
  if (promoted) {
    console.log(`MCC | crit tables: '${MCC_CRIT_FUMBLE_PACK}' promoted to highest precedence (overrides dcc-core-book; DCC-only crit tables still resolve by fall-through).`)
  }

  // Fumble — CONFIG.DCC.fumbleTable is a single path decided by first-write-wins,
  // so a load-order race can leave dcc-core-book's identically-named table in
  // place. Force MCC's whenever mcc-core-book opted in to registering it.
  if (isSettingEnabled('mcc-core-book', 'registerFumbleTable') && CONFIG.DCC) {
    if (CONFIG.DCC.fumbleTable !== MCC_FUMBLE_TABLE_PATH) {
      CONFIG.DCC.fumbleTable = MCC_FUMBLE_TABLE_PATH
      console.log(`MCC | fumble table: CONFIG.DCC.fumbleTable forced to '${MCC_FUMBLE_TABLE_PATH}' (overrides dcc-core-book).`)
    }
  }
}
