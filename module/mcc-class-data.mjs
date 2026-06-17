/* global foundry */
/**
 * Mutant Crawl Classics classes — registration data for the DCC
 * extension API.
 *
 * Each MCC class is described once here and registered through the
 * stable `game.dcc.*` registries the DCC system exposes (see the DCC
 * repo's `docs/dev/EXTENSION_API.md` + `CLASS_DECOMPOSITION.md`):
 *
 *   - `registerClassMixin(classId, mixinFn)` — the class's own *unique*
 *     schema fields. Cross-cutting MCC fields shared by several classes
 *     (archaicAlignment / aiRecognition / artifactCheck / maxTechLevel)
 *     stay in the `dcc.definePlayerSchema` hook via `defineSharedMccFields`
 *     — that hook is the documented surface for schema extensions that
 *     aren't naturally class-keyed.
 *   - `registerClassDefaults(classId, defaults)` — class identity +
 *     mechanical defaults written on a sheet's first open (the old
 *     `_prepareContext` "if sheetClass !== 'X'" block).
 *   - `registerSheetPart(classId, { parts, tabs })` — the class's sheet
 *     parts + tab labels (the old per-sheet static `PARTS` / `CLASS_TABS`).
 *
 * The per-class sheets (`actor-sheets-*.js`) become thin `DCCSheet`
 * subclasses that keep only their DEFAULT_OPTIONS, custom actions, and a
 * slim `_prepareContext` for the genuine one-time data migrations
 * (`-=` field deletions, init-die folding, `%` strip, naturopathy pool
 * seeding) that `registerClassDefaults` can't express.
 *
 * `classId` is the lowercase canonical identifier (`actor.classId`
 * resolves `system.details.sheetClass.toLowerCase()`), matching the
 * `static CLASS_ID` pinned on each sheet stub.
 */

const MODULE_ID = 'mcc-classes'

/** Template path for an MCC class partial. */
function classPartial (name) {
  return `modules/${MODULE_ID}/templates/actor-partial-${name}.html`
}

/** PC-flavored common parts every MCC sheet overrides onto the base. */
function commonParts () {
  return {
    character: { id: 'character', template: 'systems/dcc/templates/actor-partial-pc-common.html' },
    equipment: { id: 'equipment', template: 'systems/dcc/templates/actor-partial-pc-equipment.html' }
  }
}

/** The mutations tab part shared by Mutant / Manimal / Plantient. */
function mutationsPart () {
  return { id: 'spells', template: `modules/${MODULE_ID}/templates/actor-partial-mutations.html` }
}

/**
 * Cross-cutting MCC schema fields shared across several classes. These
 * are NOT naturally class-keyed, so they stay on the `dcc.definePlayerSchema`
 * hook rather than a per-class mixin. Builds fresh field instances each
 * call (Foundry may re-invoke `defineSchema()`).
 *
 * @param {object} schema - the in-progress Player schema.
 */
export function defineSharedMccFields (schema) {
  const f = foundry.data.fields

  // Archaic Alignment — used by every MCC class.
  schema.class.fields.archaicAlignment = new f.SchemaField({
    label: new f.StringField({ initial: 'MCC.ArchaicAlignment' }),
    value: new f.StringField({ initial: '' })
  })

  // §9.2b maxTechLevel — artifact-tier cap (class metadata, not a skill).
  schema.class.fields.maxTechLevel = new f.SchemaField({
    label: new f.StringField({ initial: 'MCC.MaxTechLevel' }),
    value: new f.StringField({ initial: '0' })
  })

  // AI Recognition — shared skill.
  schema.skills.fields.aiRecognition = new f.SchemaField({
    label: new f.StringField({ initial: 'MCC.AIRecognition' }),
    value: new f.StringField({ initial: '+0' })
  })

  // §9.1c artifactCheck — carries an `ability` slot so DCC's
  // _resolveSkillCheck adds the INT mod.
  schema.skills.fields.artifactCheck = new f.SchemaField({
    label: new f.StringField({ initial: 'MCC.ArtifactCheck' }),
    ability: new f.StringField({ initial: 'int' }),
    value: new f.StringField({ initial: '+0' })
  })
}

