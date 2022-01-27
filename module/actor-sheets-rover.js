/**
 * MCC Rover character sheet overrides
 */

import DCCActorSheet from '/systems/dcc/module/actor-sheet.js'

/**
 * Extend the zero-level/NPC sheet for MCC Rover
 * @extends {DCCActorSheet}
 */
class ActorSheetRover extends DCCActorSheet {
  /** @override */
  getData () {
    const data = super.getData()
    this.options.template = 'modules/mcc-classes/templates/actor-sheet-rover.html'
if (data.data.details.sheetClass !== 'Rover') {
      this.actor.update({
        'data.class.className': game.i18n.localize('mcc.Rover')
      })
    }


    // Add in Rover specific data if missing
    if (!data.data.skills.doorsAndSecurity) {
      this.actor.update({
        'data.skills.doorsAndSecurity': {
          label: 'rover.doorsAndSecurity',
          value: '+1'
        }
      })
    }
    if (!data.data.skills.aiRecognition) {
      this.actor.update({
        'data.skills.aiRecognition': {
          label: 'mcc.aiRecognition',
          value: '+2'
        }
      })
    }
	if (!data.data.class.archaicAlignment) {
	  this.actor.update({
		  'data.class.archaicAlignment': {
			label: 'mcc.archaicAlignment',
			value: 'Clan of Cog'
		  }
	  })
	}
	if (!data.data.skills.artifactCheck) {
	  this.actor.update({
		  'data.skills.artifactCheck': {
			label: 'mcc.artifactCheck',
			value: '+0'
		  }
	  })
	}
		if (!data.data.skills.roverMissleAttack) {
	  this.actor.update({
		  'data.skills.roverMissileAttack': {
			label: 'rover.roverMissileAttack',
			value: '+1'
		  }
	  })
	}
if (!data.data.skills.maxTechLevel) {
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
  ActorSheetRover
}
