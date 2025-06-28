/**
 * MCC shaman character sheet overrides
 */

import DCCActorSheet from '/systems/dcc/module/actor-sheet.js'

/**
 * Extend the DCC actor sheet for MCC Shaman
 * @extends {DCCActorSheet}
 */
class ActorSheetShaman extends DCCActorSheet {
    /** @inheritDoc */
    static DEFAULT_OPTIONS = {
        classes: ['dcc', 'sheet', 'actor', 'pc', 'shaman'],
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
                { id: 'shaman', group: 'sheet', label: 'MCC.Shaman' },
                { id: 'spells', group: 'sheet', label: 'Shaman.Programs' },
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
        shaman: {
            template: 'modules/mcc-classes/templates/actor-partial-shaman.html'
        },
        spells: {
            template: 'modules/mcc-classes/templates/actor-partial-shaman-programs.html'
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
        if (context.system.details.sheetClass !== 'Shaman') {
            this.actor.update({
                'system.class.className': game.i18n.localize('MCC.Shaman')
            })
        }

        // Add in shaman specific data if missing
        if (!context.system.class.aiPatron) {
            this.actor.update({
                'system.class.aiPatron': {
                    label: 'Shaman.AIPatron',
                    value: ' '
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
        if (!context.system.class.spellCheck) {
            this.actor.update({
                'system.class.spellCheck': {
                    label: 'MCC.ProgramCheck',
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
    ActorSheetShaman
}
