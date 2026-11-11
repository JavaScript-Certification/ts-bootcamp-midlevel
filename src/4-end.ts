import type { Resettable } from './_internal/escape-room'
import { mountScene } from './_internal/scenes/escape-room'

// Exercise 4: Escape Room Control Desk (solution)

// Step 1: readonly parameter properties, and a #code field
export class Team {
  constructor(
    readonly name: string,
    readonly players: number,
  ) {}
}

// Step 2: an abstract base that implements Resettable
export abstract class Room implements Resettable {
  #code: string
  protected attempts = 0
  team: Team | undefined = undefined

  constructor(readonly name: string, code: string) {
    this.#code = code
  }

  abstract hint(): string

  checkIn(team: Team | undefined): void {
    this.team = team
  }

  // Given: a this-based type guard
  isOccupied(): this is { team: Team } {
    return this.team !== undefined
  }

  @logged
  tryCode(code: string): boolean {
    this.attempts++
    return code === this.#code
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

// Given: a generic class with a constraint
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

// Step 3: a typed method decorator
export function logged<This extends { name: string }, Args extends unknown[], Return>(
  method: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>,
) {
  return function (this: This, ...args: Args): Return {
    const result = method.apply(this, args)
    audit.push(`${this.name}: ${String(context.name)}(${args.join(', ')}) returned ${String(result)}`)
    return result
  }
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
