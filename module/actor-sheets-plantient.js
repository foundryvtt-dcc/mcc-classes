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
    if (data.data.details.sheetClass !== 'Plantient') {
      this.actor.update({
        'data.class.className': game.i18n.localize('Plantient.Plantient')
      })
    }


    // Add in Plantient specific data if missing
	    if (!data.data.class.spellCheckAbility) {
      this.actor.update({
        'data.class.spellCheckAbility': {
          label: 'Plantient.spellCheckAbility',
          value: 'Int'
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
	if (!data.data.class.plantientSubType) {
          this.actor.update({
                  'data.class.plantientSubType': {
                        label: 'mcc.plantientSubType',
                        value: ''
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
  ActorSheetPlantient
}
