/**
 * MCC Classes Data Migrations
 * Handles migration of actor data between module versions
 */

/**
 * Run all necessary migrations for the module
 */
export async function runMigrations() {
    const currentVersion = game.modules.get('mcc-classes')?.version ?? '0.0.0'
    const lastMigrationVersion = game.settings.get('mcc-classes', 'lastMigrationVersion') ?? '0.0.0'

    if (foundry.utils.isNewerVersion(currentVersion, lastMigrationVersion)) {
        console.log(`MCC | Running migrations from ${lastMigrationVersion} to ${currentVersion}`)

        // Migration for roverMissleAttack -> roverMissileAttack typo fix
        if (foundry.utils.isNewerVersion('1.0.1', lastMigrationVersion)) {
            await migrateRoverMissileAttackTypo()
        }

        // Update the last migration version
        await game.settings.set('mcc-classes', 'lastMigrationVersion', currentVersion)
        console.log(`MCC | Migrations complete`)
    }
}

/**
 * Migrate roverMissleAttack (typo) to roverMissileAttack (correct spelling)
 * This fixes data for Rover characters that were created with the misspelled property
 */
async function migrateRoverMissileAttackTypo() {
    console.log('MCC | Migrating roverMissleAttack -> roverMissileAttack')

    const actors = game.actors.filter(a =>
        a.type === 'Player' &&
        a.system?.details?.sheetClass === 'Rover' &&
        a.system?.skills?.roverMissleAttack &&
        !a.system?.skills?.roverMissileAttack
    )

    if (actors.length === 0) {
        console.log('MCC | No actors require roverMissileAttack migration')
        return
    }

    console.log(`MCC | Found ${actors.length} Rover actor(s) to migrate`)

    for (const actor of actors) {
        const oldValue = actor.system.skills.roverMissleAttack
        await actor.update({
            'system.skills.roverMissileAttack': oldValue,
            'system.skills.-=roverMissleAttack': null
        })
        console.log(`MCC | Migrated actor "${actor.name}" roverMissleAttack -> roverMissileAttack`)
    }

    console.log('MCC | roverMissileAttack migration complete')
}
