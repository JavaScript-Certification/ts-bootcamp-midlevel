// The rover network: pings and failures. You do not need to modify this file.

export type Telemetry = { rover: string; battery: number; site: string }

export type Network = {
  /** Asks a rover for its telemetry. Rejects when the rover does not answer. */
  ping(rover: string): Promise<Telemetry>
  /** How many times a rover has been pinged so far. */
  attempts(rover: string): number
}

/** The rover did not answer this time. Trying again may work. */
export class SignalLostError extends Error {
  constructor(rover: string) {
    super(`No answer from ${rover}`)
    this.name = 'SignalLostError'
  }
}

/** The rover is offline for good. Trying again will not help. */
export class RoverOfflineError extends Error {
  readonly since: string
  constructor(rover: string, since: string) {
    super(`${rover} is offline`)
    this.name = 'RoverOfflineError'
    this.since = since
  }
}

export const roster: readonly string[] = ['curiosity', 'perseverance', 'spirit', 'sojourner']

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// What each ping answers, attempt after attempt (the last one repeats)
type Answer = Telemetry | { lost: true } | { offline: string } | { raw: string }

const scripts: Record<string, Answer[]> = {
  curiosity: [{ rover: 'curiosity', battery: 87, site: 'Gale Crater' }],
  perseverance: [{ lost: true }, { lost: true }, { rover: 'perseverance', battery: 64, site: 'Jezero Crater' }],
  spirit: [{ offline: 'sol 2210' }],
  sojourner: [{ raw: 'dust storm' }],
}

const LATENCY = 5

/** A fresh network: every rover starts with zero attempts. */
export function createNetwork(): Network {
  const counts = new Map<string, number>()

  return {
    async ping(rover) {
      const script = scripts[rover]
      if (!script) throw new Error(`Unknown rover: ${rover}`)
      const attempt = counts.get(rover) ?? 0
      counts.set(rover, attempt + 1)
      await sleep(LATENCY)
      const answer = script[Math.min(attempt, script.length - 1)]
      if (!answer) throw new Error(`Unknown rover: ${rover}`)
      if ('lost' in answer) throw new SignalLostError(rover)
      if ('offline' in answer) throw new RoverOfflineError(rover, answer.offline)
      // some old rover firmware throws plain strings, not errors
      if ('raw' in answer) throw answer.raw
      return { ...answer }
    },
    attempts(rover) {
      return counts.get(rover) ?? 0
    },
  }
}
