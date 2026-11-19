// the projector's vendor script: it adds a ReelBox global, and ships no types
import './_internal/reelbox.js'
import { tonight } from './_internal/rooftop-programme'
import { mountScene } from './_internal/scenes/cinema'

// Exercise 7: Rooftop Cinema. Follow the steps in the Notion page.

export type Film = { title: string; year: number; minutes: number }

// Step 1: a type-only import, instead of this local copy
type Screening = { time: string; reel: string }

// Step 2: declare the ReelBox global, then use it (and handle the missing reel)
export function filmFor(reel: string): Film | null {
  return null
}

export function describe(screening: Screening): string {
  return screening.time
}

// Step 3: prove the first screening exists
export function board(programme: readonly Screening[]): string[] {
  return []
}

// Shows your work on the page. You do not need to change this line.
mountScene({ filmFor, describe, board, programme: tonight })
