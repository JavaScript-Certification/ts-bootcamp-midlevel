import { MicDock, sing } from './_internal/karaoke-night'
import { mountScene } from './_internal/scenes/karaoke'

// Exercise 6: Karaoke Night (solution)

export type SongRequest = { singer: string; song: string; minutes: number }

// Step 1: each check narrows value a little more
export function toSongRequest(value: unknown): SongRequest | null {
  if (typeof value !== 'object' || value === null) return null
  if (!('singer' in value) || typeof value.singer !== 'string') return null
  if (!('song' in value) || typeof value.song !== 'string') return null
  if (!('minutes' in value) || typeof value.minutes !== 'number' || value.minutes <= 0) return null
  return { singer: value.singer, song: value.song, minutes: value.minutes }
}

// Step 2: disposing the mic puts it back on the dock, and using disposes it at the end of the block
export type Mic = Disposable & { singer: string }

export function borrowMic(dock: MicDock, singer: string): Mic {
  dock.lend(singer)
  return {
    singer,
    [Symbol.dispose]() {
      dock.giveBack()
    },
  }
}

export function perform(dock: MicDock, request: SongRequest): string {
  using mic = borrowMic(dock, request.singer)
  return sing(dock, request)
}

// Step 3: prove the element is an input
export function field(root: ParentNode, selector: string): HTMLInputElement {
  const element = root.querySelector(selector)
  if (!(element instanceof HTMLInputElement)) throw new Error(`Missing field ${selector}`)
  return element
}

// Shows your work on the page. You do not need to change this line.
mountScene({ toSongRequest, borrowMic, perform, field })
