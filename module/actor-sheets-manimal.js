/**
 * MCC Manimal character sheet.
 *
 * Thin DCCSheet subclass — schema fields, parts/tabs, and first-open
 * identity defaults are registered through the DCC extension API in
 * `mcc-class-data.mjs`. This sheet keeps only its DEFAULT_OPTIONS and a
 * slim `_prepareContext` for the live data normalizations/migrations.
 */

import { DCCSheet } from '/systems/dcc/module/actor-sheets-dcc.js'

/**
 * @extends {DCCSheet}
 */
class ActorSheetManimal extends DCCSheet {
    /** @inheritDoc */
    static DEFAULT_OPTIONS = {
        classes: ['dcc', 'sheet', 'actor', 'pc', 'manimal'],
        position: {
            height: 635
        }
    }

    /** @inheritDoc */
    static CLASS_ID = 'manimal'

    /** @override */
    async _prepareContext(options) {
        const context = await super._prepareContext(options)
        const updates = {}

        // spellCheckAbility is '' (scalar empty string) per book Ch.3: a mutation
        // check is action die + class level only, with no ability mod. DCC's
        // computeSpellCheck suppresses the ability mod when this is falsy.
        if (context.system.class.spellCheckAbility !== '') {
            updates['system.class.spellCheckAbility'] = ''
        }
        // §9.1c: ensure the artifact check carries the INT binding so DCC's
        // _resolveSkillCheck adds the INT mod. Patch existing actors only.
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
    ActorSheetManimal
}
