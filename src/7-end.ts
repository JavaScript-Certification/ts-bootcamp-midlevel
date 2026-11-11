// the projector's vendor script: it adds a ReelBox global, and ships no types
import './_internal/reelbox.js'
import { type Screening, tonight } from './_internal/rooftop-programme'
import { mountScene } from './_internal/scenes/cinema'

// Exercise 7: Rooftop Cinema (solution)

export type Film = { title: string; year: number; minutes: number }

// Step 2: only the part of the vendor script this file uses
declare const ReelBox: {
  film(reel: string): Film | null
}

export function filmFor(reel: string): Film | null {
  return ReelBox.film(reel)
}

// Given: one line per screening, the missing reel handled first
export function describe(screening: Screening): string {
  const film = filmFor(screening.reel)
  if (film === null) return `${screening.time} reel ${screening.reel} is missing`
  return `${screening.time} ${film.title} (${film.year}), ${film.minutes} min`
}

// Step 3
export function board(programme: readonly Screening[]): string[] {
  const first = programme[0]
  if (first === undefined) return ['Nothing on tonight']
  return [
    `Now showing: ${describe(first)}`,
    ...programme.slice(1).map(screening => `Later: ${describe(screening)}`),
  ]
}

// Shows your work on the page. You do not need to change this line.
mountScene({ filmFor, describe, board, programme: tonight })
