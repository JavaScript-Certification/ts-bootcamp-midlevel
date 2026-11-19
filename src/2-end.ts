import { dishes } from './_internal/food-truck-rally'
import { mountScene } from './_internal/scenes/rally'

// Exercise 2: Food Truck Rally (solution)

// Step 1: T links the list to the result, and the constraint asks only for what the body reads
export function quickest<T extends { minutes: number }>(items: readonly T[]): T | undefined {
  let best: T | undefined
  for (const item of items) {
    if (!best || item.minutes < best.minutes) best = item
  }
  return best
}

// Step 2: a second type parameter, with string as its default
export type Lookup<T, E = string> =
  | { found: true; value: T }
  | { found: false; error: E }

export function findById<T extends { id: string }>(items: readonly T[], id: string): Lookup<T> {
  const value = items.find(item => item.id === id)
  return value === undefined ? { found: false, error: `No match for ${id}` } : { found: true, value }
}

// Step 3: a const type parameter keeps the exact stops, in order
export function route<const T extends readonly string[]>(stops: T): T {
  return stops
}

// Hover these two names as you go
const fastDish = quickest(dishes)
const tour = route(['T2', 'T4', 'T1'])

// Shows your work on the page. You do not need to change this line.
mountScene({ quickest, findById, route })
