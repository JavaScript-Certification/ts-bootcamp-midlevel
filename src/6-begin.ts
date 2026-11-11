import { MicDock, requests, sing } from './_internal/karaoke-night'
import { print } from './_internal/print'
import { mountScene } from './_internal/scenes/karaoke'

// Exercise 6: Karaoke Night
// Follow the steps in the exercise instructions.

export type SongRequest = { singer: string; song: string; minutes: number }

export function toSongRequest(value: unknown): SongRequest | null {
  if (typeof value !== 'object' || value === null) return null
  // Provided: singer and song are checked. Each check narrows value a little more.
  if (!('singer' in value) || typeof value.singer !== 'string') return null
  if (!('song' in value) || typeof value.song !== 'string') return null
  // Step 1: check minutes (a number above 0) the same way,
  // then return a new SongRequest built from the three checked fields
  return null
}

// Provided: the result of JSON.parse is stored as unknown, then checked
export function parseRequest(raw: string): SongRequest | null {
  try {
    const value: unknown = JSON.parse(raw)
    return toSongRequest(value)
  } catch {
    return null
  }
}

// Step 2: make Mic Disposable, and give the mic back to the dock in [Symbol.dispose]
export type Mic = { singer: string }

export function borrowMic(dock: MicDock, singer: string): Mic {
  dock.lend(singer)
  return { singer }
}

export function perform(dock: MicDock, request: SongRequest): string {
  // Step 2: borrow the mic with a using declaration before you sing
  return sing(dock, request)
}

// Provided: one turn on stage. A failed song becomes a "Skipped" line.
export function turn(dock: MicDock, request: SongRequest): string {
  try {
    return perform(dock, request)
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    return `Skipped ${request.singer}: ${reason}`
  }
}

// Provided: one turn per valid request, then the number of rejected requests
export function runNight(dock: MicDock, raws: readonly string[]): string[] {
  const valid = raws.map(parseRequest).filter(request => request !== null)
  return [...valid.map(request => turn(dock, request)), `${raws.length - valid.length} requests rejected`]
}

export function field(root: ParentNode, selector: string): HTMLInputElement {
  const element = root.querySelector(selector)
  // Step 3: prove element is an HTMLInputElement with instanceof,
  // or throw new Error(`Missing field ${selector}`)
  throw new Error('Not implemented')
}

// Provided: the sign-up form, built on field and toSongRequest
export function mount(root: ParentNode, dock: MicDock): void {
  const form = root.querySelector('form')
  if (form === null) throw new Error('Missing sign-up form')
  form.addEventListener('submit', event => {
    event.preventDefault()
    const request = toSongRequest({
      singer: field(form, '#singer').value.trim(),
      song: field(form, '#song').value.trim(),
      minutes: Number(field(form, '#minutes').value),
    })
    print(request === null ? 'Request rejected' : turn(dock, request))
    form.reset()
  })
}

// Shows your work on the page. You do not need to change this line.
mountScene({ requests, toSongRequest, parseRequest, borrowMic, perform, turn, runNight, field })
