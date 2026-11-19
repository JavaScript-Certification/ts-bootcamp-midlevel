import { describe as group, expectTypeOf, it } from 'vitest'
import { type Dish, type Truck, type Volunteer, dishes, trucks, volunteers } from '../src/_internal/food-truck-rally'
import { type Lookup, findById, quickest, route } from '#exercise/2'

group('step 1: quickest', () => {
  it('returns the caller type, not just { minutes: number }', () => {
    expectTypeOf(quickest(trucks)).toEqualTypeOf<Truck | undefined>()
    expectTypeOf(quickest(dishes)).toEqualTypeOf<Dish | undefined>()
  })

  it('rejects items without minutes', () => {
    // @ts-expect-error a volunteer has no minutes
    quickest(volunteers)
  })
})

group('step 2: Lookup', () => {
  it('uses string as the default error type', () => {
    expectTypeOf<Lookup<Truck>>().toEqualTypeOf<{ found: true; value: Truck } | { found: false; error: string }>()
    expectTypeOf(findById(volunteers, 'V1')).toEqualTypeOf<Lookup<Volunteer>>()
  })

  it('accepts another error type', () => {
    expectTypeOf<Lookup<Truck, number>>().toEqualTypeOf<{ found: true; value: Truck } | { found: false; error: number }>()
  })
})

group('step 3: route', () => {
  it('keeps the exact stops, in order', () => {
    expectTypeOf(route(['T2', 'T4', 'T1'])).toEqualTypeOf<readonly ['T2', 'T4', 'T1']>()
  })
})
