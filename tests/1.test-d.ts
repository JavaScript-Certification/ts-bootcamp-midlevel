import { describe as group, expectTypeOf, it } from 'vitest'
import { type Charger, assertIsCharger, describe, isCharger } from '#exercise/1'

group('step 1: the Charger union and describe', () => {
  it('accepts each state with its own data', () => {
    expectTypeOf({ id: 'C1', status: 'available' as const }).toExtend<Charger>()
    expectTypeOf({ id: 'C2', status: 'charging' as const, vehicle: 'EV-204', kWh: 18.5 }).toExtend<Charger>()
    expectTypeOf({ id: 'C3', status: 'faulted' as const, code: 'E42' }).toExtend<Charger>()
  })

  it('rejects states that make no sense', () => {
    // @ts-expect-error a charging charger needs a vehicle and kWh
    const charging: Charger = { id: 'C2', status: 'charging' }
    // @ts-expect-error an available charger has no vehicle
    const available: Charger = { id: 'C1', status: 'available', vehicle: 'EV-204' }
    // @ts-expect-error broken is not a state
    const broken: Charger = { id: 'C9', status: 'broken' }
    void [charging, available, broken]
  })

  it('narrows on status', () => {
    const charger = {} as Charger
    if (charger.status === 'faulted') expectTypeOf(charger.code).toEqualTypeOf<string>()
    if (charger.status === 'charging') expectTypeOf(charger.kWh).toEqualTypeOf<number>()
  })

  it('describe takes a Charger and returns a string', () => {
    expectTypeOf(describe).parameters.toEqualTypeOf<[Charger]>()
    expectTypeOf(describe).returns.toEqualTypeOf<string>()
  })
})

group('step 2: isCharger and assertIsCharger', () => {
  it('isCharger is a type predicate', () => {
    expectTypeOf(isCharger).guards.toEqualTypeOf<Charger>()
  })

  it('assertIsCharger is an assertion function', () => {
    expectTypeOf(assertIsCharger).asserts.toEqualTypeOf<Charger>()
  })
})

group('step 3: the reserved state', () => {
  it('accepts a reserved charger with its end time', () => {
    expectTypeOf({ id: 'C5', status: 'reserved' as const, until: '18:30' }).toExtend<Charger>()
    // @ts-expect-error a reserved charger needs an end time
    const reserved: Charger = { id: 'C5', status: 'reserved' }
    void reserved
  })
})
