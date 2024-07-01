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
/**  getData () {
    const data = super.getData() **/
async getData (options) {
    const data = await super.getData(options)
    this.options.template = 'modules/mcc-classes/templates/actor-sheet-plantient.html'
    if (data.system.details.sheetClass !== 'Plantient') {
      this.actor.update({
        'system.class.className': game.i18n.localize('mcc.Plantient')
      })
    }


    // Add in Plantient specific data if missing
	    if (!data.system.class.spellCheckAbility) {
      this.actor.update({
        'system.class.spellCheckAbility': {
          label: 'Plantient.spellCheckAbility',
          value: 'Int'
        }
      })
    }
	if (!data.system.class.archaicAlignment) {
	  this.actor.update({
		  'system.class.archaicAlignment': {
			label: 'mcc.archaicAlignment',
			value: 'Clan of Cog'
		  }
	  })
	}
	if (!data.system.class.plantientSubType) {
          this.actor.update({
                  'system.class.plantientSubType': {
                        label: 'mcc.plantientSubType',
                        value: ''
                  }
          })
        }

	if (!data.system.skills.artifactCheck) {
	  this.actor.update({
		  'system.skills.artifactCheck': {
			label: 'Plantient.artifactCheck',
			value: '+0'
		  }
	  })
	}
	if (!data.system.skills.maxTechLevel) {
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
  ActorSheetPlantient
}
