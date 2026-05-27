/* global CONFIG, Hooks, game, console */

import TablePackManager from './table-pack-manager.js'

/**
 * MCC content table-pack consumer.
 *
 * `mcc-core-book` broadcasts four forward-looking hooks inside its own
 * `dcc.ready` handler — `mcc.registerMutationTablesPack`,
 * `mcc.registerAIProgramTablesPack`, `mcc.registerArtifactTablesPack`,
 * `mcc.registerGlowburnPack` — mirroring the way `dcc-core-book` feeds the DCC
 * system's `dcc.register*Pack` hooks. This module is the listener half: it
 * stores the registered pack names on `CONFIG.MCC.*Packs` so MCC roll support
 * can resolve mutation / wetware-program / artifact / glowburn tables.
 *
 * The book is sufficient but never required. A pack name can equally come
 * from an mcc-classes world setting (see `settings.js`) or any homebrew module
 * that calls the same hook, and `resolveMccTable` checks world RollTables
 * first — so a judge can build the tables themselves, name them, and have them
 * work with no compendium at all. This mirrors DCC's
 * `settings-table-hooks.mjs` + `table-loading.mjs` + `utilities.js` trio.
 */

/**
 * Single source of truth for the four content-table categories. `hook` is the
 * broadcast each registry listens for; `registryKey` is its slot on
 * `CONFIG.MCC`; `setting`/`settingName`/`settingHint` describe the world
 * setting that lets a user point at their own compendium.
 */
export const MCC_TABLE_CATEGORIES = Object.freeze([
  {
    hook: 'mcc.registerMutationTablesPack',
    registryKey: 'mutationTablePacks',
    setting: 'mutationTablesCompendium',
    settingName: 'MCC.SettingMutationTablesCompendium',
    settingHint: 'MCC.SettingMutationTablesCompendiumHint'
  },
  {
    hook: 'mcc.registerAIProgramTablesPack',
    registryKey: 'aiProgramTablePacks',
    setting: 'aiProgramTablesCompendium',
    settingName: 'MCC.SettingAIProgramTablesCompendium',
    settingHint: 'MCC.SettingAIProgramTablesCompendiumHint'
  },
  {
    hook: 'mcc.registerArtifactTablesPack',
    registryKey: 'artifactTablePacks',
    setting: 'artifactTablesCompendium',
    settingName: 'MCC.SettingArtifactTablesCompendium',
    settingHint: 'MCC.SettingArtifactTablesCompendiumHint'
  },
  {
    hook: 'mcc.registerGlowburnPack',
    registryKey: 'glowburnPacks',
    setting: 'glowburnCompendium',
    settingName: 'MCC.SettingGlowburnCompendium',
    settingHint: 'MCC.SettingGlowburnCompendiumHint'
  },
  {
    hook: 'mcc.registerPatronTaintPack',
    registryKey: 'patronTaintPacks',
    setting: 'patronTaintCompendium',
    settingName: 'MCC.SettingPatronTaintCompendium',
    settingHint: 'MCC.SettingPatronTaintCompendiumHint'
  }
])

/**
 * Ensure `CONFIG.MCC[registryKey]` is a live TablePackManager and return it.
 */
function ensureRegistry (registryKey) {
  CONFIG.MCC ??= {}
  if (!CONFIG.MCC[registryKey]) {
    CONFIG.MCC[registryKey] = new TablePackManager()
  }
  return CONFIG.MCC[registryKey]
}

/**
 * Build the `mcc.register*Pack` handler for one registry. Exported as a map
 * (`MCC_TABLE_HOOKS`) so unit tests can invoke handlers as plain functions,
 * exactly like DCC's `SETTINGS_TABLE_HOOKS`.
 */
function makeHandler (registryKey) {
  return function (value, fromSystemSetting = false) {
    ensureRegistry(registryKey).addPack(value, fromSystemSetting)
  }
}

export const MCC_TABLE_HOOKS = Object.freeze(
  Object.fromEntries(
    MCC_TABLE_CATEGORIES.map((cat) => [cat.hook, makeHandler(cat.registryKey)])
  )
)

