/**
 * MCC Sentinel character sheet overrides
 */

import DCCActorSheet from '/systems/dcc/module/actor-sheet.js'

/**
 * Extend the DCC actor sheet for MCC Sentinel
 * @extends {DCCActorSheet}
 */
class ActorSheetSentinel extends DCCActorSheet {
    /** @inheritDoc */
    static DEFAULT_OPTIONS = {
        classes: ['dcc', 'sheet', 'actor', 'pc', 'sentinel'],
        position: {
            height: 635
        }
    }

    /** @inheritDoc */
    static PARTS = {
        form: {
            template: 'modules/mcc-classes/templates/actor-sheet-sentinel.html'
        }
    }

    /** @override */
    async _prepareContext(options) {
        const context = await super._prepareContext(options)
        if (context.system.details.sheetClass !== 'Sentinel') {
            this.actor.update({
                'system.class.className': game.i18n.localize('MCC.Sentinel')
            })
        }

        // Add in Sentinel specific data if missing
        if (!context.system.skills.artifactDie) {
            this.actor.update({
                'system.skills.artifactDie': {
                    label: 'Sentinel.ArtifactDie',
                    value: '1d3'
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
    ActorSheetSentinel
}
