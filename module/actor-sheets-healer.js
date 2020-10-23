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
  getData () {
    const data = super.getData()
    this.options.template = 'modules/mcc-classes/templates/actor-sheet-healer.html'
    data.data.class.className = 'Healer'

    // Add in Healer specific data if missing
    if (!data.data.skills.naturopathy) {
      this.actor.update({
        'data.skills.naturopathy': {
          label: 'Healer.naturopathy',
          value: '1d3 x2'
        }
      })
    }
    if (!data.data.skills.aiRecognition) {
      this.actor.update({
        'data.skills.aiRecognition': {
          label: 'Healer.aiRecognition',
          value: '+2'
        }
      })
    }
	if (!data.data.class.archaicAlignment) {
	  this.actor.update({
		  'data.class.archaicAlignment': {
			label: 'Healer.archaicAlignment',
			value: 'Clan of Cog'
		  }
	  })
	}
	if (!data.data.skills.artifactCheck) {
	  this.actor.update({
		  'data.skills.artifactCheck': {
			label: 'Healer.artifactCheck',
			value: '+0'
		  }
	  })
	}
    return data
  }
}

export {
  ActorSheetHealer
}
