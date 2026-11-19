import { book, total } from './_internal/night-train'
import { mountScene } from './_internal/scenes/train'

// Exercise 3: Moonline Night Train. Follow the steps in the Notion page.

// Step 1: as const, then satisfies
export const cabinClasses = ['seat', 'couchette', 'sleeper']
export type CabinClass = (typeof cabinClasses)[number]

export const fares = {
  seat: 39,
  couchette: 69,
}

// Step 2: derive these two copies with utility types
export type Booking = { id: string; passenger: string; cabin: CabinId; nights: number; breakfast: boolean }
export type BookingRequest = { passenger: string; cabin: string; nights: number; breakfast: boolean }
export type Ticket = { id: string; passenger: string; cabin: string; total: number }

export function issue(booking: Booking) {
  return { id: booking.id, passenger: booking.passenger, cabin: booking.cabin, total: fare(booking) }
}

// Step 3: satisfies and keyof typeof, then the price of a booking (total is given)
export type Cabin = { car: number; class: CabinClass }

export const cabins: Record<string, Cabin> = {
  '11A': { car: 11, class: 'seat' },
  '12C': { car: 12, class: 'couchette' },
  '14D': { car: 14, class: 'sleeper' },
}

export type CabinId = string

export function fare(booking: Booking): number {
  return total(0, booking)
}

// Tonight's bookings
const tonight: BookingRequest[] = [
  { passenger: 'Ada', cabin: '14D', nights: 1, breakfast: true },
  { passenger: 'Grace', cabin: '12C', nights: 2, breakfast: false },
  { passenger: 'Alan', cabin: '11A', nights: 1, breakfast: true },
]

// Shows your work on the page. You do not need to change this line.
mountScene({ cabinClasses, fares, cabins, bookings: tonight.map(book), issue })
