import { RoomBase, audit } from './_internal/escape-room'
import { mountScene } from './_internal/scenes/escape-room'

// Exercise 4: Escape Room Control Desk. Follow the steps in the Notion page.
// RoomBase (given) holds the team, counts the attempts and resets the room.

// Step 2: an abstract class that implements Resettable, with an abstract hint()
export class Room extends RoomBase {
  // Step 1: a real private field
  private code: string

  constructor(name: string, code: string) {
    super(name)
    this.code = code
  }

  hint(): string {
    return ''
  }

  // Step 3: decorate this method with @logged
  tryCode(code: string): boolean {
    this.attempts++
    return code === this.code
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

// Step 3: a method decorator that writes one line into audit per call
export function logged<This extends { name: string }, Args extends unknown[], Return>(
  method: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>,
) {
  return method
}

// Shows your work on the page. You do not need to change this line.
mountScene({ Attic, Vault })
