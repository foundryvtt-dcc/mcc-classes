/* global Actors */

import * as SentinelSheets from './actor-sheets-sentinel.js'

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */
Hooks.once('init', async function () {
  console.log(`DCC | Initializing Dungeon Crawl Classics System`)

  // Register sheet application classes
  Actors.registerSheet('mcc-sentinel', SentinelSheets.ActorSheetSentinel)
  // Register shared template for MCC characters
  const templatePaths = [
	'modules/mcc-classes/templates/actor-partial-pc-mcc-header.html'
	]
	loadTemplates(templatePaths)
})

