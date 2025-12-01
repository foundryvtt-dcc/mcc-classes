/* global foundry */

import * as HealerSheets from './actor-sheets-healer.js'
import * as MutantSheets from './actor-sheets-mutant.js'
import * as RoverSheets from './actor-sheets-rover.js'
import * as SentinelSheets from './actor-sheets-sentinel.js'
import * as ShamanSheets from './actor-sheets-shaman.js'
import * as ManimalSheets from './actor-sheets-manimal.js'
import * as PlantientSheets from './actor-sheets-plantient.js'
import { runMigrations } from './migrations.js'

const { Actors } = foundry.documents.collections
const { loadTemplates } = foundry.applications.handlebars

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */

Hooks.once('init', async function () {
    console.log(`MCC | Initializing Mutant Crawl Classics System`)

    // Register module settings for migration tracking
    game.settings.register('mcc-classes', 'lastMigrationVersion', {
        name: 'Last Migration Version',
        scope: 'world',
        config: false,
        type: String,
        default: '0.0.0'
    })

    // Register sheet application classes
    Actors.registerSheet('mcc-healer', HealerSheets.ActorSheetHealer, {
        types: ['Player'],
        label: 'Healer.ActorSheetHealer'
    })
    Actors.registerSheet('mcc-mutant', MutantSheets.ActorSheetMutant, {
        types: ['Player'],
        label: 'Mutant.ActorSheetMutant'
    })
    Actors.registerSheet('mcc-rover', RoverSheets.ActorSheetRover, {
        types: ['Player'],
        label: 'Rover.ActorSheetRover'
    })
    Actors.registerSheet('mcc-sentinel', SentinelSheets.ActorSheetSentinel, {
        types: ['Player'],
        label: 'Sentinel.ActorSheetSentinel'
    })
    Actors.registerSheet('mcc-shaman', ShamanSheets.ActorSheetShaman, {
        types: ['Player'],
        label: 'Shaman.ActorSheetShaman'
    })
    Actors.registerSheet('mcc-manimal', ManimalSheets.ActorSheetManimal, {
        types: ['Player'],
        label: 'Manimal.ActorSheetManimal'
    })
    Actors.registerSheet('mcc-plantient', PlantientSheets.ActorSheetPlantient, {
        types: ['Player'],
        label: 'Plantient.ActorSheetPlantient'
    })

    // Register shared template for MCC characters
    const templatePaths = [
        'modules/mcc-classes/templates/actor-partial-mutations.html',
        'modules/mcc-classes/templates/actor-partial-shaman-programs.html'
    ]
    loadTemplates(templatePaths)
})

/* -------------------------------------------- */
/*  Ready Hook - Run Migrations                 */
/* -------------------------------------------- */

Hooks.once('ready', async function () {
    // Run any necessary data migrations
    await runMigrations()
})

