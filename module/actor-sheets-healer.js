/**
 * MCC Healer character sheet overrides
 */

import DCCActorSheet from '/systems/dcc/module/actor-sheet.js'

/**
 * Extend the DCC actor sheet for MCC Healer
 * @extends {DCCActorSheet}
 */
class ActorSheetHealer extends DCCActorSheet {
    /** @inheritDoc */
    static DEFAULT_OPTIONS = {
        classes: ['dcc', 'sheet', 'actor', 'pc', 'healer'],
        position: {
            height: 635
        }
    }

    /** @inheritDoc */
    static CLASS_TABS = {
        sheet: {
            tabs: [
                { id: 'healer', group: 'sheet', label: 'MCC.Healer' },
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
        healer: {
            template: 'modules/mcc-classes/templates/actor-partial-healer.html'
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

        if (context.system.details.sheetClass !== 'Healer') {
            updates['system.class.className'] = game.i18n.localize('MCC.Healer')
            updates['system.config.showSkills'] = true
            updates['system.details.sheetClass'] = 'Healer'
            updates['system.details.critRange'] = 20
        }
        // Healers have no caster mechanic per book Ch.2 — Naturopathy is a skill,
        // not a spell — so we deliberately do NOT assign spellCheckAbility here.
        // Existing actors created before §9.1b may still carry the vestigial
        // 'per' value; it's cosmetic (Healers never roll a spell check) and
        // gets cleared on any deliberate field reset.

        // Add in Healer specific data if missing
        if (!context.system.skills.naturopathy) {
            updates['system.skills.naturopathy'] = {
                label: 'Healer.Naturopathy',
                value: '1d3 x2'
            }
        }
        if (!context.system.skills.aiRecognition) {
            updates['system.skills.aiRecognition'] = {
                label: 'MCC.AIRecognition',
                value: '+2'
            }
        }
        if (!context.system.class.archaicAlignment) {
            updates['system.class.archaicAlignment'] = {
                label: 'MCC.ArchaicAlignment',
                value: 'Clan of Cog'
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
        if (!context.system.skills.maxTechLevel) {
            updates['system.skills.maxTechLevel'] = {
                label: 'MCC.MaxTechLevel',
                value: '0'
            }
        }

        if (Object.keys(updates).length) {
            this.actor.update(updates)
        }
        return context
    }
}

export {
    ActorSheetHealer
}
