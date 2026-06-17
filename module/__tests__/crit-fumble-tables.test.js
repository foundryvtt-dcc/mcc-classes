/**
 * Unit coverage for the crit/fumble precedence enforcement
 * (module/crit-fumble-tables.mjs): pack promotion in a TablePackManager and
 * the end-to-end CONFIG.DCC override gated on mcc-core-book being active.
 */

import { describe, test, expect, vi, afterEach } from 'vitest'
import TablePackManager from '../table-pack-manager.js'
import {
  promotePackToFront,
  enforceMccCritFumblePrecedence,
  MCC_CRIT_FUMBLE_PACK,
  MCC_FUMBLE_TABLE_PATH
} from '../crit-fumble-tables.mjs'

describe('promotePackToFront', () => {
  test('moves an existing pack to the front, preserving the rest in order', () => {
    const m = new TablePackManager()
    m.addPack('dcc-core-book.dcc-core-crits-and-fumbles')
    m.addPack(MCC_CRIT_FUMBLE_PACK)
    m.addPack('homebrew.extra-crits')

    expect(promotePackToFront(m, MCC_CRIT_FUMBLE_PACK)).toBe(true)
    expect(m.packs).toEqual([
      MCC_CRIT_FUMBLE_PACK,
      'dcc-core-book.dcc-core-crits-and-fumbles',
      'homebrew.extra-crits'
    ])
  })

  test('preserves the fromSystemConfig flag of every entry across the reorder', () => {
    const m = new TablePackManager()
    m.addPack('dcc.user-configured-crits', true) // system-config slot
    m.addPack(MCC_CRIT_FUMBLE_PACK)

    promotePackToFront(m, MCC_CRIT_FUMBLE_PACK)

    expect(m.packs[0]).toBe(MCC_CRIT_FUMBLE_PACK)
    expect(m._packs[MCC_CRIT_FUMBLE_PACK].fromSystemConfig).toBe(false)
    expect(m._packs['dcc.user-configured-crits'].fromSystemConfig).toBe(true)
  })

  test('is a no-op (returns true) when the pack is already first', () => {
    const m = new TablePackManager()
    m.addPack(MCC_CRIT_FUMBLE_PACK)
    m.addPack('dcc-core-book.dcc-core-crits-and-fumbles')
    const before = m.packs
    expect(promotePackToFront(m, MCC_CRIT_FUMBLE_PACK)).toBe(true)
    expect(m.packs).toEqual(before)
  })

  test('returns false when the pack is not registered', () => {
    const m = new TablePackManager()
    m.addPack('dcc-core-book.dcc-core-crits-and-fumbles')
    expect(promotePackToFront(m, MCC_CRIT_FUMBLE_PACK)).toBe(false)
    expect(m.packs).toEqual(['dcc-core-book.dcc-core-crits-and-fumbles'])
  })

  test('guards null manager / empty pack name', () => {
    expect(promotePackToFront(null, MCC_CRIT_FUMBLE_PACK)).toBe(false)
    expect(promotePackToFront(new TablePackManager(), '')).toBe(false)
  })
})

describe('enforceMccCritFumblePrecedence', () => {
  afterEach(() => {
    delete globalThis.CONFIG
    delete globalThis.game
    vi.restoreAllMocks()
  })

  /** Build the global env: mcc-core-book active, both books' crit packs + a fumble path registered. */
  function setup ({ coreBookActive = true, fumbleSettingOn = true, fumbleStart = 'dcc-core-book.dcc-core-crits-and-fumbles.Table 4-2: Fumbles', critPacks = ['dcc-core-book.dcc-core-crits-and-fumbles', MCC_CRIT_FUMBLE_PACK] } = {}) {
    const manager = new TablePackManager()
    for (const p of critPacks) manager.addPack(p)

    globalThis.CONFIG = { DCC: { criticalHitPacks: manager, fumbleTable: fumbleStart } }
    globalThis.game = {
      modules: { get: vi.fn((id) => (id === 'mcc-core-book' ? { active: coreBookActive } : undefined)) },
      settings: {
        settings: new Map([['mcc-core-book.registerFumbleTable', {}]]),
        get: vi.fn((ns, key) => (ns === 'mcc-core-book' && key === 'registerFumbleTable' ? fumbleSettingOn : undefined))
      }
    }
    return manager
  }

  test('promotes the MCC crit pack ahead of dcc-core-book and forces the MCC fumble path', () => {
    const manager = setup()
    enforceMccCritFumblePrecedence()
    expect(manager.packs[0]).toBe(MCC_CRIT_FUMBLE_PACK)
    expect(CONFIG.DCC.fumbleTable).toBe(MCC_FUMBLE_TABLE_PATH)
  })

  test('does nothing when mcc-core-book is inactive', () => {
    const manager = setup({ coreBookActive: false })
    enforceMccCritFumblePrecedence()
    expect(manager.packs[0]).toBe('dcc-core-book.dcc-core-crits-and-fumbles')
    expect(CONFIG.DCC.fumbleTable).toBe('dcc-core-book.dcc-core-crits-and-fumbles.Table 4-2: Fumbles')
  })

  test('leaves the fumble path alone when mcc-core-book did not register a fumble table', () => {
    setup({ fumbleSettingOn: false })
    enforceMccCritFumblePrecedence()
    // Crit pack still promoted, but the fumble path is untouched.
    expect(CONFIG.DCC.criticalHitPacks.packs[0]).toBe(MCC_CRIT_FUMBLE_PACK)
    expect(CONFIG.DCC.fumbleTable).toBe('dcc-core-book.dcc-core-crits-and-fumbles.Table 4-2: Fumbles')
  })

  test('does not promote a crit pack that mcc-core-book never registered', () => {
    const manager = setup({ critPacks: ['dcc-core-book.dcc-core-crits-and-fumbles'] })
    enforceMccCritFumblePrecedence()
    expect(manager.packs).toEqual(['dcc-core-book.dcc-core-crits-and-fumbles'])
  })
})
