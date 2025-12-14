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
            height: 635,
            width: 583
        }
    }

    /** @inheritDoc */
    static CLASS_TABS = {
        sheet: {
            tabs: [
                { id: 'shaman', group: 'sheet', label: 'MCC.Shaman' },
                { id: 'spells', group: 'sheet', label: 'Shaman.Programs' },
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
        const updates = {}

        if (context.system.details.sheetClass !== 'Shaman') {
            updates['system.class.className'] = game.i18n.localize('MCC.Shaman')
            updates['system.config.showSkills'] = true
            updates['system.details.sheetClass'] = 'Shaman'
            updates['system.details.critRange'] = 20
            updates['system.class.spellCheckAbility'] = 'int'
        }

        // Add in shaman specific data if missing
        if (!context.system.class.aiPatron) {
            updates['system.class.aiPatron'] = {
                label: 'Shaman.AIPatron',
                value: ' '
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
        if (!context.system.skills.artifactCheck) {
            updates['system.skills.artifactCheck'] = {
                label: 'MCC.ArtifactCheck',
                value: '+0'
            }
        }
        if (!context.system.class.spellCheck) {
            updates['system.class.spellCheck'] = {
                label: 'MCC.ProgramCheck',
                value: '+0'
            }
        }
        if (!context.system.skills.maxTechLevel) {
            updates['system.skills.maxTechLevel'] = {
                label: 'MCC.MaxTechLevel',
                value: '0'
            }
        }

        if (Object.keys(updates).length) {
            this.actor.update(updates)
        }
        return context
    }
}

export {
    ActorSheetShaman
}
