import { dishes } from './_internal/food-truck-rally'
import { mountScene } from './_internal/scenes/rally'

// Exercise 2: Food Truck Rally. Follow the steps in the Notion page.

// Step 1: a generic function, constrained to what its body reads
export function quickest(items: readonly unknown[]): unknown {
  return undefined
}

// Step 2: a second type parameter for the error, with a default
export type Lookup<T> =
  | { found: true; value: T }
  | { found: false; error: string }

export function findById<T extends { id: string }>(items: readonly T[], id: string): Lookup<T> {
  const value = items.find(item => item.id === id)
  return value === undefined ? { found: false, error: `No match for ${id}` } : { found: true, value }
}

// Step 3: a const type parameter
export function route(stops: readonly string[]): readonly string[] {
  return stops
}

// Hover these two names as you go
const fastDish = quickest(dishes)
const tour = route(['T2', 'T4', 'T1'])

// Shows your work on the page. You do not need to change this line.
mountScene({ quickest, findById, route })
