// the projector's vendor script: it adds a ReelBox global, and ships no types
import './_internal/reelbox.js'
import { tonight } from './_internal/rooftop-programme'
import { mountScene } from './_internal/scenes/cinema'

// Exercise 7: Rooftop Cinema
// Follow the steps in the exercise instructions.

export type Film = { title: string; year: number; minutes: number }

// Step 1: delete this line, and import the Screening type from './_internal/rooftop-programme'
type Screening = { time: string; reel: string }

// Step 2: describe the ReelBox global (only its film method), then return what it finds
declare const ReelBox: unknown

export function filmFor(reel: string): Film | null {
  return null
}

// Given: one line per screening. filmFor can return null, so the missing reel is
// handled first; after that check, TypeScript knows film is a Film.
export function describe(screening: Screening): string {
  const film = filmFor(screening.reel)
  if (film === null) return `${screening.time} reel ${screening.reel} is missing`
  return `${screening.time} ${film.title} (${film.year}), ${film.minutes} min`
}

// Step 3: 'Now showing: ' for the first screening, 'Later: ' for the others,
// or ['Nothing on tonight'] when the programme is empty
export function board(programme: readonly Screening[]): string[] {
  const first = programme[0]
  return []
}

// Shows your work on the page. You do not need to change this line.
mountScene({ filmFor, describe, board, programme: tonight })
