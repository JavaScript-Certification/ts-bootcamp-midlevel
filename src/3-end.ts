import { breakfastPerNight, departure, euros } from './_internal/night-train'
import { print } from './_internal/print'
import { mountScene } from './_internal/scenes/train'

// Exercise 3: Moonline Night Train (solution)

// Step 1: keep the exact values with `as const`, derive CabinClass from the list,
// then check the fares with `satisfies` and add the fare the compiler asks for
export const cabinClasses = ['seat', 'couchette', 'sleeper'] as const
export type CabinClass = (typeof cabinClasses)[number]

export const fares = {
  seat: 39,
  couchette: 69,
  sleeper: 129,
} satisfies Record<CabinClass, number>

export type Cabin = { car: number; class: CabinClass }

export type Booking = {
  id: string
  passenger: string
  cabin: CabinId
  nights: number
  breakfast: boolean
}

export function issue(booking: Booking) {
  return {
    id: booking.id,
    passenger: booking.passenger,
    cabin: booking.cabin,
    total: fare(booking),
  }
}

// Step 2: derive both types with utility types, instead of copying fields
export type BookingRequest = Omit<Booking, 'id'>
export type Ticket = Readonly<ReturnType<typeof issue>>

export function book(request: BookingRequest, seq: number): Booking {
  return { id: `ML-${seq}`, ...request }
}

// Step 3: swap the annotation for `satisfies`, derive CabinId from the keys of cabins,
// then read perNight in fare: the fare of the cabin's class
export const cabins = {
  '11A': { car: 11, class: 'seat' },
  '12C': { car: 12, class: 'couchette' },
  '14D': { car: 14, class: 'sleeper' },
} satisfies Record<string, Cabin>

export type CabinId = keyof typeof cabins

// Given: breakfast is added when booked, and the total covers every night
export function fare(booking: Booking): number {
  const perNight = fares[cabins[booking.cabin].class]
  const breakfast = booking.breakfast ? breakfastPerNight : 0
  return (perNight + breakfast) * booking.nights
}

export function ticketLine(ticket: Ticket): string {
  return `${ticket.id} ${ticket.passenger}, cabin ${ticket.cabin}: ${euros(ticket.total)}`
}

// tonight's bookings
const tonight = [
  book({ passenger: 'Ada', cabin: '14D', nights: 1, breakfast: true }, 1),
  book({ passenger: 'Grace', cabin: '12C', nights: 2, breakfast: false }, 2),
  book({ passenger: 'Alan', cabin: '11A', nights: 1, breakfast: true }, 3),
]
const tickets: Ticket[] = tonight.map(issue)

print(departure)
tickets.map(ticketLine).forEach(print)
print(`Total: ${euros(tickets.reduce((sum, ticket) => sum + ticket.total, 0))}`)

// Shows your work on the page. You do not need to change this line.
mountScene({ cabinClasses, fares, cabins, bookings: tonight, issue, ticketLine })
