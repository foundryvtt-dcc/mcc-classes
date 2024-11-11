/**
 * MCC shaman character sheet overrides
 */

import DCCActorSheet from '/systems/dcc/module/actor-sheet.js'

/**
 * Extend the zero-level/NPC sheet for MCC Shaman
 * @extends {DCCActorSheet}
 */
class ActorSheetShaman extends DCCActorSheet {
    static height = 635

    /** @override */
    /**  getData () {
     const data = super.getData() **/
    async getData(options) {
        const data = await super.getData(options)
        this.options.template = 'modules/mcc-classes/templates/actor-sheet-shaman.html'
        this.options.classes = ['dcc', 'sheet', 'actor', 'pc']
        if (data.system.details.sheetClass !== 'Shaman') {
            this.actor.update({
                'system.class.className': game.i18n.localize('MCC.Shaman')
            })
        }

        // Add in shaman specific data if missing
        if (!data.system.class.aiPatron) {
            this.actor.update({
                'system.class.aiPatron': {
                    label: 'Shaman.AIPatron',
                    value: ' '
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
        if (!data.system.class.spellCheck) {
            this.actor.update({
                'system.class.spellCheck': {
                    label: 'MCC.ProgramCheck',
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
    ActorSheetShaman
}
