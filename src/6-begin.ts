import { MicDock, sing } from './_internal/karaoke-night'
import { mountScene } from './_internal/scenes/karaoke'

// Exercise 6: Karaoke Night. Follow the steps in the Notion page.

export type SongRequest = { singer: string; song: string; minutes: number }

// Step 1: check unknown data before you trust it
export function toSongRequest(value: unknown): SongRequest | null {
  return null
}

// Step 2: a Disposable mic, and a using declaration
export type Mic = { singer: string }

export function borrowMic(dock: MicDock, singer: string): Mic {
  dock.lend(singer)
  return { singer }
}

export function perform(dock: MicDock, request: SongRequest): string {
  return sing(dock, request)
}

// Step 3: prove a DOM type with instanceof
export function field(root: ParentNode, selector: string): HTMLInputElement {
  throw new Error('Not implemented')
}

// Shows your work on the page. You do not need to change this line.
mountScene({ toSongRequest, borrowMic, perform, field })
