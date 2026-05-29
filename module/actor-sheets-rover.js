/**
 * MCC Rover character sheet overrides
 */

import DCCActorSheet from '/systems/dcc/module/actor-sheet.js'

/**
 * Extend the DCC actor sheet for MCC Rover
 * @extends {DCCActorSheet}
 */
class ActorSheetRover extends DCCActorSheet {
    /** @inheritDoc */
    static DEFAULT_OPTIONS = {
        classes: ['dcc', 'sheet', 'actor', 'pc', 'rover'],
        position: {
            height: 635
        }
    }

    /** @inheritDoc */
    static CLASS_TABS = {
        sheet: {
            tabs: [
                { id: 'rover', group: 'sheet', label: 'MCC.Rover' },
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
        rover: {
            template: 'modules/mcc-classes/templates/actor-partial-rover.html'
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

        if (context.system.details.sheetClass !== 'Rover') {
            updates['system.class.className'] = game.i18n.localize('MCC.Rover')
            updates['system.config.showSkills'] = true
            updates['system.details.sheetClass'] = 'Rover'
            updates['system.details.critRange'] = 20
        }

        // Add in Rover specific data if missing
        if (!context.system.skills.doorsAndSecurity) {
            updates['system.skills.doorsAndSecurity'] = {
                label: 'Rover.DoorsAndSecurity',
                value: '+1'
            }
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
        // §9.2d: removed the invented `roverMissileAttack` skill. The book's
        // Rover ability list (Ch.1/Ch.2) has no missile-attack entry — the
        // missile bonus is already the missile half of
        // system.details.attackBonus ('+0/+1'), so this was a phantom skill
        // redundant with the standard attack bonus. (The Plantient is the class
        // with a book-defined natural missile attack, not the Rover.) Migrate it
        // off existing actors.
        if (context.system.skills.roverMissileAttack) {
            updates['system.skills.-=roverMissileAttack'] = null
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
}

export {
    ActorSheetRover
}
