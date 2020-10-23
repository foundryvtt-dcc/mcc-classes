/**
 * MCC Sentinel character sheet overrides
 */

import DCCActorSheet from '/systems/dcc/module/actor-sheet.js'

/**
 * Extend the zero-level/NPC sheet for MCC Sentinel
 * @extends {DCCActorSheet}
 */
class ActorSheetSentinel extends DCCActorSheet {
  /** @override */
  getData () {
    const data = super.getData()
    this.options.template = 'modules/mcc-classes/templates/actor-sheet-sentinel.html'
    data.data.class.className = 'Sentinel'

    // Add in Sentinel specific data if missing
    if (!data.data.skills.artifactDie) {
      this.actor.update({
        'data.skills.artifactDie': {
          label: 'Sentinel.artifactDie',
          value: '1d3'
        }
      })
    }
    if (!data.data.skills.aiRecognition) {
      this.actor.update({
        'data.skills.aiRecognition': {
          label: 'Sentinel.aiRecognition',
          value: '+2'
        }
      })
    }
	if (!data.data.class.archaicAlignment) {
	  this.actor.update({
		  'data.class.archaicAlignment': {
			label: 'Sentinel.archaicAlignment',
			value: 'Clan of Cog'
		  }
	  })
	}
	if (!data.data.skills.artifactCheck) {
	  this.actor.update({
		  'data.skills.artifactCheck': {
			label: 'Sentinel.artifactCheck',
			value: '+0'
		  }
	  })
	}
    return data
  }
}

export {
  ActorSheetSentinel
}
