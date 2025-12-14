/**
 * MCC Mutant character sheet overrides
 */

import DCCActorSheet from '/systems/dcc/module/actor-sheet.js'

/**
 * Extend the DCC actor sheet for MCC Mutant
 * @extends {DCCActorSheet}
 */
class ActorSheetMutant extends DCCActorSheet {
    /** @inheritDoc */
    static DEFAULT_OPTIONS = {
        classes: ['dcc', 'sheet', 'actor', 'pc', 'mutant'],
        position: {
            height: 635,
            width: 575
        }
    }

    /** @inheritDoc */
    static CLASS_TABS = {
        sheet: {
            tabs: [
                { id: 'mutant', group: 'sheet', label: 'MCC.Mutant' },
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
        mutant: {
            template: 'modules/mcc-classes/templates/actor-partial-mutant.html'
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

        if (context.system.details.sheetClass !== 'Mutant') {
            updates['system.class.className'] = game.i18n.localize('MCC.Mutant')
            updates['system.config.showSkills'] = true
            updates['system.details.sheetClass'] = 'Mutant'
            updates['system.details.critRange'] = 20
            updates['system.class.spellCheckAbility'] = ''
        }

        // Add in Mutant specific data if missing
        if (!context.system.skills.mutantHorror) {
            updates['system.skills.mutantHorror'] = {
                label: 'Mutant.MutantHorror',
                value: '1d3'
            }
        }
        if (!context.system.skills.aiRecognition) {
            updates['system.skills.aiRecognition'] = {
                label: 'MCC.AIRecognition',
                value: '0'
            }
        }
        if (!context.system.class.archaicAlignment) {
            updates['system.class.archaicAlignment'] = {
                label: 'MCC.ArchaicAlignment',
                value: 'Clan of Cog'
            }
        }
        if (!context.system.class.mutantAppearance) {
            updates['system.class.mutantAppearance'] = {
                label: 'MCC.MutantAppearance',
                value: ''
            }
        }
        if (!context.system.skills.artifactCheck) {
            updates['system.skills.artifactCheck'] = {
                label: 'MCC.ArtifactCheck',
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
    ActorSheetMutant
}
