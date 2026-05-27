/**
 * Unit coverage for the MCC content-table scaffold (module/mcc-tables.mjs):
 * the category registry definition and the world-tables-first resolver.
 */

import { describe, test, expect, vi, afterEach } from 'vitest'
import {
  resolveMccTable,
  MCC_TABLE_CATEGORIES,
  MCC_TABLE_HOOKS,
  registerMccTableHooks,
  seedMccTablePacksFromSettings
} from '../mcc-tables.mjs'

describe('MCC_TABLE_CATEGORIES integrity', () => {
  test('declares the five content-table categories with unique keys/hooks/settings', () => {
    expect(MCC_TABLE_CATEGORIES).toHaveLength(5)
    const keys = MCC_TABLE_CATEGORIES.map((c) => c.registryKey)
    const hooks = MCC_TABLE_CATEGORIES.map((c) => c.hook)
    const settings = MCC_TABLE_CATEGORIES.map((c) => c.setting)
    expect(new Set(keys).size).toBe(5)
    expect(new Set(hooks).size).toBe(5)
    expect(new Set(settings).size).toBe(5)
    expect(keys).toContain('patronTaintPacks')
    expect(hooks).toContain('mcc.registerPatronTaintPack')
  })

  test('every hook is namespaced under the mcc.register* channel', () => {
    for (const c of MCC_TABLE_CATEGORIES) {
      expect(c.hook.startsWith('mcc.register')).toBe(true)
    }
  })
})

describe('resolveMccTable precedence', () => {
  afterEach(() => {
    delete globalThis.game
  })

  test('returns null for an empty table name without touching globals', async () => {
    expect(await resolveMccTable({ packs: [] }, '')).toBe(null)
  })

  test('world tables win over compendium packs of the same name', async () => {
    const worldTable = { name: 'Patron Taint: UKUR' }
    globalThis.game = { tables: [worldTable], packs: { get: vi.fn() } }
    const result = await resolveMccTable({ packs: ['mcc-core-book.mcc-core-disapproval'] }, 'Patron Taint: UKUR')
    expect(result).toBe(worldTable)
    expect(globalThis.game.packs.get).not.toHaveBeenCalled()
  })

  test('falls back to a registered compendium pack when no world table matches', async () => {
    const packTable = { name: 'Patron Taint: UKUR' }
    const pack = {
      documentName: 'RollTable',
      index: [{ name: 'Patron Taint: UKUR', _id: 'abc' }],
      getDocument: vi.fn().mockResolvedValue(packTable)
    }
    globalThis.game = { tables: [], packs: { get: vi.fn().mockReturnValue(pack) } }
    const result = await resolveMccTable({ packs: ['mcc-core-book.mcc-core-disapproval'] }, 'Patron Taint: UKUR')
    expect(result).toBe(packTable)
    expect(pack.getDocument).toHaveBeenCalledWith('abc')
  })

  test('skips non-RollTable packs', async () => {
    const pack = { documentName: 'Item', index: [], getDocument: vi.fn() }
    globalThis.game = { tables: [], packs: { get: vi.fn().mockReturnValue(pack) } }
    const result = await resolveMccTable({ packs: ['some.items'] }, 'Patron Taint: UKUR')
    expect(result).toBe(null)
    expect(pack.getDocument).not.toHaveBeenCalled()
  })

  test('returns null when neither world nor pack has the table', async () => {
    globalThis.game = { tables: [], packs: { get: vi.fn().mockReturnValue(undefined) } }
    expect(await resolveMccTable({ packs: ['some.pack'] }, 'Nonexistent')).toBe(null)
  })
})

describe('registerMccTableHooks', () => {
  afterEach(() => {
    delete globalThis.CONFIG
    delete globalThis.Hooks
  })

  test('creates a registry per category and registers each mcc.register*Pack listener', () => {
    const on = vi.fn()
    globalThis.CONFIG = {}
    globalThis.Hooks = { on }

    registerMccTableHooks()

    for (const c of MCC_TABLE_CATEGORIES) {
      expect(globalThis.CONFIG.MCC[c.registryKey]).toBeDefined()
      expect(Array.isArray(globalThis.CONFIG.MCC[c.registryKey].packs)).toBe(true)
      expect(on).toHaveBeenCalledWith(c.hook, expect.any(Function))
    }
    expect(on).toHaveBeenCalledTimes(MCC_TABLE_CATEGORIES.length)
  })
})

describe('MCC_TABLE_HOOKS handlers', () => {
  afterEach(() => {
    delete globalThis.CONFIG
  })

  test('a register*Pack handler adds the pack to its own registry', () => {
    globalThis.CONFIG = {}
    MCC_TABLE_HOOKS['mcc.registerPatronTaintPack']('some.taint.pack')
    expect(globalThis.CONFIG.MCC.patronTaintPacks.packs).toContain('some.taint.pack')
  })
})

describe('seedMccTablePacksFromSettings', () => {
  afterEach(() => {
    delete globalThis.CONFIG
    delete globalThis.game
  })

  test('seeds each registry from its world setting, ignoring blanks', () => {
    globalThis.CONFIG = {}
    const values = {
      mutationTablesCompendium: 'my.mutations',
      aiProgramTablesCompendium: '',
      artifactTablesCompendium: '',
      glowburnCompendium: '',
      patronTaintCompendium: 'my.taint'
    }
    globalThis.game = { settings: { get: vi.fn((scope, key) => values[key]) } }

    seedMccTablePacksFromSettings()

    expect(globalThis.CONFIG.MCC.mutationTablePacks.packs).toContain('my.mutations')
    expect(globalThis.CONFIG.MCC.patronTaintPacks.packs).toContain('my.taint')
    // Blank settings create no pack entry.
    expect(globalThis.CONFIG.MCC.aiProgramTablePacks?.packs ?? []).toEqual([])
  })
})
