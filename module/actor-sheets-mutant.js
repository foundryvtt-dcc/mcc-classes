/**
 * MCC Mutant character sheet overrides
 */

import DCCActorSheet from '/systems/dcc/module/actor-sheet.js'

/**
 * Extend the zero-level/NPC sheet for MCC Mutant
 * @extends {DCCActorSheet}
 */
class ActorSheetMutant extends DCCActorSheet {
    static height = 635

    /** @override */
    async getData(options) {
        const data = await super.getData(options)
        this.options.template = 'modules/mcc-classes/templates/actor-sheet-Mutant.html'
        if (data.system.details.sheetClass !== 'Mutant') {
            this.actor.update({
                'system.class.className': game.i18n.localize('MCC.Mutant')
            })
        }

        // Add in Mutant specific data if missing
        if (!data.system.skills.mutantHorror) {
            this.actor.update({
                'system.skills.mutantHorror': {
                    label: 'Mutant.MutantHorror',
                    value: '1d3'
                }
            })
        }
        if (!data.system.skills.aiRecognition) {
            this.actor.update({
                'system.skills.aiRecognition': {
                    label: 'MCC.AIRecognition',
                    value: '0'
                }
            })
        }
        if (!data.system.class.archaicAlignment) {
            this.actor.update({
                'system.class.archaicAlignment': {
                    label: 'MCC.ArchaicAlignment',
                    value: 'Clan of Cog'
                }
            })
        }
        if (!data.system.class.mutantAppearance) {
            this.actor.update({
                'system.class.mutantAppearance': {
                    label: 'MCC.MutantAppearance',
                    value: ''
                }
            })
        }
        if (!data.system.skills.artifactCheck) {
            this.actor.update({
                'system.skills.artifactCheck': {
                    label: 'MCC.ArtifactCheck',
                    value: '+0'
                }
            })
        }
        if (!data.system.skills.maxTechLevel) {
            this.actor.update({
                'system.skills.maxTechLevel': {
                    label: 'MCC.MaxTechLevel',
                    value: '0'
                }
            })
        }
        return data
    }
}

export {
    ActorSheetMutant
}
