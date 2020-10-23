/**
 * MCC shaman character sheet overrides
 */

import DCCActorSheet from '/systems/dcc/module/actor-sheet.js'

/**
 * Extend the zero-level/NPC sheet for MCC Shaman
 * @extends {DCCActorSheet}
 */
class ActorSheetShaman extends DCCActorSheet {
  /** @override */
  getData () {
    const data = super.getData()
    this.options.template = 'modules/mcc-classes/templates/actor-sheet-shaman.html'
    data.data.class.className = 'Shaman'

    // Add in shaman specific data if missing
    if (!data.data.class.aiPatron) {
      this.actor.update({
        'data.class.aiPatron': {
          label: 'shaman.aiPatron',
          value: ' '
        }
      })
    }
    if (!data.data.skills.aiRecognition) {
      this.actor.update({
        'data.skills.aiRecognition': {
          label: 'shaman.aiRecognition',
          value: '+2'
        }
      })
    }
	if (!data.data.class.archaicAlignment) {
	  this.actor.update({
		  'data.class.archaicAlignment': {
			label: 'shaman.archaicAlignment',
			value: 'Clan of Cog'
		  }
	  })
	}
	if (!data.data.skills.artifactCheck) {
	  this.actor.update({
		  'data.skills.artifactCheck': {
			label: 'shaman.artifactCheck',
			value: '+0'
		  }
	  })
	}
		if (!data.data.class.spellCheck) {
	  this.actor.update({
		  'data.class.spellCheck': {
			label: 'shaman.programCheck',
			value: '+0'
		  }
	  })
	}
    return data
  }
}

export {
  ActorSheetShaman
}
