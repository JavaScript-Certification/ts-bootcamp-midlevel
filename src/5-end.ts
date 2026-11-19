import { type Network, type Telemetry, RoverOfflineError, SignalLostError, retryDelays, sleep } from './_internal/rover-network'
import { mountScene } from './_internal/scenes/mars'

// Exercise 5: Mars Rover Uplink (solution)

// Step 1: a success carries a value, a failure an error, never both
export type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E }

export function reportLine(rover: string, outcome: Result<Telemetry, string>): string {
  if (!outcome.ok) return `${rover}: ${outcome.error}`
  return `${rover}: ${outcome.value.battery}% battery at ${outcome.value.site}`
}

// Step 2: the most specific classes first, then every other Error, then the rest
export function describeFailure(err: unknown): string {
  if (err instanceof SignalLostError) return 'signal lost'
  if (err instanceof RoverOfflineError) return `offline since ${err.since}`
  if (err instanceof Error) return err.message
  return `unknown failure: ${String(err)}`
}

// Step 3: retry only what can succeed, and turn every failure into a Result
export async function pingWithRetry(network: Network, rover: string): Promise<Result<Telemetry, string>> {
  for (const delay of retryDelays(5, 3)) {
    try {
      return { ok: true, value: await network.ping(rover) }
    } catch (err) {
      if (!(err instanceof SignalLostError)) return { ok: false, error: describeFailure(err) }
      await sleep(delay)
    }
  }
  return { ok: false, error: 'signal lost' }
}

// Shows your work on the page. You do not need to change this line.
mountScene({ reportLine, describeFailure, pingWithRetry })
