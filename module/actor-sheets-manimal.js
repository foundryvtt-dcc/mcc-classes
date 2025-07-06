/**
 * MCC Manimal character sheet overrides
 */

import DCCActorSheet from '/systems/dcc/module/actor-sheet.js'

/**
 * Extend the DCC actor sheet for MCC Manimal
 * @extends {DCCActorSheet}
 */
class ActorSheetManimal extends DCCActorSheet {
    /** @inheritDoc */
    static DEFAULT_OPTIONS = {
        classes: ['dcc', 'sheet', 'actor', 'pc', 'manimal'],
        position: {
            height: 635
        }
    }

    /** @inheritDoc */
    static CLASS_TABS = {
        sheet: {
            tabs: [
                { id: 'manimal', group: 'sheet', label: 'MCC.Manimal' },
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
        manimal: {
            template: 'modules/mcc-classes/templates/actor-partial-manimal.html'
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

        if (context.system.details.sheetClass !== 'Manimal') {
            this.actor.update({
                'system.class.className': game.i18n.localize('MCC.Manimal'),
                'system.config.showSkills' : true
            })
        }

        // Add in Manimal specific data if missing
        if (!context.system.class.spellCheckAbility) {
            this.actor.update({
                'system.class.spellCheckAbility': {
                    label: 'Manimal.spellCheckAbility',
                    value: 'Int'
                }
            })
        }
        if (!context.system.skills.aiRecognition) {
            this.actor.update({
                'system.skills.aiRecognition': {
                    label: 'MCC.AIRecognition',
                    value: '-4'
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
        if (!context.system.class.manimalSubType) {
            this.actor.update({
                'system.class.manimalSubType': {
                    label: 'MCC.ManimalSubType',
                    value: ''
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
    ActorSheetManimal
}
