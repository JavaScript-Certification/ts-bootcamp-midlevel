import { describe as group, expectTypeOf, it } from 'vitest'
import { Room, Team, Waitlist, logged } from '#exercise/4'

group('step 1: parameter properties and #code', () => {
  it('makes the team read-only', () => {
    const team = new Team('Night Owls', 3)
    expectTypeOf(team.name).toEqualTypeOf<string>()
    // @ts-expect-error the name of a team is read-only
    team.name = 'Day Owls'
    // @ts-expect-error the number of players is read-only
    team.players = 4
  })
})

group('step 2: an abstract Room', () => {
  it('cannot create a plain Room', () => {
    // @ts-expect-error Room is abstract
    void new Room('Empty room', '0000')
  })
})

group('given: the generic Waitlist and the isOccupied guard', () => {
  it('types the waitlist with its type parameter', () => {
    const waitlist = new Waitlist<Team>()
    expectTypeOf(waitlist.join).parameters.toEqualTypeOf<[Team]>()
    expectTypeOf(waitlist.next()).toEqualTypeOf<Team | undefined>()
  })

  it('only accepts items with a name', () => {
    // @ts-expect-error a number has no name
    void new Waitlist<number>()
  })

  it('narrows the team of an occupied room', () => {
    const room = {} as Room
    expectTypeOf(room.team).toEqualTypeOf<Team | undefined>()
    if (room.isOccupied()) expectTypeOf(room.team).toEqualTypeOf<Team>()
  })
})

group('step 3: the logged decorator', () => {
  it('keeps the type of the decorated method', () => {
    class Locker {
      name = 'Locker 7'
      @logged
      open(code: number): boolean {
        return code === 7
      }
    }
    expectTypeOf(new Locker().open).toEqualTypeOf<(code: number) => boolean>()
  })

  it('needs a name on the decorated class', () => {
    class Nameless {
      // @ts-expect-error logged reads this.name
      @logged
      open(): boolean {
        return true
      }
    }
    void Nameless
  })
})
