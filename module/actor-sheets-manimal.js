/**
 * MCC Manimal character sheet overrides
 */

import DCCActorSheet from '/systems/dcc/module/actor-sheet.js'

/**
 * Extend the zero-level/NPC sheet for MCC Manimal
 * @extends {DCCActorSheet}
 */
class ActorSheetManimal extends DCCActorSheet {
  /** @override */
/**  getData () {
    const data = super.getData() **/
async getData (options) {
    const data = await super.getData(options)
    this.options.template = 'modules/mcc-classes/templates/actor-sheet-manimal.html'

if (data.system.details.sheetClass !== 'Manimal') {
      this.actor.update({
        'data.class.className': game.i18n.localize('mcc.Manimal')
      })
    }

    // Add in Manimal specific data if missing
	    if (!data.system.class.spellCheckAbility) {
      this.actor.update({
        'data.class.spellCheckAbility': {
          label: 'Manimal.spellCheckAbility',
          value: 'Int'
        }
      })
    }
    if (!data.system.skills.aiRecognition) {
      this.actor.update({
        'data.skills.aiRecognition': {
          label: 'mcc.aiRecognition',
          value: '-4'
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
	if (!data.system.class.manimalSubType) {
          this.actor.update({
                  'data.class.manimalSubType': {
                        label: 'mcc.manimalSubType',
                        value: ''
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
  ActorSheetManimal
}
