import { MicDock, sing } from './_internal/karaoke-night'
import { mountScene } from './_internal/scenes/karaoke'

// Exercise 6: Karaoke Night. Follow the steps in the Notion page.

export type SongRequest = { singer: string; song: string; minutes: number }

// Step 1: check minutes like singer and song, then return a new SongRequest
export function toSongRequest(value: unknown): SongRequest | null {
  if (typeof value !== 'object' || value === null) return null
  if (!('singer' in value) || typeof value.singer !== 'string') return null
  if (!('song' in value) || typeof value.song !== 'string') return null
  return null
}

// Step 2: a Disposable mic that goes back to its dock, borrowed with using
export type Mic = { singer: string }

export function borrowMic(dock: MicDock, singer: string): Mic {
  dock.lend(singer)
  return { singer }
}

export function perform(dock: MicDock, request: SongRequest): string {
  const mic = borrowMic(dock, request.singer)
  return sing(dock, request)
}

// Step 3: prove the element is an input
export function field(root: ParentNode, selector: string): HTMLInputElement {
  const element = root.querySelector(selector)
  throw new Error(`Missing field ${selector}`)
}

// Shows your work on the page. You do not need to change this line.
mountScene({ toSongRequest, borrowMic, perform, field })
