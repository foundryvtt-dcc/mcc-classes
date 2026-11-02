/**
 * Rovers have separate melee and missile attack bonuses (MCC Table 2-4). Level
 * data used to store them as "+0/+1" in system.details.attackBonus, but DCC
 * parseInt()s that field for both attack types, so missile attacks lost their
 * higher bonus. The level data now uses attackBonus for melee and
 * attackHitBonus.missile.adjustment for the difference.
 *
 * @param {object} details - The actor's source (not derived) system.details.
 *   DCC's prepared data can turn a "+0/+1" attack bonus into "+0".
 * @returns {object} Actor update data, empty if the actor is already migrated.
 */
export function roverAttackBonusUpdates(details) {
    const match = String(details?.attackBonus ?? '').match(/^([+-]?\d+)\/([+-]?\d+)$/)
    if (!match) return {}

    const signed = (value) => `${value >= 0 ? '+' : ''}${value}`
    const [, melee, missile] = match
    const missileDifference = parseInt(missile) - parseInt(melee)
    const adjustments = details.attackHitBonus ?? {}
    const updates = {
        'system.details.attackBonus': melee,
        'system.details.attackHitBonus.missile.adjustment':
            signed((parseInt(adjustments.missile?.adjustment) || 0) + missileDifference)
    }
    // Imported pregens also copied the slash value into the melee adjustment.
    if (String(adjustments.melee?.adjustment ?? '').includes('/')) {
        updates['system.details.attackHitBonus.melee.adjustment'] = signed(parseInt(adjustments.melee.adjustment) || 0)
    }
    return updates
}
