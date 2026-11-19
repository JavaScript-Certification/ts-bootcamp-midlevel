import { dishes } from './_internal/food-truck-rally'
import { mountScene } from './_internal/scenes/rally'

// Exercise 2: Food Truck Rally. Follow the steps in the Notion page.

// Step 1: make quickest generic, so callers get their own type back
export function quickest(items: readonly { minutes: number }[]): { minutes: number } | undefined {
  let best: { minutes: number } | undefined
  for (const item of items) if (!best || item.minutes < best.minutes) best = item
  return best
}

// Step 2: add an error type E, with string as its default
export type Lookup<T> = { found: true; value: T } | { found: false; error: string }

export function findById<T extends { id: string }>(items: readonly T[], id: string): Lookup<T> {
  const value = items.find(item => item.id === id)
  return value ? { found: true, value } : { found: false, error: `No match for ${id}` }
}

// Step 3: keep the exact stops
export function route<T extends readonly string[]>(stops: T): T {
  return stops
}

// Hover these two as you go
const fastDish = quickest(dishes)
const tour = route(['T2', 'T4', 'T1'])

mountScene({ quickest, findById, route })
