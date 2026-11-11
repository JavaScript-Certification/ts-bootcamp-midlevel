import { readFileSync } from 'node:fs'
import { describe as group, expect, it, vi } from 'vitest'
import { feed, latest } from '../src/_internal/charger-feed'

// importing the exercise prints the board: keep the test output clean
vi.spyOn(console, 'log').mockImplementation(() => {})
const { assertIsCharger, board, describe, isCharger } = await import('#exercise/1')
const source = readFileSync(new URL(`../src/1-${process.env.SOLUTION ? 'end' : 'begin'}.ts`, import.meta.url), 'utf8')
const code = source.replace(/\/\/.*$/gm, '') // the starter shows the never check in a comment

// the Charger union of step 1 is a type: its checks are in tests/1.test-d.ts

group('step 1: describe', () => {
  it('describes an available charger', () => {
    expect(describe({ id: 'C1', status: 'available' })).toBe('C1: available')
  })

  it('describes a charging charger', () => {
    expect(describe({ id: 'C2', status: 'charging', vehicle: 'EV-204', kWh: 18.5 })).toBe('C2: charging EV-204, 18.5 kWh')
  })

  it('describes a faulted charger', () => {
    expect(describe({ id: 'C3', status: 'faulted', code: 'E42' })).toBe('C3: out of order (E42)')
  })

  it('keeps a never check in the default branch', () => {
    expect(code).toMatch(/:\s*never\s*=\s*charger\b/)
  })
})

group('step 2: isCharger and assertIsCharger', () => {
  it('accepts the available, charging and faulted records', () => {
    expect(isCharger(feed[0])).toBe(true)
    expect(isCharger(feed[1])).toBe(true)
    expect(isCharger(feed[2])).toBe(true)
  })

  it('rejects a charging record without kWh', () => {
    expect(isCharger(feed[3])).toBe(false)
  })

  it('rejects null and an unknown status', () => {
    expect(isCharger(null)).toBe(false)
    expect(isCharger({ id: 'C9', status: 'broken' })).toBe(false)
  })

  it('throws "Invalid charger record" on a bad record', () => {
    expect(() => assertIsCharger({ id: 'C4' })).toThrow('Invalid charger record')
  })

  it('returns quietly on a valid record', () => {
    expect(() => assertIsCharger(latest)).not.toThrow()
  })
})

group('step 3: the reserved state', () => {
  it('accepts and describes a reserved charger', () => {
    expect(isCharger(feed[4])).toBe(true)
    expect(describe({ id: 'C5', status: 'reserved', until: '18:30' })).toBe('C5: reserved until 18:30')
  })

  it('prints the whole board', () => {
    expect(board(feed, latest)).toEqual([
      'C1: available',
      'C2: charging EV-204, 18.5 kWh',
      'C3: out of order (E42)',
      'C5: reserved until 18:30',
      '2 records rejected',
      'Latest: C2: charging EV-204, 21 kWh',
    ])
  })
})

group('no shortcuts', () => {
  it('uses no any and no ts-ignore', () => {
    expect(source).not.toMatch(/\bany\b/)
    expect(source).not.toMatch(/@ts-(ignore|nocheck|expect-error)/)
  })
})
