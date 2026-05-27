/* global Object */

/*
 * Manage lists of compendium packs.
 *
 * Ported verbatim from the DCC system's `module/table-pack-manager.js` so the
 * MCC content registries (`CONFIG.MCC.*Packs`) behave identically to DCC's
 * (`CONFIG.DCC.*Packs`). A pack name can arrive from the mcc-core-book
 * `dcc.ready` broadcast, from an mcc-classes world setting, or from any
 * homebrew module that calls the same `mcc.register*Pack` hook — the manager
 * de-duplicates and keeps at most one "from system/world config" entry.
 */
class TablePackManager {
  constructor (options = {}) {
    this._packs = {}
    this._updateHook = options.updateHook
  }

  addPack (newPack, fromSystemConfig = false) {
    if (!newPack) {
      return
    }

    // There can only ever be one pack from the system config
    if (fromSystemConfig) {
      for (const key in this._packs) {
        const pack = this._packs[key]
        if (pack.fromSystemConfig) {
          delete this._packs[key]
        }
      }
    }

    // Add the new pack if not already present
    if (!this._packs[newPack]) {
      this._packs[newPack] = {
        key: newPack,
        fromSystemConfig
      }
    }

    // Update any listeners
    if (this._updateHook) {
      this._updateHook(this)
    }
  }

  removePack (packToRemove) {
    // Delete the pack
    delete this._packs[packToRemove]

    // Update any listeners
    if (this._updateHook) {
      this._updateHook(this)
    }
  }

  get packs () {
    return Object.keys(this._packs)
  }
}

export default TablePackManager
