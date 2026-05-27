/**
 * Unit coverage for the ported pack registry (module/table-pack-manager.js).
 * Mirrors DCC's TablePackManager semantics: de-duplication, a single
 * "from config" slot, and update-hook notification.
 */

import { describe, test, expect, vi } from 'vitest'
import TablePackManager from '../table-pack-manager.js'

describe('TablePackManager', () => {
  test('addPack stores a pack and the packs getter lists it', () => {
    const m = new TablePackManager()
    m.addPack('a.b')
    expect(m.packs).toEqual(['a.b'])
  })

  test('ignores falsy pack names', () => {
    const m = new TablePackManager()
    m.addPack('')
    m.addPack(undefined)
    expect(m.packs).toEqual([])
  })

  test('de-duplicates the same pack name', () => {
    const m = new TablePackManager()
    m.addPack('a.b')
    m.addPack('a.b')
    expect(m.packs).toEqual(['a.b'])
  })

  test('keeps only one "from config" pack — latest wins', () => {
    const m = new TablePackManager()
    m.addPack('setting.first', true)
    m.addPack('setting.second', true)
    expect(m.packs).toEqual(['setting.second'])
  })

  test('replacing the config pack leaves module-broadcast packs intact', () => {
    const m = new TablePackManager()
    m.addPack('module.pack', false)
    m.addPack('setting.first', true)
    m.addPack('setting.second', true)
    expect(m.packs).toContain('module.pack')
    expect(m.packs).toContain('setting.second')
    expect(m.packs).not.toContain('setting.first')
  })

  test('removePack drops a pack', () => {
    const m = new TablePackManager()
    m.addPack('a.b')
    m.removePack('a.b')
    expect(m.packs).toEqual([])
  })

  test('notifies the updateHook on add and remove', () => {
    const updateHook = vi.fn()
    const m = new TablePackManager({ updateHook })
    m.addPack('a.b')
    m.removePack('a.b')
    expect(updateHook).toHaveBeenCalledTimes(2)
    expect(updateHook).toHaveBeenCalledWith(m)
  })
})
