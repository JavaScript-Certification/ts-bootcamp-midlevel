// The karaoke bar: song requests sent from phones, the backing tracks, and the mic dock.
// You do not need to modify this file.

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
