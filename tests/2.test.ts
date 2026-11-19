import { readFileSync } from 'node:fs'
import { describe as group, expect, it, vi } from 'vitest'
import { dishes, trucks, volunteers } from '../src/_internal/food-truck-rally'

// importing the exercise prints the board: keep the test output clean
vi.spyOn(console, 'log').mockImplementation(() => {})
const { findById, quickest, route } = await import('#exercise/2')
const source = readFileSync(new URL(`../src/2-${process.env.SOLUTION ? 'end' : 'begin'}.ts`, import.meta.url), 'utf8')

// Generics change the types, not what runs: these groups check the bodies still work.
// The type checks of each step are in tests/2.test-d.ts.

group('step 1: quickest', () => {
  it('finds the shortest queue and the fastest dish', () => {
    expect(quickest(trucks)?.name).toBe('Bao Down')
    expect(quickest(dishes)?.name).toBe('Cream tea')
  })
})

group('step 2: Lookup', () => {
  it('findById returns a found or a not found result', () => {
    expect(findById(volunteers, 'V2')).toEqual({ found: true, value: volunteers[1] })
    expect(findById(trucks, 'T9')).toEqual({ found: false, error: 'No match for T9' })
  })
})

group('step 3: route', () => {
  it('keeps the stops in order', () => {
    expect(route(['T2', 'T4', 'T1'])).toEqual(['T2', 'T4', 'T1'])
  })
})

group('the board', () => {
  it('prints the whole board', () => {
    const shortQueue = quickest(trucks)
    const fastDish = quickest(dishes)
    const missing = findById(trucks, 'T9')
    const tour = route(['T2', 'T4', 'T1']).map(id => {
      const stop = findById(trucks, id)
      return stop.found ? stop.value.name : stop.error
    })
    expect([
      `Opening truck: ${trucks[0]?.name}`,
      `Shortest queue: ${shortQueue?.name}, ${shortQueue?.minutes} min`,
      `Fastest dish: ${fastDish?.name}, ${fastDish?.minutes} min`,
      `T9: ${missing.found ? missing.value.name : missing.error}`,
      `Tasting route: ${tour.join(' > ')}`,
    ]).toEqual([
      'Opening truck: Taco Loco',
      'Shortest queue: Bao Down, 4 min',
      'Fastest dish: Cream tea, 2 min',
      'T9: No match for T9',
      'Tasting route: Bao Down > Curry Up > Taco Loco',
    ])
  })
})

group('no any and no ts-ignore', () => {
  it('uses no any and no ts-ignore', () => {
    expect(source).not.toMatch(/\bany\b/)
    expect(source).not.toMatch(/@ts-(ignore|nocheck|expect-error)/)
  })
})
