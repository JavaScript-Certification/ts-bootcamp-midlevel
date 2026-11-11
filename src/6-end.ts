import { MicDock, requests, sing } from './_internal/karaoke-night'
import { print } from './_internal/print'
import { mountScene } from './_internal/scenes/karaoke'

// Exercise 6: Karaoke Night (solution)

export type SongRequest = { singer: string; song: string; minutes: number }

// Step 1: check every field before you trust the request
export function toSongRequest(value: unknown): SongRequest | null {
  if (typeof value !== 'object' || value === null) return null
  if (!('singer' in value) || typeof value.singer !== 'string') return null
  if (!('song' in value) || typeof value.song !== 'string') return null
  if (!('minutes' in value) || typeof value.minutes !== 'number' || value.minutes <= 0) return null
  return { singer: value.singer, song: value.song, minutes: value.minutes }
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

// Step 2: the mic is Disposable, and disposing it puts it back on the dock
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

// Step 2: using gives the mic back at the end of the block, even when sing throws
export function perform(dock: MicDock, request: SongRequest): string {
  using mic = borrowMic(dock, request.singer)
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

// Step 3: prove the element is an input with instanceof
export function field(root: ParentNode, selector: string): HTMLInputElement {
  const element = root.querySelector(selector)
  if (!(element instanceof HTMLInputElement)) throw new Error(`Missing field ${selector}`)
  return element
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
