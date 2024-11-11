/**
 * MCC Plantient character sheet overrides
 */

import DCCActorSheet from '/systems/dcc/module/actor-sheet.js'

/**
 * Extend the zero-level/NPC sheet for MCC Plantient
 * @extends {DCCActorSheet}
 */
class ActorSheetPlantient extends DCCActorSheet {
    static height = 635

    /** @override */
    async getData(options) {
        const data = await super.getData(options)
        this.options.template = 'modules/mcc-classes/templates/actor-sheet-plantient.html'
        this.options.classes = ['dcc', 'sheet', 'actor', 'pc']
        if (data.system.details.sheetClass !== 'Plantient') {
            this.actor.update({
                'system.class.className': game.i18n.localize('MCC.Plantient')
            })
        }


        // Add in Plantient specific data if missing
        if (!data.system.class.spellCheckAbility) {
            this.actor.update({
                'system.class.spellCheckAbility': {
                    label: 'Plantient.spellCheckAbility',
                    value: 'Int'
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
        if (!data.system.class.plantientSubType) {
            this.actor.update({
                'system.class.plantientSubType': {
                    label: 'MCC.PlantientSubType',
                    value: ''
                }
            })
        }

        if (!data.system.skills.artifactCheck) {
            this.actor.update({
                'system.skills.artifactCheck': {
                    label: 'Plantient.ArtifactCheck',
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
    ActorSheetPlantient
}
