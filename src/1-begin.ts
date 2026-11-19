import { feed, isRecord } from './_internal/charger-feed'
import { mountScene } from './_internal/scenes/charging'

// Exercise 1: Charging Station Board. Follow the steps in the Notion page.

// Step 1 and 3: one object type per state
export type Charger =
  | { id: string; status: 'available' }
  | { id: string; status: 'faulted'; code: string }

export function describe(charger: Charger): string {
  switch (charger.status) {
    case 'available':
      return `${charger.id}: available`
    case 'faulted':
      return `${charger.id}: out of order (${charger.code})`
    default: {
      const unhandled: never = charger
      return unhandled
    }
  }
}

// Step 2: turn these two into a type predicate and an assertion function
export function isCharger(value: unknown): boolean {
  if (!isRecord(value) || typeof value.id !== 'string') return false
  switch (value.status) {
    case 'available':
      return true
    case 'charging':
      return typeof value.vehicle === 'string' && typeof value.kWh === 'number'
    case 'faulted':
      return typeof value.code === 'string'
    default:
      return false
  }
}

export function assertIsCharger(value: unknown): void {}

// Hover `valid`: what does TypeScript know about it?
const valid = feed.filter(isCharger)

mountScene({ describe, isCharger, assertIsCharger })
