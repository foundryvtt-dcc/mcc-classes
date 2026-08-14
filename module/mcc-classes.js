/* global foundry, Hooks, game, setTimeout */

import * as HealerSheets from './actor-sheets-healer.js'
import * as MutantSheets from './actor-sheets-mutant.js'
import * as RoverSheets from './actor-sheets-rover.js'
import * as SentinelSheets from './actor-sheets-sentinel.js'
import * as ShamanSheets from './actor-sheets-shaman.js'
import * as ManimalSheets from './actor-sheets-manimal.js'
import * as PlantientSheets from './actor-sheets-plantient.js'
import { registerMccContentSettings } from './settings.js'
import { checkReleaseNotes } from './mcc-release-notes.js'
import {
    registerMccTableHooks,
    seedMccTablePacksFromSettings,
    reportMccCoreBookStatus
} from './mcc-tables.mjs'
import { enforceMccCritFumblePrecedence } from './crit-fumble-tables.mjs'
import { registerPatronTaintHandler } from './patron-taint.mjs'
import { registerGlowburnHandler } from './glowburn.mjs'
import { runMigrations } from './migrations.js'
import { defineSharedMccFields, registerMccClasses } from './mcc-class-data.mjs'

const { loadTemplates } = foundry.applications.handlebars

/* -------------------------------------------- */
/*  Schema Extensions                           */
/* -------------------------------------------- */
/**
 * Extend the DCC Player schema with the cross-cutting MCC fields shared
 * across several classes (archaicAlignment / aiRecognition / artifactCheck
 * / maxTechLevel). Per-class UNIQUE fields are contributed by each class's
 * `registerClassMixin` registration instead — see `mcc-class-data.mjs`.
 * This hook runs during DCC system initialization. (`sheetClass` now ships
 * on the DCC base schema, so the old `dcc.defineBaseActorSchema` shim is
 * gone.)
 */
Hooks.on('dcc.definePlayerSchema', defineSharedMccFields)

/**
 * Trim the DCC Tools sidebar tab (rebranded "MCC Tools" — see the init hook
 * below) for the MCC ruleset: Mutant Crawl Classics has no spell duel rules
 * (spell duels are a DCC wizard mechanic), so drop that launcher. Fleeting
 * Luck (already gated on the DCC world setting) and the GM's Request Roll
 * tool remain. Registered at import time so the sidebar's first render
 * (during `Game#initializeUI`, before `ready`) already reflects it; on DCC
 * versions without the sidebar tab the hook simply never fires.
 */
Hooks.on('dcc.getSidebarTools', (tools) => {
    delete tools.spellDuel
})

/**
 * Retitle the DCC Tools sidebar tab "MCC Tools" in every locale. A flat
 * `DCC.SidebarTab` override in lang/en.json would only win for English
 * clients — the DCC system ships translated values of that key (de/fr/es/
 * it/pl/cn) and the active language's system translation would outrank the
 * module's English fallback. Since this module is en-only, force the
 * module-owned key's value over the system key once translations are
 * loaded; this covers the tab tooltip, the in-tab heading, and the popout
 * window title (all three localize `DCC.SidebarTab`).
 */
Hooks.once('i18nInit', () => {
    foundry.utils.setProperty(game.i18n.translations, 'DCC.SidebarTab',
        game.i18n.localize('MCC.SidebarTab'))
})

/**
 * Sheet registrations: each MCC class is a thin DCCSheet subclass. The
 * `scope` matches the legacy `Actors.registerSheet` id so existing actors'
 * stored `flags.core.sheetClass` values keep resolving.
 */
