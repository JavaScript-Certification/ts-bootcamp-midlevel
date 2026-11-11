import { dishes, trucks } from './_internal/food-truck-rally'
import { mountScene } from './_internal/scenes/rally'

// Exercise 2: Food Truck Rally
// Follow the steps in notion/exercise-2.md. The bodies already work: you only write types.

// Given: one type parameter T links the list to the result, so first(trucks) is a Truck | undefined
export function first<T>(items: readonly T[]): T | undefined {
  return items[0]
}

// Step 1: replace every any with T, then constrain T to what the body reads
//   export function quickest<T extends ...>(items: readonly T[]): T | undefined
export function quickest(items: readonly any[]): any {
  let best: any
  for (const item of items) {
    if (!best || item.minutes < best.minutes) {
      best = item
    }
  }
  return best
}

// Step 2: add a second type parameter E for the error, with string as its default
//   export type Lookup<T, E = ...> =
export type Lookup<T> =
  | { found: true; value: T }
  | { found: false; error: string }

// Given: finds an item by id
export function findById<T extends { id: string }>(items: readonly T[], id: string): Lookup<T> {
  const value = items.find(item => item.id === id)
  return value === undefined ? { found: false, error: `No match for ${id}` } : { found: true, value }
}

// Step 3: make route generic, then add one keyword so the call in report keeps its exact stops
//   export function route<T extends readonly string[]>(stops: T): T
export function route(stops: readonly string[]): readonly string[] {
  return stops
}

// Given: the rally board, nothing to change below this line
export function report(): string[] {
  const opener = first(trucks)
  const shortQueue = quickest(trucks)
  const fastDish = quickest(dishes)
  const missing = findById(trucks, 'T9')
  const tour = route(['T2', 'T4', 'T1']).map(id => {
    const stop = findById(trucks, id)
    return stop.found ? stop.value.name : stop.error
  })
  return [
    `Opening truck: ${opener?.name ?? 'none'}`,
    `Shortest queue: ${shortQueue?.name ?? 'none'}, ${shortQueue?.minutes ?? 0} min`,
    `Fastest dish: ${fastDish?.name ?? 'none'}, ${fastDish?.minutes ?? 0} min`,
    `T9: ${missing.found ? missing.value.name : missing.error}`,
    `Tasting route: ${tour.join(' > ')}`,
  ]
}

// Shows your work on the page, and prints the board in the console. You do not need to change this line.
mountScene({ first, quickest, findById, route, report })
