import { mountScene } from './_internal/scenes/charging'

// Exercise 1: Charging Station Board (solution)

// Step 1: one object type per state, joined by `|`, with `status` as the discriminant
// Step 3: the reserved state
export type Charger =
  | { id: string; status: 'available' }
  | { id: string; status: 'charging'; vehicle: string; kWh: number }
  | { id: string; status: 'faulted'; code: string }
  | { id: string; status: 'reserved'; until: string }

// Step 1 (continued): a switch on status, with a never check in the default branch
export function describe(charger: Charger): string {
  switch (charger.status) {
    case 'available':
      return `${charger.id}: available`
    case 'charging':
      return `${charger.id}: charging ${charger.vehicle}, ${charger.kWh} kWh`
    case 'faulted':
      return `${charger.id}: out of order (${charger.code})`
    case 'reserved':
      return `${charger.id}: reserved until ${charger.until}`
    default: {
      const unhandled: never = charger
      return unhandled
    }
  }
}

// Given: narrows unknown to an object whose properties you can read
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

// Step 2: a type predicate that checks the data each status needs (the outline is given)
export function isCharger(value: unknown): value is Charger {
  if (!isRecord(value) || typeof value.id !== 'string') return false
  switch (value.status) {
    case 'available':
      return true
    case 'charging':
      return typeof value.vehicle === 'string' && typeof value.kWh === 'number'
    case 'faulted':
      return typeof value.code === 'string'
    case 'reserved':
      return typeof value.until === 'string'
    default:
      return false
  }
}

// Step 2 (continued): an assertion function built on isCharger
export function assertIsCharger(value: unknown): asserts value is Charger {
  if (!isCharger(value)) throw new Error('Invalid charger record')
}

// Given: the board, which uses your three functions (the records are in src/_internal/charger-feed.ts)
export function board(records: readonly unknown[], last: unknown): string[] {
  const chargers = records.filter(isCharger)
  const rejected = records.length - chargers.length
  assertIsCharger(last)
  return [...chargers.map(describe), `${rejected} records rejected`, `Latest: ${describe(last)}`]
}

// Shows your work on the page (and prints the board in the console). You do not need to change this line.
mountScene({ describe, isCharger, assertIsCharger, board })
