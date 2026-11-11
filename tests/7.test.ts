import { readFileSync } from 'node:fs'
import { describe as group, expect, it, vi } from 'vitest'
import { tonight } from '../src/_internal/rooftop-programme'

// importing the exercise prints the board: keep the test output clean
vi.spyOn(console, 'log').mockImplementation(() => {})
const { board, describe, filmFor } = await import('#exercise/7')
const source = readFileSync(new URL(`../src/7-${process.env.SOLUTION ? 'end' : 'begin'}.ts`, import.meta.url), 'utf8')

group('step 1: a type-only import', () => {
  it('imports Screening from the programme with the type keyword', () => {
    expect(source).toMatch(/import\s+type\s*\{[^}]*\bScreening\b[^}]*\}\s*from\s*'\.\/_internal\/rooftop-programme'|import\s*\{[^}]*\btype\s+Screening\b[^}]*\}\s*from\s*'\.\/_internal\/rooftop-programme'/)
  })

  it('no longer declares its own Screening type', () => {
    expect(source).not.toMatch(/type\s+Screening\s*=/)
  })
})

group('step 2: the ReelBox global', () => {
  it('is described with declare const, not left unknown', () => {
    expect(source).toMatch(/declare\s+const\s+ReelBox\s*:\s*\{/)
  })

  it('finds the film on a reel', () => {
    expect(filmFor('R-1975')).toEqual({ title: 'Jaws', year: 1975, minutes: 124 })
  })

  it('returns null for a reel that is not in the box', () => {
    expect(filmFor('R-0404')).toBeNull()
  })

  it('lets describe show the film', () => {
    expect(describe({ time: '19:30', reel: 'R-1975' })).toBe('19:30 Jaws (1975), 124 min')
  })
})

group('given: describe', () => {
  it('describes a missing reel without crashing', () => {
    expect(describe({ time: '21:45', reel: 'R-0404' })).toBe('21:45 reel R-0404 is missing')
  })
})

group('step 3: the board', () => {
  it('prints tonight', () => {
    expect(board(tonight)).toEqual([
      'Now showing: 19:30 Jaws (1975), 124 min',
      'Later: 21:45 reel R-0404 is missing',
      'Later: 23:50 Spirited Away (2001), 125 min',
    ])
  })

  it('handles an empty programme', () => {
    expect(board([])).toEqual(['Nothing on tonight'])
  })
})

group('no any and no ts-ignore', () => {
  it('uses no any, no ts-ignore and no cast on ReelBox', () => {
    expect(source).not.toMatch(/\bany\b/)
    expect(source).not.toMatch(/@ts-(ignore|nocheck|expect-error)/)
    expect(source).not.toMatch(/ReelBox\s+as\b/)
  })
})
