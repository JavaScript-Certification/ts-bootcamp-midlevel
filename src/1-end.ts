import { isRecord } from './_internal/charger-feed'
import { mountScene } from './_internal/scenes/charging'

// Exercise 1: Charging Station Board (solution)

// Step 1 and 3: one object type per state, with `status` as the discriminant
export type Charger =
  | { id: string; status: 'available' }
  | { id: string; status: 'charging'; vehicle: string; kWh: number }
  | { id: string; status: 'faulted'; code: string }
  | { id: string; status: 'reserved'; until: string }

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

// Step 2: check the data each status needs
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

export function assertIsCharger(value: unknown): asserts value is Charger {
  if (!isCharger(value)) throw new Error('Invalid charger record')
}

// Shows your work on the page. You do not need to change this line.
mountScene({ describe, isCharger, assertIsCharger })
