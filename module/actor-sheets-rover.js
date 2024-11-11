/**
 * MCC Rover character sheet overrides
 */

import DCCActorSheet from '/systems/dcc/module/actor-sheet.js'

/**
 * Extend the zero-level/NPC sheet for MCC Rover
 * @extends {DCCActorSheet}
 */
class ActorSheetRover extends DCCActorSheet {
    static height = 635

    /** @override */
    async getData(options) {
        const data = await super.getData(options)
        this.options.template = 'modules/mcc-classes/templates/actor-sheet-rover.html'
        this.options.classes = ['dcc', 'sheet', 'actor', 'pc']
        if (data.system.details.sheetClass !== 'Rover') {
            this.actor.update({
                'system.class.className': game.i18n.localize('MCC.Rover')
            })
        }


        // Add in Rover specific data if missing
        if (!data.system.skills.doorsAndSecurity) {
            this.actor.update({
                'system.skills.doorsAndSecurity': {
                    label: 'Rover.DoorsAndSecurity',
                    value: '+1'
                }
            })
        }
        if (!data.system.skills.aiRecognition) {
            this.actor.update({
                'system.skills.aiRecognition': {
                    label: 'MCC.AIRecognition',
                    value: '+2'
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
        if (!data.system.skills.artifactCheck) {
            this.actor.update({
                'system.skills.artifactCheck': {
                    label: 'MCC.ArtifactCheck',
                    value: '+0'
                }
            })
        }
        if (!data.system.skills.roverMissleAttack) {
            this.actor.update({
                'system.skills.roverMissileAttack': {
                    label: 'Rover.RoverMissileAttack',
                    value: '+1'
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
    ActorSheetRover
}
