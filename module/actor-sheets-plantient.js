/* global game, Roll, ChatMessage */

/**
 * MCC Plantient character sheet.
 *
 * Thin DCCSheet subclass — schema fields, parts/tabs, and first-open
 * identity defaults are registered through the DCC extension API in
 * `mcc-class-data.mjs`. This sheet keeps its DEFAULT_OPTIONS, the custom
 * Hide-in-Greenery action, and a slim `_prepareContext` for the live
 * data normalizations/migrations.
 */

import { DCCSheet } from '/systems/dcc/module/actor-sheets-dcc.js'

/**
 * @extends {DCCSheet}
 */
class ActorSheetPlantient extends DCCSheet {
    /** @inheritDoc */
    static DEFAULT_OPTIONS = {
        classes: ['dcc', 'sheet', 'actor', 'pc', 'plantient'],
        position: {
            height: 635,
            width: 595
        },
        // §9.2e: Hide in Greenery is a roll-under percentile check, not a d20
        // skill check, so it needs its own action handler. ApplicationV2 deep-
        // merges this with the base actions, so the parent's rollSkillCheck etc.
        // stay available.
        actions: {
            rollHideInGreenery: this.#rollHideInGreenery
        }
    }

    /** @inheritDoc */
    static CLASS_ID = 'plantient'

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
        // §9.1c: ensure the artifact check carries the INT binding. Patch existing
        // actors only.
        if (context.system.skills.artifactCheck && context.system.skills.artifactCheck.ability !== 'int') {
            updates['system.skills.artifactCheck.ability'] = 'int'
        }
        // §9.2e: Hide in Greenery stores a bare number (no '%') so the custom
        // handler can compare 1d100 against it. Migrate existing actors whose
        // value still carries the old '%' suffix.
        if (String(context.system.skills.hideInGreenery?.value ?? '').includes('%')) {
            updates['system.skills.hideInGreenery.value'] =
                String(context.system.skills.hideInGreenery.value).replace('%', '').trim()
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

    /**
     * Roll the Plantient "Hide in Greenery" percentile check (§9.2e, option A).
     * The book defines a flat percentage chance to hide by standing still in
     * outdoor settings (50% at L1, +5% per level to 95%) — a d% roll-under, not
     * a d20 skill check, so it has its own handler rather than rollSkillCheck.
     * @this {ActorSheetPlantient}
     * @param {PointerEvent} event   The originating click event
     * @param {HTMLElement} target   The element carrying the [data-action]
     * @returns {Promise<void>}
     */
    static async #rollHideInGreenery(event, target) {
        const actor = this.options.document
        const chance = parseInt(actor.system.skills.hideInGreenery?.value) || 0
        const roll = await new Roll('1d100').evaluate()
        const success = roll.total <= chance
        const label = game.i18n.localize('Plantient.HideInGreenery')
        const outcome = game.i18n.localize(success ? 'Plantient.Hidden' : 'Plantient.Spotted')
        await roll.toMessage({
            speaker: ChatMessage.getSpeaker({ actor }),
            flavor: `${label}: ${roll.total} vs ${chance}% — ${outcome}`
        })
    }
}

export {
    ActorSheetPlantient
}
