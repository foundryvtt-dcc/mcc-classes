/* global foundry, Hooks */

import * as HealerSheets from './actor-sheets-healer.js'

const { SchemaField, StringField } = foundry.data.fields

/* -------------------------------------------- */
/*  Schema Extensions                           */
/* -------------------------------------------- */
/**
 * Extend the DCC base actor schema with MCC-specific fields.
 * This hook runs during DCC system initialization, before module init.
 */
Hooks.on('dcc.defineBaseActorSchema', (schema) => {
  // Add sheetClass to details if not already present (may be added by other modules)
  if (!schema.details.fields.sheetClass) {
    schema.details.fields.sheetClass = new StringField({ initial: '' })
  }
})

/**
 * Extend the DCC Player schema with MCC-specific class fields.
 * This hook runs during DCC system initialization, before module init.
 */
Hooks.on('dcc.definePlayerSchema', (schema) => {
  // MCC Archaic Alignment (used by multiple MCC classes)
  schema.class.fields.archaicAlignment = new SchemaField({
    label: new StringField({ initial: 'MCC.ArchaicAlignment' }),
    value: new StringField({ initial: '' })
  })

  // MCC custom skills - these use the same structure as DCC skills
  // Skills are added dynamically in each class sheet, but defining the schema
  // ensures proper validation and defaults

  // Shared MCC skills
  schema.skills.fields.aiRecognition = new SchemaField({
    label: new StringField({ initial: 'MCC.AIRecognition' }),
    value: new StringField({ initial: '+0' })
  })
  schema.skills.fields.artifactCheck = new SchemaField({
    label: new StringField({ initial: 'MCC.ArtifactCheck' }),
    value: new StringField({ initial: '+0' })
  })
  schema.skills.fields.maxTechLevel = new SchemaField({
    label: new StringField({ initial: 'MCC.MaxTechLevel' }),
    value: new StringField({ initial: '0' })
  })

  // Rover skills
  schema.skills.fields.doorsAndSecurity = new SchemaField({
    label: new StringField({ initial: 'Rover.DoorsAndSecurity' }),
    value: new StringField({ initial: '+0' })
  })
  schema.skills.fields.roverMissileAttack = new SchemaField({
    label: new StringField({ initial: 'Rover.RoverMissileAttack' }),
    value: new StringField({ initial: '+0' })
  })
})
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

