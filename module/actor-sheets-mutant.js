/* global game */
/**
 * MCC Mutant character sheet.
 *
 * Thin DCCSheet subclass: schema fields, parts/tabs, and first-open
 * identity defaults are registered through the DCC extension API in
 * `mcc-class-data.mjs`. This sheet keeps only its DEFAULT_OPTIONS and a
 * slim `_prepareContext` for the §9.2 data migrations.
 */

import { DCCSheet } from '/systems/dcc/module/actor-sheets-dcc.js'

/**
 * @extends {DCCSheet}
 */
class ActorSheetMutant extends DCCSheet {
    /** @inheritDoc */
    static DEFAULT_OPTIONS = {
        classes: ['dcc', 'sheet', 'actor', 'pc', 'mutant'],
        position: {
            height: 635,
            width: 575
        }
    }

    /** @inheritDoc */
    static CLASS_ID = 'mutant'

    /** @override */
    async _prepareContext(options) {
        const context = await super._prepareContext(options)
        const updates = {}

        // §9.2a: Mutant Horror is an additive initiative die, not a flat bonus.
        // DCC recomputes system.attributes.init.value from agl.mod every prepare
        // (actor.js computeInitiative) and parseInt()s it, so the die can't live
        // there; instead we fold it into the init die formula (1d20+<die>), which
        // computeInitiative never touches and the init roll evaluates intact. The
        // bare die also lives in system.class.mutantHorror for a clean tab
        // display. Migrate existing actors off the old system.skills.mutantHorror.
        const horrorDie = context.system.class.mutantHorror?.value ??
            context.system.skills.mutantHorror?.value ?? '1d3'
        if (context.system.skills.mutantHorror) {
            updates['system.skills.-=mutantHorror'] = null
        }
        // Fold the horror die into the initiative die. Only set when init.die is
        // unset or still the plain '1d20' default, so we never clobber a value the
        // level-up flow wrote from level-data (e.g. '1d20+1d4+2' at higher levels).
        const initDie = context.system.attributes?.init?.die
        if (!initDie || initDie === '1d20') {
            updates['system.attributes.init.die'] = `1d20+${horrorDie}`
        }
        // Artifact check = 1d20 + INT mod + class bonus − CM per book Ch.7. The
        // `ability: 'int'` binding is what makes DCC's _resolveSkillCheck add the
        // INT mod (actor.js:1540). Patch existing actors without clobbering values.
        if (context.system.skills.artifactCheck && context.system.skills.artifactCheck.ability !== 'int') {
            updates['system.skills.artifactCheck.ability'] = 'int'
        }
        // §9.2b: maxTechLevel is a cap (which TL artifacts the class may attempt),
        // not a rollable check — it lives in system.class. Migrate existing actors
        // off the old skills location.
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
    ActorSheetMutant
}