const MCC_SHEETS = [
    { sheet: HealerSheets.ActorSheetHealer, scope: 'mcc-healer', label: 'Healer.ActorSheetHealer' },
    { sheet: MutantSheets.ActorSheetMutant, scope: 'mcc-mutant', label: 'Mutant.ActorSheetMutant' },
    { sheet: RoverSheets.ActorSheetRover, scope: 'mcc-rover', label: 'Rover.ActorSheetRover' },
    { sheet: SentinelSheets.ActorSheetSentinel, scope: 'mcc-sentinel', label: 'Sentinel.ActorSheetSentinel' },
    { sheet: ShamanSheets.ActorSheetShaman, scope: 'mcc-shaman', label: 'Shaman.ActorSheetShaman' },
    { sheet: ManimalSheets.ActorSheetManimal, scope: 'mcc-manimal', label: 'Manimal.ActorSheetManimal' },
    { sheet: PlantientSheets.ActorSheetPlantient, scope: 'mcc-plantient', label: 'Plantient.ActorSheetPlantient' }
]

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */

Hooks.once('init', async function () {
    console.log('MCC | Initializing Mutant Crawl Classics System')

    // Rebrand the DCC Tools sidebar tab for MCC. The system registered the
    // tab in its own init hook (which runs before module init hooks), so its
    // Sidebar.TABS entry exists here; swap the DCC wordmark tab-strip icon
    // class for our "M" (styled in styles/mcc.css). The i18nInit hook above
    // retitles the tab "MCC Tools". Guarded so older DCC versions without
    // the sidebar tab are a no-op.
    const dccSidebarTab = foundry.applications.sidebar.Sidebar.TABS.dcc
    if (dccSidebarTab) {
        dccSidebarTab.icon = 'mcc-sidebar-icon'
    }

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

    // Register every MCC class through the DCC extension API: per-class schema
    // mixin + first-open identity defaults + sheet parts/tabs. `game.dcc` is
    // created during the DCC system's `init` hook, which runs before this one.
    registerMccClasses(game.dcc)

    // Register the per-class sheet stubs. The DCCSheet base composes
    // parts/tabs from the `registerSheetPart` entries above by `CLASS_ID`.
    for (const { sheet, scope, label } of MCC_SHEETS) {
        game.dcc.registerActorSheet('Player', sheet, { scope, label })
    }

    // Register shared templates for MCC characters
    const templatePaths = [
        'modules/mcc-classes/templates/actor-partial-mutations.html',
        'modules/mcc-classes/templates/actor-partial-shaman-programs.html'
    ]
    loadTemplates(templatePaths)
})

/* -------------------------------------------- */
/*  dcc.ready — Seed Content Tables             */
/* -------------------------------------------- */

Hooks.once('dcc.ready', async function () {
    // Seed each table registry from its world setting. Runs alongside the
    // mcc-core-book broadcast (same hook); order between the two does not
    // matter — both just `addPack` into the shared CONFIG.MCC.*Packs.
    seedMccTablePacksFromSettings()

    // Whisper the once-per-version release-notes/user-guide chat card.
    // Fire-and-forget (like the system's checkReleaseNotes): the card is
    // cosmetic and must not delay or abort the table seeding around it.
    checkReleaseNotes()

    // Deferred one macrotask so the rest runs AFTER the entire `dcc.ready`
    // chain — including the mcc-core-book AND dcc-core-book broadcasts, which
    // register their packs on `dcc.ready` too and whose handler order relative
    // to this one is not guaranteed. (Previously this ran on the bare `ready`
    // hook, which races the DCC system's awaited `dcc.ready` emission and
    // falsely reported "no table packs".)
    setTimeout(() => {
        // Make MCC the authoritative crit/fumble source: promote the MCC crit
        // pack ahead of dcc-core-book's and force CONFIG.DCC.fumbleTable to the
        // MCC fumble table, so MCC's identically-named tables win the override.
        // Must run after both books have broadcast — hence the same deferral.
        enforceMccCritFumblePrecedence()

        // Diagnostic: confirm the book → listener → registry wiring.
        reportMccCoreBookStatus()
    }, 0)
})

/* -------------------------------------------- */
/*  Ready Hook - Run Migrations                 */
/* -------------------------------------------- */

Hooks.once('ready', async function () {
    // Run any necessary data migrations
    await runMigrations()
})
