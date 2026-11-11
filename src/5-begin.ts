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

// Exercise 5: Mars Rover Uplink
// Follow the steps in the exercise instructions.

// Step 1: make Result a discriminated union on `ok`, then narrow it in reportLine
export type Result<T, E> = {
  ok: boolean
  value?: T
  error?: E
}

export function reportLine(rover: string, outcome: Result<Telemetry, string>): string {
  return `${rover}: no report yet`
}

// Given: a generator of retry delays, doubling each time. retryDelays(5, 3) yields 5, 10, 20
export function* retryDelays(base: number, attempts: number): Generator<number, void, unknown> {
  for (let n = 0; n < attempts; n++) yield base * 2 ** n
}

// Step 2: one short sentence per kind of failure, most specific class first
export function describeFailure(err: unknown): string {
  return 'unknown failure'
}

// Step 3: ping the rover, retry a lost signal after each delay of retryDelays(5, 3), never reject
export async function pingWithRetry(network: Network, rover: string): Promise<Result<Telemetry, string>> {
  return { ok: false, error: 'not implemented' }
}

// Given: asks every rover at the same time, one report line each
export async function uplink(network: Network, rovers: readonly string[]): Promise<string[]> {
  return Promise.all(rovers.map(async rover => reportLine(rover, await pingWithRetry(network, rover))))
}

// Shows your work on the page. You do not need to change this line.
mountScene({ roster, createNetwork, reportLine, retryDelays, describeFailure, pingWithRetry, uplink })
