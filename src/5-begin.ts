import { type Network, type Telemetry, RoverOfflineError, SignalLostError, retryDelays, sleep } from './_internal/rover-network'
import { mountScene } from './_internal/scenes/mars'

// Exercise 5: Mars Rover Uplink. Follow the steps in the Notion page.

// Step 1: a Result union (a success with a value, or a failure with an error), then narrow it
export type Result<T, E> = { ok: boolean; value?: T; error?: E }

export function reportLine(rover: string, outcome: Result<Telemetry, string>): string {
  return `${rover}: no report yet`
}

// Step 2: a caught error is unknown, narrow it with instanceof
export function describeFailure(err: unknown): string {
  return `unknown failure: ${String(err)}`
}

// Step 3: ping the rover, retry a lost signal (retryDelays and sleep are given), never reject
export async function pingWithRetry(network: Network, rover: string): Promise<Result<Telemetry, string>> {
  return { ok: false, error: 'not pinged' }
}

// Shows your work on the page. You do not need to change this line.
mountScene({ reportLine, describeFailure, pingWithRetry })
