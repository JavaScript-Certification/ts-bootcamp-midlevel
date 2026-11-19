// the projector's vendor script: it adds a ReelBox global, and ships no types
import './_internal/reelbox.js'
import { tonight } from './_internal/rooftop-programme'
import { mountScene } from './_internal/scenes/cinema'

// Exercise 7: Rooftop Cinema. Follow the steps in the Notion page.

export type Film = { title: string; year: number; minutes: number }

// Step 1: import Screening from the programme, instead of this copy
type Screening = { time: string; reel: string }

// Step 2: declare the ReelBox global (read src/_internal/reelbox.js), then use it here
export function filmFor(reel: string): Film | null {
  return null
}

export function describe(screening: Screening): string {
  const film = filmFor(screening.reel)
  if (film === null) return `${screening.time} reel ${screening.reel} is missing`
  return `${screening.time} ${film.title} (${film.year}), ${film.minutes} min`
}

// Step 3: prove the first screening exists, then put it on top of the board
export function board(programme: readonly Screening[]): string[] {
  const first = programme[0]
  const later = programme.slice(1).map(screening => `Later: ${describe(screening)}`)
  return []
}

// Shows your work on the page. You do not need to change this line.
mountScene({ filmFor, describe, board, programme: tonight })
