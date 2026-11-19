import { isRecord } from './_internal/charger-feed'
import { mountScene } from './_internal/scenes/charging'

// Exercise 1: Charging Station Board. Follow the steps in the Notion page.

// Step 1: a discriminated union, and a switch with a never check
export type Charger = { id: string; status: string }

export function describe(charger: Charger): string {
  return charger.id
}

// Step 2: a type predicate (isRecord is given), and an assertion function
export function isCharger(value: unknown): value is Charger {
  return false
}

export function assertIsCharger(value: unknown): asserts value is Charger {}

// Step 3: add the `reserved` state, then follow the compiler

// Shows your work on the page. You do not need to change this line.
mountScene({ describe, isCharger, assertIsCharger })
