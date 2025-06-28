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
        }
    }

    /** @inheritDoc */
    static TABS = {
        sheet: {
            tabs: [
                { id: 'character', group: 'sheet', label: 'DCC.Character' },
                { id: 'equipment', group: 'sheet', label: 'DCC.Equipment' },
                { id: 'healer', group: 'sheet', label: 'MCC.Healer' },
                { id: 'spells', group: 'sheet', label: 'DCC.Spells' },
                { id: 'skills', group: 'sheet', label: 'DCC.Skills' },
                { id: 'notes', group: 'sheet', label: 'DCC.Notes' }
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
        spells: {
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
        if (context.system.details.sheetClass !== 'Healer') {
            this.actor.update({
                'system.class.className': game.i18n.localize('MCC.Healer')
            })
        }

        // Add in Healer specific data if missing
        if (!context.system.skills.naturopathy) {
            this.actor.update({
                'system.skills.naturopathy': {
                    label: 'Healer.Naturopathy',
                    value: '1d3 x2'
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
    ActorSheetHealer
}
