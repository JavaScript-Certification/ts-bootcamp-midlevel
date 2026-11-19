import { type Resettable, RoomBase, audit } from './_internal/escape-room'
import { mountScene } from './_internal/scenes/escape-room'

// Exercise 4: Escape Room Control Desk (solution)

// Step 2: nobody creates a plain Room, and every room writes its own hint
export abstract class Room extends RoomBase implements Resettable {
  // Step 1: a #private field does not exist outside the class, even at runtime
  #code: string

  constructor(name: string, code: string) {
    super(name)
    this.#code = code
  }

  abstract hint(): string

  // Step 3
  @logged
  tryCode(code: string): boolean {
    this.attempts++
    return code === this.#code
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

// Step 3: wrap the method, log the call, keep the result
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

// Shows your work on the page. You do not need to change this line.
mountScene({ Attic, Vault })
