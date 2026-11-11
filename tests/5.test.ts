import { readFileSync } from 'node:fs'
import { describe as group, expect, it, vi } from 'vitest'
import { type Network, RoverOfflineError, SignalLostError, createNetwork, roster } from '../src/_internal/rover-network'

// importing the exercise prints the report: keep the test output clean
vi.spyOn(console, 'log').mockImplementation(() => {})
const { describeFailure, pingWithRetry, reportLine, retryDelays, uplink } = await import('#exercise/5')
const source = readFileSync(new URL(`../src/5-${process.env.SOLUTION ? 'end' : 'begin'}.ts`, import.meta.url), 'utf8')

group('step 1: Result and reportLine', () => {
  it('reports the battery and site of a success', () => {
    const outcome = { ok: true as const, value: { rover: 'curiosity', battery: 87, site: 'Gale Crater' } }
    expect(reportLine('curiosity', outcome)).toBe('curiosity: 87% battery at Gale Crater')
  })

  it('reports the error of a failure', () => {
    expect(reportLine('spirit', { ok: false, error: 'offline since sol 2210' })).toBe('spirit: offline since sol 2210')
  })
})

group('given: retryDelays', () => {
  it('yields the delays, doubling each time', () => {
    expect([...retryDelays(5, 3)]).toEqual([5, 10, 20])
    expect([...retryDelays(10, 4)]).toEqual([10, 20, 40, 80])
    expect([...retryDelays(10, 0)]).toEqual([])
  })

  it('is a generator: values come one at a time from next()', () => {
    const delays = retryDelays(10, 2)[Symbol.iterator]()
    expect(delays.next()).toEqual({ value: 10, done: false })
    expect(delays.next()).toEqual({ value: 20, done: false })
    expect(delays.next().done).toBe(true)
    expect(source).toMatch(/function\s*\*\s*retryDelays/)
  })
})

group('step 2: describeFailure', () => {
  it('describes a lost signal', () => {
    expect(describeFailure(new SignalLostError('perseverance'))).toBe('signal lost')
  })

  it('describes an offline rover with its own data', () => {
    expect(describeFailure(new RoverOfflineError('spirit', 'sol 2210'))).toBe('offline since sol 2210')
  })

  it('uses the message of any other Error', () => {
    expect(describeFailure(new Error('antenna jammed'))).toBe('antenna jammed')
  })

  it('handles values that are not errors at all', () => {
    expect(describeFailure('dust storm')).toBe('unknown failure: dust storm')
    expect(describeFailure(42)).toBe('unknown failure: 42')
  })
})

group('step 3: pingWithRetry', () => {
  it('returns the telemetry of a rover that answers', async () => {
    const network = createNetwork()
    expect(await pingWithRetry(network, 'curiosity')).toEqual({
      ok: true,
      value: { rover: 'curiosity', battery: 87, site: 'Gale Crater' },
    })
    expect(network.attempts('curiosity')).toBe(1)
  })

  it('retries a lost signal until the rover answers', async () => {
    const network = createNetwork()
    const result = await pingWithRetry(network, 'perseverance')
    expect(result).toEqual({ ok: true, value: { rover: 'perseverance', battery: 64, site: 'Jezero Crater' } })
    expect(network.attempts('perseverance')).toBe(3)
  })

  it('gives up after three lost signals', async () => {
    let pings = 0
    const silent: Network = {
      async ping(rover) {
        pings++
        throw new SignalLostError(rover)
      },
      attempts: () => pings,
    }
    expect(await pingWithRetry(silent, 'zhurong')).toEqual({ ok: false, error: 'signal lost' })
    expect(pings).toBe(3)
  })

  it('does not retry an offline rover', async () => {
    const network = createNetwork()
    expect(await pingWithRetry(network, 'spirit')).toEqual({ ok: false, error: 'offline since sol 2210' })
    expect(network.attempts('spirit')).toBe(1)
  })

  it('never rejects, even when a plain string is thrown', async () => {
    await expect(pingWithRetry(createNetwork(), 'sojourner')).resolves.toEqual({
      ok: false,
      error: 'unknown failure: dust storm',
    })
  })

  it('prints the full report, one line per rover', async () => {
    expect(await uplink(createNetwork(), roster)).toEqual([
      'curiosity: 87% battery at Gale Crater',
      'perseverance: 64% battery at Jezero Crater',
      'spirit: offline since sol 2210',
      'sojourner: unknown failure: dust storm',
    ])
  })
})

group('no shortcuts', () => {
  it('uses no any and no ts-ignore', () => {
    expect(source).not.toMatch(/\bany\b/)
    expect(source).not.toMatch(/@ts-(ignore|nocheck|expect-error)/)
  })
})
