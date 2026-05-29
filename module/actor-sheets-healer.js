/* global game, Roll, ChatMessage, ui, CONFIG */

/**
 * MCC Healer character sheet overrides
 */

import DCCActorSheet from '/systems/dcc/module/actor-sheet.js'

/**
 * Extend the DCC actor sheet for MCC Healer
 * @extends {DCCActorSheet}
 */
class ActorSheetHealer extends DCCActorSheet {
    /** @inheritDoc */
    static DEFAULT_OPTIONS = {
        classes: ['dcc', 'sheet', 'actor', 'pc', 'healer'],
        position: {
            height: 635
        },
        // §9.3a: Naturopathy is a per-day healing pool, not a d20 skill check, so
        // it gets its own handlers. ApplicationV2 deep-merges these with
        // DCCActorSheet's actions, so the parent's rollSkillCheck etc. stay live.
        actions: {
            rollNaturopathy: this.#rollNaturopathy,
            resetNaturopathy: this.#resetNaturopathy
        }
    }

    // §9.3a: Healer Naturopathy healing die by class level (book Table 2-3),
    // indexed L1..L10. Uses-per-day is the simpler "2× class level" formula
    // (book Ch.2 "2x per day per level"). Both are emitted canonically by
    // mcc-core-book's mcc-class-level-data on create / level-up / import; this
    // table only reseeds legacy actors whose pool predates the structured shape
    // (the old single-string `value` has no schema slot, so it can't be read
    // back to migrate — level + this table fully reconstruct the canonical pool).
    static NATUROPATHY_DICE = ['1d3', '1d4', '1d5', '1d6', '1d7', '1d8', '1d10', '1d12', '1d14', '1d16']

    /** @inheritDoc */
    static CLASS_TABS = {
        sheet: {
            tabs: [
                { id: 'healer', group: 'sheet', label: 'MCC.Healer' },
                { id: 'skills', group: 'sheet', label: 'DCC.Skills' }
            ],
            initial: 'character'
        }
    }

    /** @inheritDoc */
    static PARTS = {
        tabs: {
            template: 'systems/dcc/templates/actor-partial-tabs.html'
        },
        character: {
            template: 'systems/dcc/templates/actor-partial-pc-common.html'
        },
        equipment: {
            template: 'systems/dcc/templates/actor-partial-pc-equipment.html'
        },
        healer: {
            template: 'modules/mcc-classes/templates/actor-partial-healer.html'
        },
        skills: {
            template: 'systems/dcc/templates/actor-partial-skills.html'
        },
        notes: {
            template: 'systems/dcc/templates/actor-partial-pc-notes.html'
        }
    }

    /** @override */
    async _prepareContext(options) {
        const context = await super._prepareContext(options)
        const updates = {}

        if (context.system.details.sheetClass !== 'Healer') {
            updates['system.class.className'] = game.i18n.localize('MCC.Healer')
            updates['system.config.showSkills'] = true
            updates['system.details.sheetClass'] = 'Healer'
            updates['system.details.critRange'] = 20
        }
        // Healers have no caster mechanic per book Ch.2 — Naturopathy is a skill,
        // not a spell — so we deliberately do NOT assign spellCheckAbility here.
        // Existing actors created before §9.1b may still carry the vestigial
        // 'per' value; it's cosmetic (Healers never roll a spell check) and
        // gets cleared on any deliberate field reset.

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
        if (!context.system.skills.aiRecognition) {
            updates['system.skills.aiRecognition'] = {
                label: 'MCC.AIRecognition',
                value: '+2'
            }
        }
        if (!context.system.class.archaicAlignment) {
            updates['system.class.archaicAlignment'] = {
                label: 'MCC.ArchaicAlignment',
                value: 'Clan of Cog'
            }
        }
        // Artifact check = 1d20 + INT mod + class bonus − CM per book Ch.7. The
        // `ability: 'int'` binding is what makes DCC's _resolveSkillCheck add the
        // INT mod (actor.js:1540). New actors get the full default; existing
        // actors get .ability patched in without clobbering custom values.
        if (!context.system.skills.artifactCheck) {
            updates['system.skills.artifactCheck'] = {
                label: 'MCC.ArtifactCheck',
                value: '+0',
                ability: 'int'
            }
        } else if (context.system.skills.artifactCheck.ability !== 'int') {
            updates['system.skills.artifactCheck.ability'] = 'int'
        }
        // §9.2b: maxTechLevel is a cap (which TL artifacts the class may
        // attempt), not a rollable check — it belongs in system.class, not
        // system.skills. Migrate existing actors off the old skills location.
        if (!context.system.class.maxTechLevel) {
            updates['system.class.maxTechLevel'] = {
                label: 'MCC.MaxTechLevel',
                value: context.system.skills.maxTechLevel?.value ?? '0'
            }
        }
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
