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
                { id: 'spells', group: 'sheet', label: 'DCC.Spells' },
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
        wizardSpells: {
            template: 'systems/dcc/templates/actor-partial-wizard-spells.html'
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
        if (context.system.details.sheetClass !== 'Rover') {
            this.actor.update({
                'system.class.className': game.i18n.localize('MCC.Rover'),
                'system.config.showSkills' : true
            })
        }


        // Add in Rover specific data if missing
        if (!context.system.skills.doorsAndSecurity) {
            this.actor.update({
                'system.skills.doorsAndSecurity': {
                    label: 'Rover.DoorsAndSecurity',
                    value: '+1'
                }
            })
        }
        if (!context.system.skills.aiRecognition) {
            this.actor.update({
                'system.skills.aiRecognition': {
                    label: 'MCC.AIRecognition',
                    value: '+2'
                }
            })
        }
        if (!context.system.class.archaicAlignment) {
            this.actor.update({
                'system.class.archaicAlignment': {
                    label: 'MCC.ArchaicAlignment',
                    value: 'Clan of Cog'
                }
            })
        }
        if (!context.system.skills.artifactCheck) {
            this.actor.update({
                'system.skills.artifactCheck': {
                    label: 'MCC.ArtifactCheck',
                    value: '+0'
                }
            })
        }
        if (!context.system.skills.roverMissleAttack) {
            this.actor.update({
                'system.skills.roverMissileAttack': {
                    label: 'Rover.RoverMissileAttack',
                    value: '+1'
                }
            })
        }
        if (!context.system.skills.maxTechLevel) {
            this.actor.update({
                'system.skills.maxTechLevel': {
                    label: 'MCC.MaxTechLevel',
                    value: '0'
                }
            })
        }
        return context
    }
}

export {
    ActorSheetRover
}
