import type { Resettable } from './_internal/escape-room'
import { mountScene } from './_internal/scenes/escape-room'

// Exercise 4: Escape Room Control Desk
// Follow the steps in the exercise instructions.

// Step 1: declare name and players as readonly parameter properties,
// then keep the code of a room in a #code field, so the lobby never sees it
export class Team {
  name: string
  players: number

  constructor(name: string, players: number) {
    this.name = name
    this.players = players
  }
}

// Step 2: make Room abstract, make hint() abstract, and implement Resettable
export class Room {
  protected attempts = 0
  team: Team | undefined = undefined

  constructor(readonly name: string, private code: string) {}

  hint(): string {
    return ''
  }

  checkIn(team: Team | undefined): void {
    this.team = team
  }

  // Given: a this-based type guard. When it returns true, the compiler
  // treats the room itself as { team: Team }, so board needs no ?.
  isOccupied(): this is { team: Team } {
    return this.team !== undefined
  }

  tryCode(code: string): boolean {
    this.attempts++
    return code === this.code
  }

  reset(): void {
    this.team = undefined
    this.attempts = 0
  }
}

export class Attic extends Room {
  hint(): string {
    return this.attempts < 2 ? 'Count the chimes' : 'The year is on the pendulum'
  }
}

export class Vault extends Room {
  hint(): string {
    return 'Read the hieroglyphs from right to left'
  }
}

// Given: a generic class. The constraint lets names() read item.name,
// and each instance keeps its own type: Waitlist<Team> only takes teams.
export class Waitlist<T extends { name: string }> {
  #items: T[] = []

  join(item: T): number {
    this.#items.push(item)
    return this.#items.length
  }

  next(): T | undefined {
    return this.#items.shift()
  }

  names(): string[] {
    return this.#items.map(item => item.name)
  }
}

export const audit: string[] = []

// Step 3: return a wrapper that calls the method and pushes a line into audit,
// then put @logged on the line above tryCode
export function logged<This extends { name: string }, Args extends unknown[], Return>(
  method: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>,
) {
  return method
}

// The board is ready: one line per room, then the waiting teams, then the audit
export function board(rooms: readonly Room[], waitlist: Waitlist<Team>): string[] {
  const lines = rooms.map(room =>
    room.isOccupied()
      ? `${room.name}: ${room.team.name}, hint "${room.hint()}"`
      : `${room.name}: free, lobby shows ${JSON.stringify(room)}`,
  )
  const waiting = waitlist.names()
  return [...lines, `Waiting: ${waiting.length ? waiting.join(', ') : 'nobody'}`, ...audit]
}

const attic = new Attic("Clockmaker's Attic", '1888')
const vault = new Vault("Pharaoh's Vault", 'ANKH')
const waitlist = new Waitlist<Team>()
waitlist.join(new Team('The Lantern Club', 4))
waitlist.join(new Team('Night Owls', 3))

attic.checkIn(waitlist.next())
attic.tryCode('1234')
attic.tryCode('1066')

// Shows your work on the page. You do not need to change this line.
mountScene({ rooms: [attic, vault], waitlist, audit, board })
