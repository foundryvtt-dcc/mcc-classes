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
/**  getData () {
    const data = super.getData() **/
    this.options.template = 'modules/mcc-classes/templates/actor-sheet-sentinel.html'
    if (data.system.details.sheetClass !== 'Sentinel') {
      this.actor.update({
        'data.class.className': game.i18n.localize('mcc.Sentinel')
      })
    }

    // Add in Sentinel specific data if missing
    if (!data.system.skills.artifactDie) {
      this.actor.update({
        'data.skills.artifactDie': {
          label: 'Sentinel.artifactDie',
          value: '1d3'
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
  ActorSheetSentinel
}
