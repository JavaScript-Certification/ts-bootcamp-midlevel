import { book, total } from './_internal/night-train'
import { mountScene } from './_internal/scenes/train'

// Exercise 3: Moonline Night Train (solution)

// Step 1: as const keeps the exact classes, satisfies checks a fare exists for each one
export const cabinClasses = ['seat', 'couchette', 'sleeper'] as const
export type CabinClass = (typeof cabinClasses)[number]

export const fares = {
  seat: 39,
  couchette: 69,
  sleeper: 129,
} satisfies Record<CabinClass, number>

// Step 2: derived types follow Booking and issue, they can never drift
export type Booking = { id: string; passenger: string; cabin: CabinId; nights: number; breakfast: boolean }
export type BookingRequest = Omit<Booking, 'id'>
export type Ticket = Readonly<ReturnType<typeof issue>>

export function issue(booking: Booking) {
  return { id: booking.id, passenger: booking.passenger, cabin: booking.cabin, total: fare(booking) }
}

// Step 3: satisfies keeps the exact cabin ids, so every cabin lookup is safe
export type Cabin = { car: number; class: CabinClass }

export const cabins = {
  '11A': { car: 11, class: 'seat' },
  '12C': { car: 12, class: 'couchette' },
  '14D': { car: 14, class: 'sleeper' },
} satisfies Record<string, Cabin>

export type CabinId = keyof typeof cabins

export function fare(booking: Booking): number {
  return total(fares[cabins[booking.cabin].class], booking)
}

// Tonight's bookings
const tonight: BookingRequest[] = [
  { passenger: 'Ada', cabin: '14D', nights: 1, breakfast: true },
  { passenger: 'Grace', cabin: '12C', nights: 2, breakfast: false },
  { passenger: 'Alan', cabin: '11A', nights: 1, breakfast: true },
]

// Shows your work on the page. You do not need to change this line.
mountScene({ cabinClasses, fares, cabins, bookings: tonight.map(book), issue })