/**
 * Wire the `mcc.register*Pack` listeners. MUST run at `init`: `mcc-core-book`
 * broadcasts during `dcc.ready`, so the listeners — and the registries they
 * feed — have to exist beforehand. Creating the (empty) registries up front
 * also means `resolveMccTable` works even when nothing is ever registered: it
 * simply falls through to world RollTables.
 */
export function registerMccTableHooks () {
  for (const cat of MCC_TABLE_CATEGORIES) {
    ensureRegistry(cat.registryKey)
  }
  for (const [hookName, handler] of Object.entries(MCC_TABLE_HOOKS)) {
    Hooks.on(hookName, handler)
  }
}

/**
 * Seed each registry from its world setting. Run once at `dcc.ready` (after
 * settings values are loaded). `fromSystemSetting = true` so a user-configured
 * compendium takes the single "config" slot in the manager, matching DCC's
 * `table-loading.mjs` seeding. Idempotent and order-independent relative to
 * the `mcc-core-book` broadcast — both simply `addPack` into the same
 * registries.
 */
export function seedMccTablePacksFromSettings () {
  for (const cat of MCC_TABLE_CATEGORIES) {
    const value = game.settings.get('mcc-classes', cat.setting)
    if (value) {
      ensureRegistry(cat.registryKey).addPack(value, true)
    }
  }
}

/**
 * Resolve a RollTable by exact name, world-tables-first then registered
 * compendium packs — the same precedence DCC uses (see
 * `dcc/module/utilities.js`). This is the lookup primitive the future
 * mutation / wetware-program / artifact / glowburn roll handlers will call; it
 * is deliberately roll-agnostic — it returns the table document and draws
 * nothing.
 *
 * Precedence is what makes "build it yourself" work without `mcc-core-book`:
 *   1. A world RollTable whose name matches wins outright — a judge can supply
 *      or override any table with no compendium installed.
 *   2. Otherwise the first registered compendium pack containing a table of
 *      that name (packs come from the book broadcast, the mcc-classes
 *      compendium settings, or a homebrew module's own broadcast).
 *
 * @param {TablePackManager} packManager One of the `CONFIG.MCC.*Packs` registries.
 * @param {string} tableName Exact RollTable name to find.
 * @returns {Promise<object|null>} The RollTable document, or null when unresolved.
 */
export async function resolveMccTable (packManager, tableName) {
  if (!tableName) return null

  // 1. World tables win — lets a judge build/override tables with no pack.
  const worldTable = game.tables?.find((table) => table.name === tableName)
  if (worldTable) return worldTable

  // 2. Registered compendium packs, in registration order.
  if (!packManager) return null
  for (const packName of packManager.packs) {
    const pack = game.packs?.get(packName)
    if (!pack || pack.documentName !== 'RollTable') continue
    const entry = pack.index.find((e) => e.name === tableName)
    if (entry) return pack.getDocument(entry._id)
  }
  return null
}

/**
 * `ready`-time diagnostic. Confirms the end-to-end wiring (book broadcast →
 * listener → registry) and tells a judge running without the book that MCC
 * rolls will resolve only against world tables / a configured compendium.
 */
export function reportMccCoreBookStatus () {
  const coreBook = game.modules.get('mcc-core-book')

  if (!coreBook?.active) {
    console.log(
      'MCC | mcc-core-book not active — table integrations idle. Class sheets ' +
      'still function; mutation/program/artifact/glowburn rolls resolve only ' +
      'against world RollTables or a compendium named in module settings.'
    )
    return
  }

  const counts = {}
  let total = 0
  for (const cat of MCC_TABLE_CATEGORIES) {
    const registered = CONFIG.MCC?.[cat.registryKey]?.packs.length ?? 0
    counts[cat.registryKey] = registered
    total += registered
  }
  console.log('MCC | mcc-core-book active — registered table packs:', counts)

  if (total === 0) {
    console.warn(
      'MCC | mcc-core-book is active but registered no MCC table packs. Check ' +
      'its content-registration settings (registerMutationTables, ' +
      'registerAIProgramTables, registerArtifactTables, registerGlowburn).'
    )
  }
}
