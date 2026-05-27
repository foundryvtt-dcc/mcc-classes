/**
 * Unit coverage for the MCC Glowburn manifestation handler
 * (module/glowburn.mjs). Invokes the handler's pieces directly with per-test
 * globalThis stubs, mirroring patron-taint.test.js.
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { patronFromProgram, onSpellCheckResult, registerGlowburnHandler } from '../glowburn.mjs'

describe('patronFromProgram', () => {
  test('reads the programPatron flag for any patron program (uppercased)', () => {
    expect(patronFromProgram({ name: 'Chain Lightning', flags: { 'mcc-core-book': { programPatron: 'gaea' } } })).toBe('GAEA')
    expect(patronFromProgram({ name: 'Invoke Patron AI (ME10)', flags: { 'mcc-core-book': { programPatron: 'me10' } } })).toBe('ME10')
  })

  test('falls back to parsing an Invoke Patron AI name when the flag is absent', () => {
    expect(patronFromProgram({ name: 'Invoke Patron AI (UKUR)' })).toBe('UKUR')
  })

  test('returns null for a non-patron item (e.g. a mutation) or missing item', () => {
    expect(patronFromProgram({ name: 'Heightened Strength' })).toBe(null)
    expect(patronFromProgram(undefined)).toBe(null)
  })
})

describe('onSpellCheckResult', () => {
  let drawSpy, warnSpy

  beforeEach(() => {
    drawSpy = vi.fn().mockResolvedValue({})
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    globalThis.CONFIG = { MCC: { glowburnPacks: { packs: [] } } }
    globalThis.game = {
      settings: { get: vi.fn().mockReturnValue('publicroll') },
      tables: [{ name: 'Glowburn: GAEA', draw: drawSpy }],
      packs: { get: vi.fn() }
    }
  })

  afterEach(() => {
    warnSpy.mockRestore()
    delete globalThis.CONFIG
    delete globalThis.game
  })

  test('draws the patron glowburn table when ability points were burned on a patron program', async () => {
    const item = { name: 'Chain Lightning', flags: { 'mcc-core-book': { programPatron: 'gaea' } } }
    await onSpellCheckResult({ name: 'Shaman' }, { item, spellburn: 2 })
    expect(drawSpy).toHaveBeenCalledTimes(1)
    expect(drawSpy).toHaveBeenCalledWith({ rollMode: 'publicroll' })
  })

  test('does nothing when no ability points were burned (glowburn not used)', async () => {
    const item = { name: 'Chain Lightning', flags: { 'mcc-core-book': { programPatron: 'gaea' } } }
    await onSpellCheckResult({}, { item, spellburn: 0 })
    expect(drawSpy).not.toHaveBeenCalled()
  })

  test('does nothing for a non-patron program even when glowburn was used (e.g. a mutant burning on a mutation)', async () => {
    await onSpellCheckResult({}, { item: { name: 'Heightened Strength' }, spellburn: 3 })
    expect(drawSpy).not.toHaveBeenCalled()
  })

  test('does nothing when there is no item in the payload', async () => {
    await onSpellCheckResult({}, { spellburn: 2 })
    expect(drawSpy).not.toHaveBeenCalled()
  })

  test('warns and skips when no glowburn table resolves', async () => {
    globalThis.game.tables = []
    const item = { name: 'Invoke Patron AI (ACHROMA)', flags: { 'mcc-core-book': { programPatron: 'achroma' } } }
    await onSpellCheckResult({}, { item, spellburn: 1 })
    expect(drawSpy).not.toHaveBeenCalled()
    expect(warnSpy).toHaveBeenCalled()
  })
})

describe('registerGlowburnHandler', () => {
  test('registers a dcc.afterSpellCheckResult listener', () => {
    const on = vi.fn()
    globalThis.Hooks = { on }
    registerGlowburnHandler()
    expect(on).toHaveBeenCalledWith('dcc.afterSpellCheckResult', expect.any(Function))
    delete globalThis.Hooks
  })
})
