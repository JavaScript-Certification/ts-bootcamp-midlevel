import { describe as group, expectTypeOf, it } from 'vitest'
import { type Mic, type SongRequest, borrowMic, field, toSongRequest } from '#exercise/6'

group('step 1: check the requests', () => {
  it('toSongRequest takes unknown and may return null', () => {
    expectTypeOf(toSongRequest).parameters.toEqualTypeOf<[unknown]>()
    expectTypeOf(toSongRequest).returns.toEqualTypeOf<SongRequest | null>()
  })

  it('a request must be checked for null before use', () => {
    const request = toSongRequest({})
    // @ts-expect-error request is possibly null
    void request.singer
    if (request !== null) expectTypeOf(request.minutes).toEqualTypeOf<number>()
  })
})

group('step 2: the mic is Disposable', () => {
  it('Mic has a Symbol.dispose method', () => {
    expectTypeOf<Mic>().toExtend<Disposable>()
    expectTypeOf(borrowMic).returns.toEqualTypeOf<Mic>()
  })

  it('a plain object is not a Mic', () => {
    // @ts-expect-error a Mic needs [Symbol.dispose]
    const mic: Mic = { singer: 'Priya' }
    void mic
  })
})

group('step 3: prove the DOM types', () => {
  it('field returns an HTMLInputElement, never null', () => {
    expectTypeOf(field).parameters.toEqualTypeOf<[ParentNode, string]>()
    expectTypeOf(field).returns.toEqualTypeOf<HTMLInputElement>()
  })
})
