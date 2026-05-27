/* global game, Hooks */

import { MCC_TABLE_CATEGORIES } from './mcc-tables.mjs'

/**
 * Register the MCC content-table compendium overrides — one per category
 * (mutations / AI programs / artifacts / glowburn).
 *
 * Each lets a world point MCC roll support at a compendium pack of the user's
 * choosing: tables they built themselves, a third-party content pack, etc.,
 * with no dependency on `mcc-core-book`. A blank value (the default) means "no
 * override" — world RollTables matched by name and the `mcc-core-book`
 * broadcast still apply. `onChange` re-broadcasts the same `mcc.register*Pack`
 * hook the book uses (with `fromSystemSetting = true`), so the registry
 * updates live without a reload.
 *
 * These are free-text String settings rather than a compendium dropdown so
 * they can be registered at `init` (their values must be readable by
 * `dcc.ready`). DCC defers its equivalent settings to `ready` only to build a
 * dynamic dropdown; here the trade-off favors timing-safety and accepting any
 * pack id, e.g. `my-homebrew.my-mutation-tables`.
 */
export function registerMccContentSettings () {
  for (const cat of MCC_TABLE_CATEGORIES) {
    game.settings.register('mcc-classes', cat.setting, {
      name: cat.settingName,
      hint: cat.settingHint,
      scope: 'world',
      config: true,
      type: String,
      default: '',
      onChange: (value) => {
        Hooks.callAll(cat.hook, value, true)
      }
    })
  }
}
