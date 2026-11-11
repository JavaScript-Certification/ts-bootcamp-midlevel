import { describe as group, expectTypeOf, it } from 'vitest'
import type { Network, Telemetry } from '../src/_internal/rover-network'
import { type Result, describeFailure, pingWithRetry, retryDelays, uplink } from '#exercise/5'

group('step 1: Result is a discriminated union', () => {
  it('accepts a success and a failure', () => {
    expectTypeOf({ ok: true as const, value: 64 }).toExtend<Result<number, string>>()
    expectTypeOf({ ok: false as const, error: 'signal lost' }).toExtend<Result<number, string>>()
  })

  it('rejects outcomes that make no sense', () => {
    // @ts-expect-error a success carries a value
    const empty: Result<number, string> = { ok: true }
    // @ts-expect-error a failure has no value
    const both: Result<number, string> = { ok: false, value: 64, error: 'signal lost' }
    void [empty, both]
  })

  it('narrows on ok', () => {
    const result = {} as Result<number, string>
    if (result.ok) expectTypeOf(result.value).toEqualTypeOf<number>()
    else expectTypeOf(result.error).toEqualTypeOf<string>()
  })
})

group('given: retryDelays is a generator', () => {
  it('returns a Generator of numbers', () => {
    expectTypeOf(retryDelays).returns.toEqualTypeOf<Generator<number, void, unknown>>()
  })
})

group('step 2: describeFailure takes an unknown error', () => {
  it('accepts anything that can be thrown', () => {
    expectTypeOf(describeFailure).parameters.toEqualTypeOf<[unknown]>()
  })
})

group('step 3: pingWithRetry resolves to a Result', () => {
  it('never exposes a rejection in its type', () => {
    expectTypeOf(pingWithRetry).returns.toEqualTypeOf<Promise<Result<Telemetry, string>>>()
    expectTypeOf(pingWithRetry).returns.resolves.toEqualTypeOf<Result<Telemetry, string>>()
  })

  it('uplink resolves to the report lines', () => {
    expectTypeOf(uplink).parameters.toEqualTypeOf<[Network, readonly string[]]>()
    expectTypeOf(uplink).returns.resolves.toEqualTypeOf<string[]>()
  })
})
