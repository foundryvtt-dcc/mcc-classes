/* global foundry, Hooks, game, CONFIG */

import * as HealerSheets from './actor-sheets-healer.js'
import { registerMccContentSettings } from './settings.js'
import {
  registerMccTableHooks,
  seedMccTablePacksFromSettings,
  reportMccCoreBookStatus
} from './mcc-tables.mjs'
import { registerPatronTaintHandler } from './patron-taint.mjs'
import { registerGlowburnHandler } from './glowburn.mjs'

const { SchemaField, StringField, NumberField } = foundry.data.fields

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

  // MCC class-specific fields
  schema.class.fields.manimalSubType = new SchemaField({
    label: new StringField({ initial: 'MCC.ManimalSubType' }),
    value: new StringField({ initial: '' })
  })
  schema.class.fields.plantientSubType = new SchemaField({
    label: new StringField({ initial: 'MCC.PlantientSubType' }),
    value: new StringField({ initial: '' })
  })
  schema.class.fields.mutantAppearance = new SchemaField({
    label: new StringField({ initial: 'MCC.MutantAppearance' }),
    value: new StringField({ initial: '' })
  })
  schema.class.fields.aiPatron = new SchemaField({
    label: new StringField({ initial: 'Shaman.AIPatron' }),
    value: new StringField({ initial: '' })
  })

  // §9.2 relocations — these are class-metadata modifier dice / caps, NOT
  // rollable skills, so they live on system.class. The Player data model only
  // persists fields it has a registered slot for (system.skills /
  // system.class are SchemaFields), so they MUST be declared here or the
  // values silently vanish on save / level-up / import.
  schema.class.fields.maxTechLevel = new SchemaField({ // §9.2b (was system.skills)
    label: new StringField({ initial: 'MCC.MaxTechLevel' }),
    value: new StringField({ initial: '0' })
  })
  schema.class.fields.artifactDie = new SchemaField({ // §9.2c — Sentinel (was system.skills)
    label: new StringField({ initial: 'Sentinel.ArtifactDie' }),
    value: new StringField({ initial: '1d3' })
  })
  schema.class.fields.mutantHorror = new SchemaField({ // §9.2a — Mutant display die (was system.skills)
    label: new StringField({ initial: 'Mutant.MutantHorror' }),
    value: new StringField({ initial: '1d3' })
  })

  // MCC custom skills - these use the same structure as DCC skills

  // Shared MCC skills
  schema.skills.fields.aiRecognition = new SchemaField({
    label: new StringField({ initial: 'MCC.AIRecognition' }),
    value: new StringField({ initial: '+0' })
  })
  // artifactCheck carries an `ability` slot (§9.1c): book Ch.7 makes the
  // artifact check 1d20 + INT mod + class bonus, and DCC's _resolveSkillCheck
  // only adds the ability mod when skill.ability is set. Without this slot the
  // INT binding is dropped by the data model.
  schema.skills.fields.artifactCheck = new SchemaField({
    label: new StringField({ initial: 'MCC.ArtifactCheck' }),
    ability: new StringField({ initial: 'int' }),
    value: new StringField({ initial: '+0' })
  })

  // Healer skills — Naturopathy is a per-day natural-healing pool (§9.3a), not a
  // d20 skill check. The book ("2x per day per level", Ch.2 / Table 2-3) gives a
  // healing die that climbs with level (1d3 → 1d16) and a daily use count
  // (2×level). Stored as a structured pool — `die` (healing roll), `usesPerDay`
  // (the cap) and `usesRemaining` (decremented by rollNaturopathy, restored by
  // the reset button) — rather than the old single "1d3 (x2)" string, so the
  // values MUST have registered slots or the data model drops them on save.
  schema.skills.fields.naturopathy = new SchemaField({
    label: new StringField({ initial: 'Healer.Naturopathy' }),
    die: new StringField({ initial: '1d3' }),
    usesPerDay: new NumberField({ initial: 0, integer: true, min: 0 }),
    usesRemaining: new NumberField({ initial: 0, integer: true, min: 0 })
  })

  // Rover skills
  schema.skills.fields.doorsAndSecurity = new SchemaField({
    label: new StringField({ initial: 'Rover.DoorsAndSecurity' }),
    value: new StringField({ initial: '+0' })
  })

  // Plantient — Hide in Greenery is a percentile (roll-under) chance, not a
  // d20 skill check (§9.2e). Stored as a bare number string; the custom
  // rollHideInGreenery handler rolls 1d100 against it.
  schema.skills.fields.hideInGreenery = new SchemaField({
    label: new StringField({ initial: 'Plantient.HideInGreenery' }),
    value: new StringField({ initial: '50' })
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

    // Register the content-table compendium overrides and wire the
    // `mcc.register*Pack` listeners. The listeners MUST exist before
    // `dcc.ready`, when mcc-core-book broadcasts its table packs — so this
    // runs at `init`. With no book installed the registries stay empty and
    // rolls resolve against world tables or a configured compendium instead.
    registerMccContentSettings()
    registerMccTableHooks()

    // Patron Taint: roll a patron's 1d6 taint table on a natural 1 of an
    // Invoke Patron AI check, via the DCC `dcc.afterSpellCheckResult` hook.
    // Registered at init so the listener is live before any cast.
    registerPatronTaintHandler()

    // Glowburn: when a shaman burns ability points (spellburn) while running a
    // patron program, roll that patron's 1d4 manifestation table — keyed off
    // the `spellburn` amount the same hook surfaces.
    registerGlowburnHandler()

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

/* -------------------------------------------- */
/*  dcc.ready — Seed Content Tables             */
/* -------------------------------------------- */

Hooks.once('dcc.ready', async function () {
    // Seed each table registry from its world setting. Runs alongside the
    // mcc-core-book broadcast (same hook); order between the two does not
    // matter — both just `addPack` into the shared CONFIG.MCC.*Packs.
    seedMccTablePacksFromSettings()
})

/* -------------------------------------------- */
/*  Ready Hook - Run Migrations                 */
/* -------------------------------------------- */

Hooks.once('ready', async function () {
    // Run any necessary data migrations
    await runMigrations()

    // Diagnostic: confirm the book → listener → registry wiring (or note its
    // absence) so a misconfigured world is obvious in the console.
    reportMccCoreBookStatus()
})

