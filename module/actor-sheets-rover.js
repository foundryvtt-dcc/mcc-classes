/**
 * MCC Rover character sheet.
 *
 * Thin DCCSheet subclass — schema fields, parts/tabs, and first-open
 * identity defaults are registered through the DCC extension API in
 * `mcc-class-data.mjs`. This sheet keeps only its DEFAULT_OPTIONS and a
 * slim `_prepareContext` for the §9.2 data migrations.
 */

import { DCCSheet } from '/systems/dcc/module/actor-sheets-dcc.js'
import { roverAttackBonusUpdates } from './rover-attack-bonus.mjs'

/**
 * @extends {DCCSheet}
 */
class ActorSheetRover extends DCCSheet {
    /** @inheritDoc */
    static DEFAULT_OPTIONS = {
        classes: ['dcc', 'sheet', 'actor', 'pc', 'rover'],
        position: {
            height: 635
        }
    }

    /** @inheritDoc */
    static CLASS_ID = 'rover'

    /** @override */
    async _prepareContext(options) {
        const context = await super._prepareContext(options)
        const updates = {}

        // §9.1c: ensure the artifact check carries the INT binding. Patch existing
        // actors only.
        if (context.system.skills.artifactCheck && context.system.skills.artifactCheck.ability !== 'int') {
            updates['system.skills.artifactCheck.ability'] = 'int'
        }
        // §9.2d: removed the invented `roverMissileAttack` skill — the class's
        // missile bonus comes from level data. Migrate it off existing actors.
        if (context.system.skills.roverMissileAttack) {
            updates['system.skills.-=roverMissileAttack'] = null
        }
        // §9.2b: migrate existing actors off the old system.skills.maxTechLevel.
        if (context.system.skills.maxTechLevel) {
            updates['system.skills.-=maxTechLevel'] = null
        }

        Object.assign(updates, roverAttackBonusUpdates(this.actor._source.system.details))

        if (Object.keys(updates).length && this.actor.isOwner) {
            this.actor.update(updates)
        }
        return context
    }
}

export {
    ActorSheetRover
}
