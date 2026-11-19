// The game master's toolkit. You do not need to modify this file.

// Everything the game master can reset between two games
export interface Resettable {
  reset(): void
}

// readonly parameter properties declare and assign each field in one go
export class Team {
  constructor(
    readonly name: string,
    readonly players: number,
  ) {}
}

// What every room does: hold a team, count the attempts, reset
export class RoomBase {
  protected attempts = 0
  team: Team | undefined = undefined

  constructor(readonly name: string) {}

  checkIn(team: Team | undefined): void {
    this.team = team
  }

  // a this-based type guard: when it returns true, the room is treated as { team: Team }
  isOccupied(): this is { team: Team } {
    return this.team !== undefined
  }

  reset(): void {
    this.team = undefined
    this.attempts = 0
  }
}

// A generic class: the constraint lets names() read item.name
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

// The CCTV log: the lines your @logged decorator writes
export const audit: string[] = []

type BoardRoom = { readonly name: string; readonly team: Team | undefined; hint(): string }

// The control desk board: one line per room, then the waiting teams, then the audit
export function board(rooms: readonly BoardRoom[], waitlist: Waitlist<Team>): string[] {
  const lines = rooms.map(room =>
    room.team
      ? `${room.name}: ${room.team.name}, hint "${room.hint()}"`
      : `${room.name}: free, lobby shows ${JSON.stringify(room)}`,
  )
  const waiting = waitlist.names()
  return [...lines, `Waiting: ${waiting.length ? waiting.join(', ') : 'nobody'}`, ...audit]
}
