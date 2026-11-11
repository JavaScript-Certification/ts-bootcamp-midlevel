import { describe as group, expectTypeOf, it } from 'vitest'
import {
  type Booking,
  type BookingRequest,
  type CabinClass,
  type CabinId,
  type Ticket,
  book,
  cabinClasses,
  cabins,
  fare,
  fares,
  issue,
} from '#exercise/3'

group('given', () => {
  it('fare takes a booking and returns a number', () => {
    expectTypeOf(fare).parameters.toEqualTypeOf<[Booking]>()
    expectTypeOf(fare).returns.toEqualTypeOf<number>()
  })
})

group('step 1: cabin classes and fares', () => {
  it('keeps the exact cabin classes', () => {
    expectTypeOf(cabinClasses).toEqualTypeOf<readonly ['seat', 'couchette', 'sleeper']>()
    expectTypeOf<CabinClass>().toEqualTypeOf<'seat' | 'couchette' | 'sleeper'>()
  })

  it('has a fare for every cabin class, and no other', () => {
    expectTypeOf<keyof typeof fares>().toEqualTypeOf<CabinClass>()
    expectTypeOf(fares.sleeper).toEqualTypeOf<number>()
  })
})

group('step 2: types derived with utility types', () => {
  it('a request is a booking without its id, a ticket is what issue returns, read-only', () => {
    expectTypeOf<BookingRequest>().toEqualTypeOf<Omit<Booking, 'id'>>()
    // @ts-expect-error the id comes from book, not from the request
    const withId: BookingRequest = { id: 'ML-9', passenger: 'Lin', cabin: '11A', nights: 1, breakfast: false }
    void withId
    expectTypeOf<Ticket>().toEqualTypeOf<Readonly<ReturnType<typeof issue>>>()
    const ticket: Ticket = issue(book({ passenger: 'Lin', cabin: '11A', nights: 1, breakfast: false }, 9))
    // @ts-expect-error a ticket cannot be edited once issued
    ticket.total = 0
  })
})

group('step 3: cabins', () => {
  it('keeps the exact cabin ids', () => {
    expectTypeOf<CabinId>().toEqualTypeOf<'11A' | '12C' | '14D'>()
  })

  it('knows every cabin exists', () => {
    expectTypeOf(cabins['14D'].car).toEqualTypeOf<number>()
  })

  it('requests and tickets follow the cabin ids', () => {
    // @ts-expect-error there is no cabin 99Z on this train
    const lost: BookingRequest = { passenger: 'Lin', cabin: '99Z', nights: 1, breakfast: false }
    void lost
    expectTypeOf<Ticket['cabin']>().toEqualTypeOf<'11A' | '12C' | '14D'>()
  })
})
