/**
 * MCC Shaman character sheet.
 *
 * Thin DCCSheet subclass — schema fields, parts/tabs, and first-open
 * identity defaults are registered through the DCC extension API in
 * `mcc-class-data.mjs`. This sheet keeps only its DEFAULT_OPTIONS and a
 * slim `_prepareContext` for the live data seeding/migrations.
 */

import { DCCSheet } from '/systems/dcc/module/actor-sheets-dcc.js'

/**
 * @extends {DCCSheet}
 */
class ActorSheetShaman extends DCCSheet {
    /** @inheritDoc */
    static DEFAULT_OPTIONS = {
        classes: ['dcc', 'sheet', 'actor', 'pc', 'shaman'],
        position: {
            height: 635,
            width: 583
        }
    }

    /** @inheritDoc */
    static CLASS_ID = 'shaman'

    /** @override */
    async _prepareContext(options) {
        const context = await super._prepareContext(options)
        const updates = {}

        // §9.1c: ensure the artifact check carries the INT binding. Patch existing
        // actors only.
        if (context.system.skills.artifactCheck && context.system.skills.artifactCheck.ability !== 'int') {
            updates['system.skills.artifactCheck.ability'] = 'int'
        }
        // Program Check label — shaman programs reuse the DCC spell-check slot.
        if (!context.system.class.spellCheck) {
            updates['system.class.spellCheck'] = {
                label: 'MCC.ProgramCheck',
                value: '+0'
            }
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
    ActorSheetShaman
}