/**
 * Per-class registration descriptors. `mixin` builds fresh field
 * instances each call. Only fields UNIQUE to the class live here; shared
 * fields are in `defineSharedMccFields`.
 */
export const MCC_CLASSES = {
  mutant: {
    label: 'Mutant.ActorSheetMutant',
    mixin (schema) {
      const f = foundry.data.fields
      schema.class.fields.mutantAppearance = new f.SchemaField({
        label: new f.StringField({ initial: 'MCC.MutantAppearance' }),
        value: new f.StringField({ initial: '' })
      })
      // §9.2a — Mutant Horror display die (folded into init.die by the sheet).
      schema.class.fields.mutantHorror = new f.SchemaField({
        label: new f.StringField({ initial: 'Mutant.MutantHorror' }),
        value: new f.StringField({ initial: '1d3' })
      })
    },
    defaults: {
      sheetClass: 'Mutant',
      localize: { 'class.className': 'MCC.Mutant' },
      literal: {
        'config.showSkills': true,
        'details.critRange': 20,
        'class.spellCheckAbility': ''
      }
    },
    sheetPart: {
      parts: { ...commonParts(), mutant: { id: 'mutant', template: classPartial('mutant') }, spells: mutationsPart() },
      tabs: {
        sheet: {
          tabs: [
            { id: 'mutant', group: 'sheet', label: 'MCC.Mutant' },
            { id: 'spells', group: 'sheet', label: 'MCC.Mutations' }
          ]
        }
      }
    }
  },

  manimal: {
    label: 'Manimal.ActorSheetManimal',
    mixin (schema) {
      const f = foundry.data.fields
      schema.class.fields.manimalSubType = new f.SchemaField({
        label: new f.StringField({ initial: 'MCC.ManimalSubType' }),
        value: new f.StringField({ initial: '' })
      })
    },
    defaults: {
      sheetClass: 'Manimal',
      localize: { 'class.className': 'MCC.Manimal' },
      literal: { 'config.showSkills': true, 'details.critRange': 20 }
    },
    sheetPart: {
      parts: { ...commonParts(), manimal: { id: 'manimal', template: classPartial('manimal') }, spells: mutationsPart() },
      tabs: {
        sheet: {
          tabs: [
            { id: 'manimal', group: 'sheet', label: 'MCC.Manimal' },
            { id: 'spells', group: 'sheet', label: 'MCC.Mutations' }
          ]
        }
      }
    }
  },

  plantient: {
    label: 'Plantient.ActorSheetPlantient',
    mixin (schema) {
      const f = foundry.data.fields
      schema.class.fields.plantientSubType = new f.SchemaField({
        label: new f.StringField({ initial: 'MCC.PlantientSubType' }),
        value: new f.StringField({ initial: '' })
      })
      // §9.2e — Hide in Greenery percentile (roll-under) chance.
      schema.skills.fields.hideInGreenery = new f.SchemaField({
        label: new f.StringField({ initial: 'Plantient.HideInGreenery' }),
        value: new f.StringField({ initial: '50' })
      })
    },
    defaults: {
      sheetClass: 'Plantient',
      localize: { 'class.className': 'MCC.Plantient' },
      literal: { 'config.showSkills': true, 'details.critRange': 20 }
    },
    sheetPart: {
      parts: { ...commonParts(), plantient: { id: 'plantient', template: classPartial('plantient') }, spells: mutationsPart() },
      tabs: {
        sheet: {
          tabs: [
            { id: 'plantient', group: 'sheet', label: 'MCC.Plantient' },
            { id: 'spells', group: 'sheet', label: 'MCC.Mutations' }
          ]
        }
      }
    }
  },

  rover: {
    label: 'Rover.ActorSheetRover',
    mixin (schema) {
      const f = foundry.data.fields
      schema.skills.fields.doorsAndSecurity = new f.SchemaField({
        label: new f.StringField({ initial: 'Rover.DoorsAndSecurity' }),
        value: new f.StringField({ initial: '+0' })
      })
    },
    defaults: {
      sheetClass: 'Rover',
      localize: { 'class.className': 'MCC.Rover' },
      literal: { 'config.showSkills': true, 'details.critRange': 20 }
    },
    sheetPart: {
      parts: { ...commonParts(), rover: { id: 'rover', template: classPartial('rover') } },
      tabs: { sheet: { tabs: [{ id: 'rover', group: 'sheet', label: 'MCC.Rover' }] } }
    }
  },

  sentinel: {
    label: 'Sentinel.ActorSheetSentinel',
    mixin (schema) {
      const f = foundry.data.fields
      // §9.2c — Artifact die modifier (class metadata, display-only on the tab).
      schema.class.fields.artifactDie = new f.SchemaField({
        label: new f.StringField({ initial: 'Sentinel.ArtifactDie' }),
        value: new f.StringField({ initial: '1d3' })
      })
    },
    defaults: {
      sheetClass: 'Sentinel',
      localize: { 'class.className': 'MCC.Sentinel' },
      literal: { 'config.showSkills': true, 'details.critRange': 20 }
    },
    sheetPart: {
      parts: { ...commonParts(), sentinel: { id: 'sentinel', template: classPartial('sentinel') } },
      tabs: { sheet: { tabs: [{ id: 'sentinel', group: 'sheet', label: 'MCC.Sentinel' }] } }
    }
  },

  shaman: {
    label: 'Shaman.ActorSheetShaman',
    mixin (schema) {
      const f = foundry.data.fields
      schema.class.fields.aiPatron = new f.SchemaField({
        label: new f.StringField({ initial: 'Shaman.AIPatron' }),
        value: new f.StringField({ initial: '' })
      })
    },
    defaults: {
      sheetClass: 'Shaman',
      localize: { 'class.className': 'MCC.Shaman' },
      literal: {
        'config.showSkills': true,
        'details.critRange': 20,
        'class.spellCheckAbility': 'int'
      }
    },
    sheetPart: {
      parts: { ...commonParts(), shaman: { id: 'shaman', template: classPartial('shaman') }, spells: { id: 'spells', template: classPartial('shaman-programs') } },
      tabs: {
        sheet: {
          tabs: [
            { id: 'shaman', group: 'sheet', label: 'MCC.Shaman' },
            { id: 'spells', group: 'sheet', label: 'Shaman.Programs' }
          ]
        }
      }
    }
  },

  healer: {
    label: 'Healer.ActorSheetHealer',
    mixin (schema) {
      const f = foundry.data.fields
      // §9.3a — Naturopathy per-day healing pool (not a d20 skill check).
      schema.skills.fields.naturopathy = new f.SchemaField({
        label: new f.StringField({ initial: 'Healer.Naturopathy' }),
        die: new f.StringField({ initial: '1d3' }),
        usesPerDay: new f.NumberField({ initial: 0, integer: true, min: 0 }),
        usesRemaining: new f.NumberField({ initial: 0, integer: true, min: 0 })
      })
    },
    defaults: {
      sheetClass: 'Healer',
      localize: { 'class.className': 'MCC.Healer' },
      literal: { 'config.showSkills': true, 'details.critRange': 20 }
    },
    sheetPart: {
      parts: { ...commonParts(), healer: { id: 'healer', template: classPartial('healer') } },
      tabs: { sheet: { tabs: [{ id: 'healer', group: 'sheet', label: 'MCC.Healer' }] } }
    }
  }
}

/**
 * Register every MCC class through the DCC extension API. Called from the
 * module `init` hook once `game.dcc` is available (DCC creates it during
 * its own `init`, which runs before this module's `init`).
 *
 * @param {object} api - the `game.dcc` namespace.
 */
export function registerMccClasses (api) {
  for (const [classId, def] of Object.entries(MCC_CLASSES)) {
    api.registerClassMixin(classId, def.mixin)
    api.registerClassDefaults(classId, def.defaults)
    api.registerSheetPart(classId, def.sheetPart)
  }
}
