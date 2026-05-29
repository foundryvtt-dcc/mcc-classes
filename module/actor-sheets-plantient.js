/* global game, Roll, ChatMessage */

/**
 * MCC Plantient character sheet overrides
 */

import DCCActorSheet from '/systems/dcc/module/actor-sheet.js'

/**
 * Extend the DCC actor sheet for MCC Plantient
 * @extends {DCCActorSheet}
 */
class ActorSheetPlantient extends DCCActorSheet {
    /** @inheritDoc */
    static DEFAULT_OPTIONS = {
        classes: ['dcc', 'sheet', 'actor', 'pc', 'plantient'],
        position: {
            height: 635,
            width: 595,
        },
        // §9.2e: Hide in Greenery is a roll-under percentile check, not a d20
        // skill check, so it needs its own action handler. ApplicationV2 deep-
        // merges this with DCCActorSheet's actions, so the parent's rollSkillCheck
        // etc. stay available.
        actions: {
            rollHideInGreenery: this.#rollHideInGreenery
        }
    }

    /** @inheritDoc */
    static CLASS_TABS = {
        sheet: {
            tabs: [
                { id: 'plantient', group: 'sheet', label: 'MCC.Plantient' },
                { id: 'spells', group: 'sheet', label: 'MCC.Mutations' },
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
        plantient: {
            template: 'modules/mcc-classes/templates/actor-partial-plantient.html'
        },
        spells: {
            template: 'modules/mcc-classes/templates/actor-partial-mutations.html'
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

        if (context.system.details.sheetClass !== 'Plantient') {
            updates['system.class.className'] = game.i18n.localize('MCC.Plantient')
            updates['system.config.showSkills'] = true
            updates['system.details.sheetClass'] = 'Plantient'
            updates['system.details.critRange'] = 20
        }

        // Add in Plantient specific data if missing.
        // spellCheckAbility is '' (scalar empty string) per book Ch.3: a mutation
        // check is action die + class level only, with no ability mod. DCC's
        // computeSpellCheck (systems/dcc/module/actor.js) suppresses the ability
        // mod when this is falsy. Matches the Mutant sheet's pattern.
        if (context.system.class.spellCheckAbility !== '') {
            updates['system.class.spellCheckAbility'] = ''
        }
        if (!context.system.skills.aiRecognition) {
            updates['system.skills.aiRecognition'] = {
                label: 'MCC.AIRecognition',
                value: '-'
            }
        }
        if (!context.system.class.archaicAlignment) {
            updates['system.class.archaicAlignment'] = {
                label: 'MCC.ArchaicAlignment',
                value: 'Clan of Cog'
            }
        }
        if (!context.system.class.plantientSubType) {
            updates['system.class.plantientSubType'] = {
                label: 'MCC.PlantientSubType',
                value: ''
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
        // §9.2e: Hide in Greenery is a percentile (roll-under) chance — 50% at
        // L1, +5%/level to 95%. Store the bare number (no '%') so the custom
        // rollHideInGreenery handler can compare 1d100 against it. Migrate
        // existing actors whose value still carries the old '%' suffix.
        if (!context.system.skills.hideInGreenery) {
            updates['system.skills.hideInGreenery'] = {
                label: 'Plantient.HideInGreenery',
                value: '50'
            }
        } else if (String(context.system.skills.hideInGreenery.value).includes('%')) {
            updates['system.skills.hideInGreenery.value'] =
                String(context.system.skills.hideInGreenery.value).replace('%', '').trim()
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
