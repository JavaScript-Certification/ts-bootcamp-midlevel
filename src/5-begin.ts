import { type Network, type Telemetry, RoverOfflineError, SignalLostError, retryDelays, sleep } from './_internal/rover-network'
import { mountScene } from './_internal/scenes/mars'

// Exercise 5: Mars Rover Uplink. Follow the steps in the Notion page.

// Step 1: make Result a union, then fix reportLine
export type Result<T, E> = { ok: boolean; value?: T; error?: E }

export function reportLine(rover: string, outcome: Result<Telemetry, string>): string {
  if (!outcome.value) return `${rover}: ${outcome.error}`
  return `${rover}: ${outcome.value.battery}% battery at ${outcome.value.site}`
}

// Step 2: the two missing instanceof checks
export function describeFailure(err: unknown): string {
  if (err instanceof SignalLostError) return 'signal lost'
  return `unknown failure: ${String(err)}`
}

// Step 3: retry only a lost signal
export async function pingWithRetry(network: Network, rover: string): Promise<Result<Telemetry, string>> {
  for (const delay of retryDelays(5, 3)) {
    try {
      return { ok: true, value: await network.ping(rover) }
    } catch (err) {
      await sleep(delay)
    }
  }
  return { ok: false, error: 'signal lost' }
}

// Shows your work on the page. You do not need to change this line.
mountScene({ reportLine, describeFailure, pingWithRetry })
