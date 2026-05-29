/* global game, Roll, ChatMessage, ui, CONFIG */

/**
 * MCC Healer character sheet.
 *
 * Thin DCCSheet subclass — schema fields, parts/tabs, and first-open
 * identity defaults are registered through the DCC extension API in
 * `mcc-class-data.mjs`. This sheet keeps its DEFAULT_OPTIONS, the
 * Naturopathy actions, and a slim `_prepareContext` for the §9.3a pool
 * seeding + §9.2 migration.
 */

import { DCCSheet } from '/systems/dcc/module/actor-sheets-dcc.js'

/**
 * @extends {DCCSheet}
 */
class ActorSheetHealer extends DCCSheet {
    /** @inheritDoc */
    static DEFAULT_OPTIONS = {
        classes: ['dcc', 'sheet', 'actor', 'pc', 'healer'],
        position: {
            height: 635
        },
        // §9.3a: Naturopathy is a per-day healing pool, not a d20 skill check, so
        // it gets its own handlers. ApplicationV2 deep-merges these with the base
        // actions, so the parent's rollSkillCheck etc. stay live.
        actions: {
            rollNaturopathy: this.#rollNaturopathy,
            resetNaturopathy: this.#resetNaturopathy
        }
    }

    /** @inheritDoc */
    static CLASS_ID = 'healer'

    // §9.3a: Healer Naturopathy healing die by class level (book Table 2-3),
    // indexed L1..L10. Uses-per-day is the simpler "2× class level" formula
    // (book Ch.2 "2x per day per level"). Both are emitted canonically by
    // mcc-core-book's mcc-class-level-data on create / level-up / import; this
    // table only reseeds legacy actors whose pool predates the structured shape.
    static NATUROPATHY_DICE = ['1d3', '1d4', '1d5', '1d6', '1d7', '1d8', '1d10', '1d12', '1d14', '1d16']

    /** @override */
    async _prepareContext(options) {
        const context = await super._prepareContext(options)
        const updates = {}

        // §9.3a: seed the Naturopathy pool from class level whenever it's
        // unpopulated (usesPerDay falsy). This both initializes new Healers and
        // migrates legacy actors off the old single-string `value` shape — the
        // strict skills SchemaField strips the unregistered `value` on load, so
        // it can't be read back; level + NATUROPATHY_DICE reconstruct the
        // canonical pool. Level-up / re-import later overwrite with the same
        // numbers from mcc-class-level-data, so this only fills the gap.
        const naturopathy = context.system.skills.naturopathy
        if (!naturopathy?.usesPerDay) {
            const level = Math.min(Math.max(parseInt(context.system.details.level?.value) || 1, 1), 10)
            updates['system.skills.naturopathy.label'] = 'Healer.Naturopathy'
            updates['system.skills.naturopathy.die'] = ActorSheetHealer.NATUROPATHY_DICE[level - 1]
            updates['system.skills.naturopathy.usesPerDay'] = level * 2
            updates['system.skills.naturopathy.usesRemaining'] = level * 2
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

    /**
     * Roll the Healer's Naturopathy natural healing (§9.3a). Rolls the per-level
     * healing die, decrements the daily-use counter, and posts a chat card whose
     * total is a `.damage-applyable` inline roll — DCC's system-level chat
     * context menu then offers "Apply Healing" (multiplier −1) on the controlled
     * tokens with no extra wiring. Refuses when the daily pool is exhausted.
     * @this {ActorSheetHealer}
     * @param {PointerEvent} event   The originating click event
     * @param {HTMLElement} target   The element carrying the [data-action]
     * @returns {Promise<void>}
     */
    static async #rollNaturopathy(event, target) {
        const actor = this.options.document
        const naturopathy = actor.system.skills.naturopathy
        const remaining = naturopathy?.usesRemaining ?? 0
        if (remaining <= 0) {
            ui.notifications.warn(game.i18n.localize('Healer.NaturopathyExhausted'))
            return
        }
        const roll = await new Roll(naturopathy.die || '1d3').evaluate()
        await actor.update({ 'system.skills.naturopathy.usesRemaining': remaining - 1 })
        // toAnchor with the damage-applyable class + data-damage is exactly what
        // DCC's applyChatCardDamage reads (systems/dcc/module/chat.js), so the
        // native "Apply Healing" context-menu entry works on this card.
        const healing = roll.toAnchor({ classes: ['damage-applyable'], dataset: { damage: roll.total } }).outerHTML
        const label = game.i18n.localize('Healer.Naturopathy')
        const uses = game.i18n.format('Healer.NaturopathyUses', {
            remaining: remaining - 1,
            perDay: naturopathy.usesPerDay ?? 0
        })
        await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            flavor: `${label} — ${uses}`,
            content: `<p>${game.i18n.format('Healer.NaturopathyHealing', { healing })}</p>`,
            rolls: [roll],
            sound: CONFIG.sounds.dice
        })
    }

    /**
     * Restore the Healer's Naturopathy uses to the full daily allotment (§9.3a).
     * DCC exposes no rest / new-day hook, so recovery is a manual button on the
     * Healer tab the player or judge clicks after a day's rest.
     * @this {ActorSheetHealer}
     * @param {PointerEvent} event   The originating click event
     * @param {HTMLElement} target   The element carrying the [data-action]
     * @returns {Promise<void>}
     */
    static async #resetNaturopathy(event, target) {
        const actor = this.options.document
        const perDay = actor.system.skills.naturopathy?.usesPerDay ?? 0
        await actor.update({ 'system.skills.naturopathy.usesRemaining': perDay })
        ui.notifications.info(game.i18n.format('Healer.NaturopathyResetDone', { perDay }))
    }
}

export {
    ActorSheetHealer
}
