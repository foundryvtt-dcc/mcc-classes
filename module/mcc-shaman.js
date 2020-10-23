/* global Actors */

import * as shamanSheets from './actor-sheets-shaman.js'

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */
Hooks.once('init', async function () {
  console.log(`DCC | Initializing Dungeon Crawl Classics System`)

  // Register sheet application classes
  Actors.registerSheet('mcc-shaman', shamanSheets.ActorSheetShaman)
  // Register shared template for MCC characters
  const templatePaths = [
	'modules/mcc-classes/templates/actor-partial-pc-mcc-header.html',
	'modules/mcc-classes/templates/actor-partial-shaman-programs.html'
	]
	loadTemplates(templatePaths)
})

