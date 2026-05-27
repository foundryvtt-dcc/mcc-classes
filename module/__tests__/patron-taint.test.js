/**
 * Unit coverage for the MCC Patron Taint handler (module/patron-taint.mjs).
 *
 * The handler consumes the DCC `dcc.afterSpellCheckResult` hook; here we
 * invoke its pieces directly with per-test globalThis stubs (mirroring DCC's
 * settings-table-hooks.test.js style), since a live Foundry boot isn't
 * available.
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { patronFromInvokeItem, onSpellCheckResult, registerPatronTaintHandler } from '../patron-taint.mjs'

describe('patronFromInvokeItem', () => {
  test('prefers the programPatron flag, uppercased to match the table-name suffix', () => {
    const item = { name: 'Invoke Patron AI (HALE-E)', flags: { 'mcc-core-book': { programPatron: 'hale-e' } } }
    expect(patronFromInvokeItem(item)).toBe('HALE-E')
  })

  test('handles a numeric-suffix patron (ME10)', () => {
    const item = { name: 'Invoke Patron AI (ME10)', flags: { 'mcc-core-book': { programPatron: 'me10' } } }
    expect(patronFromInvokeItem(item)).toBe('ME10')
  })

  test('falls back to parsing the item name when the flag is absent (homebrew Invoke item)', () => {
    expect(patronFromInvokeItem({ name: 'Invoke Patron AI (UKUR)' })).toBe('UKUR')
  })

  test('returns null for a non-Invoke item or missing item', () => {
    expect(patronFromInvokeItem({ name: 'Heightened Strength' })).toBe(null)
    expect(patronFromInvokeItem(undefined)).toBe(null)
  })
})

describe('onSpellCheckResult', () => {
  let drawSpy, warnSpy

  beforeEach(() => {
    drawSpy = vi.fn().mockResolvedValue({})
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    globalThis.CONFIG = { MCC: { patronTaintPacks: { packs: [] } } }
    globalThis.game = {
      settings: { get: vi.fn().mockReturnValue('publicroll') },
      tables: [{ name: 'Patron Taint: HALE-E', draw: drawSpy }],
      packs: { get: vi.fn() }
    }
  })

  afterEach(() => {
    warnSpy.mockRestore()
    delete globalThis.CONFIG
    delete globalThis.game
  })

  test('rolls the patron taint table on a natural 1 of an Invoke Patron AI cast', async () => {
    const item = { name: 'Invoke Patron AI (HALE-E)', flags: { 'mcc-core-book': { programPatron: 'hale-e' } } }
    await onSpellCheckResult({ name: 'Shaman' }, { item, naturalRoll: 1 })
    expect(drawSpy).toHaveBeenCalledTimes(1)
    expect(drawSpy).toHaveBeenCalledWith({ rollMode: 'publicroll' })
  })

  test('does nothing when the natural roll is not 1', async () => {
    const item = { name: 'Invoke Patron AI (HALE-E)', flags: { 'mcc-core-book': { programPatron: 'hale-e' } } }
    await onSpellCheckResult({}, { item, naturalRoll: 7 })
    expect(drawSpy).not.toHaveBeenCalled()
  })

  test('does nothing for a non-Invoke spell even on a natural 1', async () => {
    await onSpellCheckResult({}, { item: { name: 'Heightened Strength' }, naturalRoll: 1 })
    expect(drawSpy).not.toHaveBeenCalled()
  })

  test('does nothing when there is no item in the payload', async () => {
    await onSpellCheckResult({}, { naturalRoll: 1 })
    expect(drawSpy).not.toHaveBeenCalled()
  })

  test('warns and skips when no taint table resolves (no world table, empty registry)', async () => {
    globalThis.game.tables = []
    const item = { name: 'Invoke Patron AI (GAEA)', flags: { 'mcc-core-book': { programPatron: 'gaea' } } }
    await onSpellCheckResult({}, { item, naturalRoll: 1 })
    expect(drawSpy).not.toHaveBeenCalled()
    expect(warnSpy).toHaveBeenCalled()
  })
})

describe('registerPatronTaintHandler', () => {
  test('registers a dcc.afterSpellCheckResult listener', () => {
    const on = vi.fn()
    globalThis.Hooks = { on }
    registerPatronTaintHandler()
    expect(on).toHaveBeenCalledWith('dcc.afterSpellCheckResult', expect.any(Function))
    delete globalThis.Hooks
  })
})
