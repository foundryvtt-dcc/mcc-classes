/**
 * MCC Plantient character sheet overrides
 */

import DCCActorSheet from '/systems/dcc/module/actor-sheet.js'

/**
 * Extend the zero-level/NPC sheet for MCC Plantient
 * @extends {DCCActorSheet}
 */
class ActorSheetPlantient extends DCCActorSheet {
  /** @override */
  getData () {
    const data = super.getData()
    this.options.template = 'modules/mcc-classes/templates/actor-sheet-plantient.html'
    data.data.class.className = 'Plantient'

    // Add in Plantient specific data if missing
	    if (!data.data.class.spellCheckAbility) {
      this.actor.update({
        'data.class.spellCheckAbility': {
          label: 'Plantient.spellCheckAbility',
          value: 'Int'
        }
      })
    }
    if (!data.data.skills.aiRecognition) {
      this.actor.update({
        'data.skills.aiRecognition': {
          label: 'Plantient.aiRecognition',
          value: '+2'
        }
      })
    }
	if (!data.data.class.archaicAlignment) {
	  this.actor.update({
		  'data.class.archaicAlignment': {
			label: 'Plantient.archaicAlignment',
			value: 'Clan of Cog'
		  }
	  })
	}
	if (!data.data.skills.artifactCheck) {
	  this.actor.update({
		  'data.skills.artifactCheck': {
			label: 'Plantient.artifactCheck',
			value: '+0'
		  }
	  })
	}
    return data
  }
}

export {
  ActorSheetPlantient
}
