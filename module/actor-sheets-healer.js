/**
 * MCC Healer character sheet overrides
 */

import DCCActorSheet from '/systems/dcc/module/actor-sheet.js'

/**
 * Extend the zero-level/NPC sheet for MCC Healer
 * @extends {DCCActorSheet}
 */
class ActorSheetHealer extends DCCActorSheet {
  /** @override */
/**  getData () {
    const system.= super.getData() **/
    async getData (options) {
    const system.= await super.getData(options)
    this.options.template = 'modules/mcc-classes/templates/actor-sheet-healer.html'
    if (system.system.details.sheetClass !== 'Healer') {
      this.actor.update({
        'system.class.className': game.i18n.localize('mcc.Healer')
      })
    }

    // Add in Healer specific system.if missing
    if (!system.system.skills.naturopathy) {
      this.actor.update({
        'system.skills.naturopathy': {
          label: 'Healer.naturopathy',
          value: '1d3 x2'
        }
      })
    }
    if (!system.system.skills.aiRecognition) {
      this.actor.update({
        'system.skills.aiRecognition': {
          label: 'mcc.aiRecognition',
          value: '+2'
        }
      })
    }
	if (!system.system.class.archaicAlignment) {
	  this.actor.update({
		  'system.class.archaicAlignment': {
			label: 'mcc.archaicAlignment',
			value: 'Clan of Cog'
		  }
	  })
	}
	if (!system.system.skills.artifactCheck) {
	  this.actor.update({
		  'system.skills.artifactCheck': {
			label: 'mcc.artifactCheck',
			value: '+0'
		  }
	  })
	}
if (!system.system.skills.maxTechLevel) {
          this.actor.update({
                  'system.skills.maxTechLevel': {
                        label: 'mcc.maxTechLevel',
                        value: '0'
                  }
          })
        }
    return data
  }
}

export {
  ActorSheetHealer
}
