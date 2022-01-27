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
    if (data.data.details.sheetClass !== 'Shaman') {
      this.actor.update({
        'data.class.className': game.i18n.localize('Shaman.Shaman')
      })
    }

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
		if (!data.data.class.spellCheck) {
	  this.actor.update({
		  'data.class.spellCheck': {
			label: 'mcc.programCheck',
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
  ActorSheetShaman
}
