/* global Actors */

import * as healerSheets from './actor-sheets-healer.js'
import * as MutantSheets from './actor-sheets-mutant.js'
import * as RoverSheets from './actor-sheets-rover.js'
import * as SentinelSheets from './actor-sheets-sentinel.js'
import * as shamanSheets from './actor-sheets-shaman.js'


/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */
Hooks.once('init', async function () {
  console.log(`DCC | Initializing Dungeon Crawl Classics System`)

  // Register sheet application classes
  Actors.registerSheet('mcc-healer', healerSheets.ActorSheetHealer)
  Actors.registerSheet('mcc-healer', healerSheets.ActorSheetHealer)
  Actors.registerSheet('mcc-mutant', MutantSheets.ActorSheetMutant)
  Actors.registerSheet('mcc-rover', RoverSheets.ActorSheetRover)
  Actors.registerSheet('mcc-sentinel', SentinelSheets.ActorSheetSentinel)
  Actors.registerSheet('mcc-shaman', shamanSheets.ActorSheetShaman)  
  // Register shared template for MCC characters
  const templatePaths = [
	'modules/mcc-classes/templates/actor-partial-pc-mcc-header.html',
	'modules/mcc-classes/templates/actor-partial-mutations.html',
	'modules/mcc-classes/templates/actor-partial-shaman-programs.html'	
	]
	loadTemplates(templatePaths)
})

