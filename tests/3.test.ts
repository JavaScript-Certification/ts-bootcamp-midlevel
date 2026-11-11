import { readFileSync } from 'node:fs'
import { describe as group, expect, it, vi } from 'vitest'

// importing the exercise prints tonight's tickets: capture them to check the output
const log = vi.spyOn(console, 'log').mockImplementation(() => {})
const { book, cabinClasses, cabins, fare, fares, issue } = await import('#exercise/3')
const printed = log.mock.calls.map(([line]) => line)
const source = readFileSync(new URL(`../src/3-${process.env.SOLUTION ? 'end' : 'begin'}.ts`, import.meta.url), 'utf8')

const ada = book({ passenger: 'Ada', cabin: '14D', nights: 1, breakfast: true }, 1)
const grace = book({ passenger: 'Grace', cabin: '12C', nights: 2, breakfast: false }, 2)
const alan = book({ passenger: 'Alan', cabin: '11A', nights: 1, breakfast: true }, 3)

group('given', () => {
  it('books with an id and keeps the request', () => {
    expect(ada).toEqual({ id: 'ML-1', passenger: 'Ada', cabin: '14D', nights: 1, breakfast: true })
  })
})

group('step 1: cabin classes and fares', () => {
  it('keeps the three classes with as const', () => {
    expect(cabinClasses).toEqual(['seat', 'couchette', 'sleeper'])
    expect(source).toMatch(/\]\s*as const/)
  })

  it('has a fare for every class, checked with satisfies', () => {
    expect(fares).toEqual({ seat: 39, couchette: 69, sleeper: 129 })
    expect(source).toMatch(/\}\s*satisfies Record<CabinClass, number>/)
  })
})

group('step 2: types derived with utility types', () => {
  it('derives BookingRequest and Ticket instead of copying them', () => {
    expect(source).toMatch(/BookingRequest = Omit<Booking, 'id'>/)
    expect(source).toMatch(/Ticket = Readonly<ReturnType<typeof issue>>/)
  })
})

group('step 3: cabins and fare', () => {
  it('keeps the cabins, checked with satisfies instead of an annotation', () => {
    expect(cabins).toEqual({
      '11A': { car: 11, class: 'seat' },
      '12C': { car: 12, class: 'couchette' },
      '14D': { car: 14, class: 'sleeper' },
    })
    expect(source).toMatch(/\}\s*satisfies Record<string, Cabin>/)
    expect(source).not.toMatch(/cabins:\s*Record/)
  })

  it('prices a sleeper with breakfast', () => {
    expect(fare(ada)).toBe(141)
  })

  it('prices every night, with or without breakfast', () => {
    expect(fare(grace)).toBe(138)
    expect(fare(alan)).toBe(51)
  })

  it('issues a ticket with its total', () => {
    expect(issue(ada)).toEqual({ id: 'ML-1', passenger: 'Ada', cabin: '14D', total: 141 })
  })

  it('prints tonight\'s tickets', () => {
    expect(printed).toEqual([
      'Moonline 1407, Paris Est 19:42 to Wien Hbf 09:58',
      'ML-1 Ada, cabin 14D: 141 EUR',
      'ML-2 Grace, cabin 12C: 138 EUR',
      'ML-3 Alan, cabin 11A: 51 EUR',
      'Total: 330 EUR',
    ])
  })
})

group('no shortcuts', () => {
  it('uses no any and no ts-ignore', () => {
    expect(source).not.toMatch(/\bany\b/)
    expect(source).not.toMatch(/@ts-(ignore|nocheck|expect-error)/)
  })
})
