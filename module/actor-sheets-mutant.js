/**
 * MCC Mutant character sheet overrides
 */

import DCCActorSheet from '/systems/dcc/module/actor-sheet.js'

/**
 * Extend the DCC actor sheet for MCC Mutant
 * @extends {DCCActorSheet}
 */
class ActorSheetMutant extends DCCActorSheet {
    /** @inheritDoc */
    static DEFAULT_OPTIONS = {
        classes: ['dcc', 'sheet', 'actor', 'pc', 'mutant'],
        position: {
            height: 635,
            width: 575
        }
    }

    /** @inheritDoc */
    static CLASS_TABS = {
        sheet: {
            tabs: [
                { id: 'mutant', group: 'sheet', label: 'MCC.Mutant' },
                { id: 'spells', group: 'sheet', label: 'MCC.Mutations' },
                { id: 'skills', group: 'sheet', label: 'DCC.Skills' }
            ],
            initial: 'character'
        }
    }

    /** @inheritDoc */
    static PARTS = {
        tabs: {
            template: 'systems/dcc/templates/actor-partial-tabs.html'
        },
        character: {
            template: 'systems/dcc/templates/actor-partial-pc-common.html'
        },
        equipment: {
            template: 'systems/dcc/templates/actor-partial-pc-equipment.html'
        },
        mutant: {
            template: 'modules/mcc-classes/templates/actor-partial-mutant.html'
        },
        spells: {
            template: 'modules/mcc-classes/templates/actor-partial-mutations.html'
        },
        skills: {
            template: 'systems/dcc/templates/actor-partial-skills.html'
        },
        notes: {
            template: 'systems/dcc/templates/actor-partial-pc-notes.html'
        }
    }

    /** @override */
    async _prepareContext(options) {
        const context = await super._prepareContext(options)
        const updates = {}

        if (context.system.details.sheetClass !== 'Mutant') {
            updates['system.class.className'] = game.i18n.localize('MCC.Mutant')
            updates['system.config.showSkills'] = true
            updates['system.details.sheetClass'] = 'Mutant'
            updates['system.details.critRange'] = 20
            updates['system.class.spellCheckAbility'] = ''
        }

        // Add in Mutant specific data if missing.
        // §9.2a: Mutant Horror is an additive initiative die, not a flat bonus.
        // DCC recomputes system.attributes.init.value from agl.mod every prepare
        // (actor.js computeInitiative) and parseInt()s it, so the die can't live
        // there; instead we fold it into the init die formula (1d20+<die>), which
        // computeInitiative never touches and the init roll evaluates intact. The
        // bare die also lives in system.class.mutantHorror for a clean tab
        // display. Migrate existing actors off the old system.skills.mutantHorror.
        const horrorDie = context.system.class.mutantHorror?.value ??
            context.system.skills.mutantHorror?.value ?? '1d3'
        if (!context.system.class.mutantHorror) {
            updates['system.class.mutantHorror'] = {
                label: 'Mutant.MutantHorror',
                value: context.system.skills.mutantHorror?.value ?? '1d3'
            }
        }
        if (context.system.skills.mutantHorror) {
            updates['system.skills.-=mutantHorror'] = null
        }
        // Fold the horror die into the initiative die. Only set when init.die is
        // unset or still the plain '1d20' default, so we never clobber a value the
        // level-up flow wrote from level-data (e.g. '1d20+1d4+2' at higher levels).
        const initDie = context.system.attributes?.init?.die
        if (!initDie || initDie === '1d20') {
            updates['system.attributes.init.die'] = `1d20+${horrorDie}`
        }
        if (!context.system.skills.aiRecognition) {
            updates['system.skills.aiRecognition'] = {
                label: 'MCC.AIRecognition',
                value: '0'
            }
        }
        if (!context.system.class.archaicAlignment) {
            updates['system.class.archaicAlignment'] = {
                label: 'MCC.ArchaicAlignment',
                value: 'Clan of Cog'
            }
        }
        if (!context.system.class.mutantAppearance) {
            updates['system.class.mutantAppearance'] = {
                label: 'MCC.MutantAppearance',
                value: ''
            }
        }
        // Artifact check = 1d20 + INT mod + class bonus − CM per book Ch.7. The
        // `ability: 'int'` binding is what makes DCC's _resolveSkillCheck add the
        // INT mod (actor.js:1540). New actors get the full default; existing
        // actors get .ability patched in without clobbering custom values.
        if (!context.system.skills.artifactCheck) {
            updates['system.skills.artifactCheck'] = {
                label: 'MCC.ArtifactCheck',
                value: '+0',
                ability: 'int'
            }
        } else if (context.system.skills.artifactCheck.ability !== 'int') {
            updates['system.skills.artifactCheck.ability'] = 'int'
        }
        // §9.2b: maxTechLevel is a cap (which TL artifacts the class may
        // attempt), not a rollable check — it belongs in system.class, not
        // system.skills. Migrate existing actors off the old skills location.
        if (!context.system.class.maxTechLevel) {
            updates['system.class.maxTechLevel'] = {
                label: 'MCC.MaxTechLevel',
                value: context.system.skills.maxTechLevel?.value ?? '0'
            }
        }
        if (context.system.skills.maxTechLevel) {
            updates['system.skills.-=maxTechLevel'] = null
        }

        if (Object.keys(updates).length) {
            this.actor.update(updates)
        }
        return context
    }
}

export {
    ActorSheetMutant
}
