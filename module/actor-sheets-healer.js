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
    const data = super.getData() **/
    async getData (options) {
    const data = await super.getData(options)
    this.options.template = 'modules/mcc-classes/templates/actor-sheet-healer.html'
    if (data.system.details.sheetClass !== 'Healer') {
      this.actor.update({
        'data.class.className': game.i18n.localize('mcc.Healer')
      })
    }

    // Add in Healer specific data if missing
    if (!data.system.skills.naturopathy) {
      this.actor.update({
        'data.skills.naturopathy': {
          label: 'Healer.naturopathy',
          value: '1d3 x2'
        }
      })
    }
    if (!data.system.skills.aiRecognition) {
      this.actor.update({
        'data.skills.aiRecognition': {
          label: 'mcc.aiRecognition',
          value: '+2'
        }
      })
    }
	if (!data.system.class.archaicAlignment) {
	  this.actor.update({
		  'data.class.archaicAlignment': {
			label: 'mcc.archaicAlignment',
			value: 'Clan of Cog'
		  }
	  })
	}
	if (!data.system.skills.artifactCheck) {
	  this.actor.update({
		  'data.skills.artifactCheck': {
			label: 'mcc.artifactCheck',
			value: '+0'
		  }
	  })
	}
if (!data.system.skills.maxTechLevel) {
          this.actor.update({
                  'data.skills.maxTechLevel': {
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
