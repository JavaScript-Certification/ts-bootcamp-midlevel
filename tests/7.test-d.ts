import { describe as group, expectTypeOf, it } from 'vitest'
import type { Screening } from '../src/_internal/rooftop-programme'
import { type Film, board, describe, filmFor } from '#exercise/7'

group('step 1: a type-only import', () => {
  it('describe takes the programme\'s Screening', () => {
    expectTypeOf(describe).parameters.toEqualTypeOf<[Screening]>()
  })
})

group('step 2: the ReelBox global', () => {
  it('filmFor admits that a reel can be missing', () => {
    expectTypeOf(filmFor).parameters.toEqualTypeOf<[string]>()
    expectTypeOf(filmFor).returns.toEqualTypeOf<Film | null>()
    // @ts-expect-error a reel is a string like 'R-1975'
    filmFor(1975)
  })
})

group('given: describe', () => {
  it('needs a whole screening', () => {
    expectTypeOf(describe).returns.toEqualTypeOf<string>()
    // @ts-expect-error a screening needs its reel
    describe({ time: '19:30' })
  })
})

group('step 3: the board', () => {
  it('takes the read-only programme and returns lines', () => {
    expectTypeOf(board).parameters.toEqualTypeOf<[readonly Screening[]]>()
    expectTypeOf(board).returns.toEqualTypeOf<string[]>()
  })
})
