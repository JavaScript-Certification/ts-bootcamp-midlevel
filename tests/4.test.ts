import { readFileSync } from 'node:fs'
import { describe as group, expect, it, vi } from 'vitest'

// importing the exercise prints the board: keep the test output clean
vi.spyOn(console, 'log').mockImplementation(() => {})
const { Attic, Team, Vault, Waitlist, audit, board } = await import('#exercise/4')
const source = readFileSync(new URL(`../src/4-${process.env.SOLUTION ? 'end' : 'begin'}.ts`, import.meta.url), 'utf8')

group('step 1: parameter properties and #code', () => {
  it('declares the team with readonly parameter properties', () => {
    expect(source).toMatch(/constructor\(\s*readonly name: string,\s*readonly players: number,?\s*\)\s*\{\s*\}/)
    const team = new Team('Night Owls', 3)
    expect(team.name).toBe('Night Owls')
    expect(team.players).toBe(3)
  })

  it('never shows the code to the lobby screen', () => {
    const vault = new Vault("Pharaoh's Vault", 'ANKH')
    expect(JSON.stringify(vault)).toBe('{"name":"Pharaoh\'s Vault","attempts":0}')
  })

  it('still checks the code', () => {
    const vault = new Vault("Pharaoh's Vault", 'ANKH')
    expect(vault.tryCode('SPHINX')).toBe(false)
    expect(vault.tryCode('ANKH')).toBe(true)
  })
})

group('step 2: an abstract Room', () => {
  it('is an abstract class that implements Resettable', () => {
    expect(source).toMatch(/abstract class Room implements Resettable/)
    expect(source).toMatch(/abstract hint\(\): string/)
  })

  it('lets each room give its own hint', () => {
    const attic = new Attic("Clockmaker's Attic", '1888')
    expect(attic.hint()).toBe('Count the chimes')
    attic.tryCode('1234')
    attic.tryCode('1066')
    expect(attic.hint()).toBe('The year is on the pendulum')
  })
})

group('given: the generic Waitlist and the isOccupied guard', () => {
  it('serves teams in order and returns the position on join', () => {
    const waitlist = new Waitlist<{ name: string }>()
    expect(waitlist.join({ name: 'A' })).toBe(1)
    expect(waitlist.join({ name: 'B' })).toBe(2)
    expect(waitlist.names()).toEqual(['A', 'B'])
    expect(waitlist.next()).toEqual({ name: 'A' })
    expect(waitlist.names()).toEqual(['B'])
  })

  it('returns undefined when nobody is waiting', () => {
    expect(new Waitlist<{ name: string }>().next()).toBeUndefined()
  })

  it('knows when a room is occupied', () => {
    const vault = new Vault("Pharaoh's Vault", 'ANKH')
    expect(vault.isOccupied()).toBe(false)
    vault.checkIn(new Team('Night Owls', 3))
    expect(vault.isOccupied()).toBe(true)
  })
})

group('step 3: the logged decorator', () => {
  it('decorates tryCode with @logged', () => {
    expect(source).toMatch(/@logged\s+tryCode\(/)
  })

  it('records every code attempt in the audit, and keeps the result', () => {
    const vault = new Vault("Pharaoh's Vault", 'ANKH')
    expect(vault.tryCode('SPHINX')).toBe(false)
    expect(audit.at(-1)).toBe("Pharaoh's Vault: tryCode(SPHINX) returned false")
    expect(vault.tryCode('ANKH')).toBe(true)
    expect(audit.at(-1)).toBe("Pharaoh's Vault: tryCode(ANKH) returned true")
  })

  it('prints the whole board', () => {
    audit.length = 0
    const attic = new Attic("Clockmaker's Attic", '1888')
    const vault = new Vault("Pharaoh's Vault", 'ANKH')
    const waitlist = new Waitlist<InstanceType<typeof Team>>()
    waitlist.join(new Team('The Lantern Club', 4))
    waitlist.join(new Team('Night Owls', 3))
    attic.checkIn(waitlist.next())
    attic.tryCode('1234')
    attic.tryCode('1066')
    expect(board([attic, vault], waitlist)).toEqual([
      'Clockmaker\'s Attic: The Lantern Club, hint "The year is on the pendulum"',
      'Pharaoh\'s Vault: free, lobby shows {"name":"Pharaoh\'s Vault","attempts":0}',
      'Waiting: Night Owls',
      "Clockmaker's Attic: tryCode(1234) returned false",
      "Clockmaker's Attic: tryCode(1066) returned false",
    ])
  })
})

group('no shortcuts', () => {
  it('uses no any and no ts-ignore', () => {
    expect(source).not.toMatch(/\bany\b/)
    expect(source).not.toMatch(/@ts-(ignore|nocheck|expect-error)/)
  })
})
