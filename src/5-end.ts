import {
  type Network,
  type Telemetry,
  RoverOfflineError,
  SignalLostError,
  createNetwork,
  roster,
  sleep,
} from './_internal/rover-network'
import { mountScene } from './_internal/scenes/mars'

// Exercise 5: Mars Rover Uplink (solution)

// Step 1
export type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E }

export function reportLine(rover: string, outcome: Result<Telemetry, string>): string {
  if (!outcome.ok) return `${rover}: ${outcome.error}`
  return `${rover}: ${outcome.value.battery}% battery at ${outcome.value.site}`
}

// Given: a generator of retry delays, doubling each time. retryDelays(5, 3) yields 5, 10, 20
export function* retryDelays(base: number, attempts: number): Generator<number, void, unknown> {
  for (let n = 0; n < attempts; n++) yield base * 2 ** n
}

// Step 2
export function describeFailure(err: unknown): string {
  if (err instanceof SignalLostError) return 'signal lost'
  if (err instanceof RoverOfflineError) return `offline since ${err.since}`
  if (err instanceof Error) return err.message
  return `unknown failure: ${String(err)}`
}

// Step 3
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

// Given: asks every rover at the same time, one report line each
export async function uplink(network: Network, rovers: readonly string[]): Promise<string[]> {
  return Promise.all(rovers.map(async rover => reportLine(rover, await pingWithRetry(network, rover))))
}

// Shows your work on the page. You do not need to change this line.
mountScene({ roster, createNetwork, reportLine, retryDelays, describeFailure, pingWithRetry, uplink })
