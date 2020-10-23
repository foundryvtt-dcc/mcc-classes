/* global Actors */

import * as MutantSheets from './actor-sheets-mutant.js'

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */
Hooks.once('init', async function () {
  console.log(`DCC | Initializing Dungeon Crawl Classics System`)

  // Register sheet application classes
  Actors.registerSheet('mcc-mutant', MutantSheets.ActorSheetMutant)
  // Register shared template for MCC characters
  const templatePaths = [
	'modules/mcc-classes/templates/actor-partial-pc-mcc-header.html',
	'modules/mcc-classes/templates/actor-partial-mutations.html'
	]
	loadTemplates(templatePaths)
})

