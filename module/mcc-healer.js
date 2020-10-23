/* global Actors */

import * as healerSheets from './actor-sheets-healer.js'

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */
Hooks.once('init', async function () {
  console.log(`DCC | Initializing Dungeon Crawl Classics System`)

  // Register sheet application classes
  Actors.registerSheet('mcc-healer', healerSheets.ActorSheetHealer)
  // Register shared template for MCC characters
  const templatePaths = [
	'modules/mcc-classes/templates/actor-partial-pc-mcc-header.html'
	]
	loadTemplates(templatePaths)
})

