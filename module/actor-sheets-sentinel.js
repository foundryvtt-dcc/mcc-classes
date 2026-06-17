/**
 * MCC Sentinel character sheet.
 *
 * Thin DCCSheet subclass — schema fields, parts/tabs, and first-open
 * identity defaults are registered through the DCC extension API in
 * `mcc-class-data.mjs`. This sheet keeps only its DEFAULT_OPTIONS and a
 * slim `_prepareContext` for the §9.2 data migrations.
 */

import { DCCSheet } from '/systems/dcc/module/actor-sheets-dcc.js'

/**
 * @extends {DCCSheet}
 */
class ActorSheetSentinel extends DCCSheet {
    /** @inheritDoc */
    static DEFAULT_OPTIONS = {
        classes: ['dcc', 'sheet', 'actor', 'pc', 'sentinel'],
        position: {
            height: 635
        }
    }

    /** @inheritDoc */
    static CLASS_ID = 'sentinel'

    /** @override */
    async _prepareContext(options) {
        const context = await super._prepareContext(options)
        const updates = {}

        // §9.2c: artifactDie is a modifier die (class metadata), not a rollable
        // skill — it lives in system.class. Migrate existing actors that still
        // carry the old system.skills.artifactDie.
        if (context.system.skills.artifactDie) {
            updates['system.skills.-=artifactDie'] = null
        }
        // §9.1c: ensure the artifact check carries the INT binding. Patch existing
        // actors only.
        if (context.system.skills.artifactCheck && context.system.skills.artifactCheck.ability !== 'int') {
            updates['system.skills.artifactCheck.ability'] = 'int'
        }
        // §9.2b: migrate existing actors off the old system.skills.maxTechLevel.
        if (context.system.skills.maxTechLevel) {
            updates['system.skills.-=maxTechLevel'] = null
        }

        if (Object.keys(updates).length) {
            this.actor.update(updates)
        }
        return context
    }
}

export {
    ActorSheetSentinel
}
