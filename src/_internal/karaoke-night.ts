// The karaoke bar: song requests sent from phones, the backing tracks, and the mic dock.
// You do not need to modify this file.
import { print } from './print'

// Raw requests, exactly as the phones sent them: JSON text you cannot trust
export const requests: readonly string[] = [
  '{"singer":"Priya","song":"Dancing Queen","minutes":4}',
  '{"singer":"Sam","song":"Toxic"}',
  '{"singer":"Lena","song":"Africa","minutes":"5"}',
  'Ana wants Valerie',
  '{"singer":"Kofi","song":"My Way","minutes":5}',
  '{"singer":"Mo","song":"Valerie","minutes":4}',
]

// The songs the bar has a backing track for
export const catalogue: ReadonlySet<string> = new Set([
  'Africa',
  'Bohemian Rhapsody',
  'Dancing Queen',
  'Mr Brightside',
  'Toxic',
  'Valerie',
  'Wonderwall',
])

// One wireless mic, on a charging dock. It must be back on the dock before the next singer takes it.
export class MicDock {
  #holder: string | null = null

  get holder(): string | null {
    return this.#holder
  }

  lend(singer: string): void {
    if (this.#holder !== null) throw new Error(`The mic is still with ${this.#holder}`)
    this.#holder = singer
  }

  giveBack(): void {
    this.#holder = null
  }
}

// Plays the backing track. Throws when the singer does not hold the mic, or when there is no track.
export function sing(dock: MicDock, request: { singer: string; song: string; minutes: number }): string {
  if (dock.holder !== request.singer) throw new Error(`${request.singer} has no mic`)
  if (!catalogue.has(request.song)) throw new Error(`No backing track for ${request.song}`)
  return `${request.singer} sings ${request.song} (${request.minutes} min)`
}

// ---------- the rest of the night, built on the functions you write in src/6-begin.ts ----------

type Request = { singer: string; song: string; minutes: number }

/** The functions of your exercise file that the night runs on */
export type Performer = {
  toSongRequest: (value: unknown) => Request | null
  perform: (dock: MicDock, request: Request) => string
  field: (root: ParentNode, selector: string) => HTMLInputElement
}

export function karaokeNight({ toSongRequest, perform, field }: Performer) {
  // the result of JSON.parse is stored as unknown, then checked by toSongRequest
  function parseRequest(raw: string): Request | null {
    try {
      const value: unknown = JSON.parse(raw)
      return toSongRequest(value)
    } catch {
      return null
    }
  }

  // one turn on stage: a failed song becomes a "Skipped" line
  function turn(dock: MicDock, request: Request): string {
    try {
      return perform(dock, request)
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error)
      return `Skipped ${request.singer}: ${reason}`
    }
  }

  // one turn per valid request, then the number of rejected requests
  function runNight(dock: MicDock, raws: readonly string[]): string[] {
    const valid = raws.map(parseRequest).filter(request => request !== null)
    return [...valid.map(request => turn(dock, request)), `${raws.length - valid.length} requests rejected`]
  }

  // the sign-up form, built on field and toSongRequest
  function mount(root: ParentNode, dock: MicDock): void {
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

  return { parseRequest, turn, runNight, mount }
}
