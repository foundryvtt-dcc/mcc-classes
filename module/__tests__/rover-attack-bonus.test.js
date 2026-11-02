import { describe, expect, it } from 'vitest'
import { roverAttackBonusUpdates } from '../rover-attack-bonus.mjs'

const detailsFor = (attackBonus, melee, missile) => ({
    attackBonus,
    attackHitBonus: { melee: { adjustment: melee }, missile: { adjustment: missile } }
})

describe('roverAttackBonusUpdates', () => {
    it('splits a slash bonus and keeps a hand-set missile adjustment', () => {
        expect(roverAttackBonusUpdates(detailsFor('+7/+10', '+0', '+2'))).toEqual({
            'system.details.attackBonus': '+7',
            'system.details.attackHitBonus.missile.adjustment': '+5'
        })
    })

    it('repairs an imported pregen with the slash value in its adjustments', () => {
        expect(roverAttackBonusUpdates(detailsFor('+0/+1', '+0/+1', '+0/+1'))).toEqual({
            'system.details.attackBonus': '+0',
            'system.details.attackHitBonus.melee.adjustment': '+0',
            'system.details.attackHitBonus.missile.adjustment': '+1'
        })
    })

    it('leaves a migrated actor alone', () => {
        expect(roverAttackBonusUpdates(detailsFor('+7', '+0', '+3'))).toEqual({})
    })
})
