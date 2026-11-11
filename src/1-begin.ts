import { mountScene } from './_internal/scenes/charging'

// Exercise 1: Charging Station Board
// Follow the steps in the exercise instructions. The page shows the car park as you go.

// Step 1: replace this loose type with a discriminated union of three states.
// The first member is written for you, add `charging` and `faulted`:
//   | { id: string; status: 'available' }
//   | { id: string; status: 'charging'; ... }
//   | { id: string; status: 'faulted'; ... }
export type Charger = {
  id: string
  status: string
  vehicle?: string
  kWh?: number
  code?: string
}

// Step 1 (continued): switch on charger.status, one case per state, and end with
//   default: {
//     const unhandled: never = charger
//     return unhandled
//   }
export function describe(charger: Charger): string {
  return charger.id
}

// Given: narrows unknown to an object whose properties you can read
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

// Step 2: a type predicate. The outline is given: it checks the id, accepts `available`
// and rejects every other status. Add a case for `charging` and one for `faulted` that
// check the fields each state needs with typeof.
export function isCharger(value: unknown): value is Charger {
  if (!isRecord(value) || typeof value.id !== 'string') return false
  switch (value.status) {
    case 'available':
      return true
    default:
      return false
  }
}

// Step 2 (continued): throw new Error('Invalid charger record') when isCharger says no
export function assertIsCharger(value: unknown): asserts value is Charger {}

// Step 3: add the `reserved` state to Charger, then follow the compiler

// Given: the board, which uses your three functions (the records are in src/_internal/charger-feed.ts)
export function board(records: readonly unknown[], last: unknown): string[] {
  const chargers = records.filter(isCharger)
  const rejected = records.length - chargers.length
  assertIsCharger(last)
  return [...chargers.map(describe), `${rejected} records rejected`, `Latest: ${describe(last)}`]
}

// Shows your work on the page (and prints the board in the console). You do not need to change this line.
mountScene({ describe, isCharger, assertIsCharger, board })
