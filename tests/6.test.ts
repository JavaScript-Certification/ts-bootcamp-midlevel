import { readFileSync } from 'node:fs'
import { describe as group, expect, it, vi } from 'vitest'
import { MicDock, requests } from '../src/_internal/karaoke-night'

// importing the exercise prints the night: keep the test output clean
const log = vi.spyOn(console, 'log').mockImplementation(() => {})
const { borrowMic, field, mount, parseRequest, perform, runNight, toSongRequest } = await import('#exercise/6')
const source = readFileSync(new URL(`../src/6-${process.env.SOLUTION ? 'end' : 'begin'}.ts`, import.meta.url), 'utf8')

// The tests run in Node, without a browser: a tiny stand-in for the few DOM pieces the exercise uses
class FakeInput {
  value = ''
}
Object.assign(globalThis, { HTMLInputElement: FakeInput })

function input(value: string): FakeInput {
  const element = new FakeInput()
  element.value = value
  return element
}

function fakeRoot(elements: Record<string, unknown>): ParentNode {
  return { querySelector: (selector: string) => elements[selector] ?? null } as unknown as ParentNode
}

function fakePage(singer: string, song: string, minutes: string) {
  type Listener = (event: { preventDefault(): void }) => void
  const listeners: Record<string, Listener> = {}
  const inputs: Record<string, FakeInput> = { '#singer': input(singer), '#song': input(song), '#minutes': input(minutes) }
  const form = {
    querySelector: (selector: string) => inputs[selector] ?? null,
    addEventListener: (type: string, listener: Listener) => {
      listeners[type] = listener
    },
    reset: vi.fn(),
  }
  return { root: fakeRoot({ form }), submit: () => listeners.submit?.({ preventDefault: vi.fn() }) }
}

const kofi = { singer: 'Kofi', song: 'My Way', minutes: 5 }
const priya = { singer: 'Priya', song: 'Dancing Queen', minutes: 4 }

group('step 1: check the requests', () => {
  it('accepts a complete request, keeping only the three fields', () => {
    expect(toSongRequest(priya)).toEqual(priya)
    expect(toSongRequest({ ...priya, table: 12 })).toEqual(priya)
  })

  it('rejects a missing song, minutes as text, and zero minutes', () => {
    expect(toSongRequest({ singer: 'Sam', minutes: 3 })).toBeNull()
    expect(toSongRequest({ ...priya, minutes: '4' })).toBeNull()
    expect(toSongRequest({ ...priya, minutes: 0 })).toBeNull()
  })

  it('parses the JSON requests, and rejects text that is not JSON', () => {
    expect(parseRequest(requests[0] ?? '')).toEqual(priya)
    expect(parseRequest('Ana wants Valerie')).toBeNull()
  })
})

group('step 2: the mic is Disposable, and perform uses it', () => {
  it('lends the mic, and disposing it gives it back', () => {
    const dock = new MicDock()
    {
      using mic = borrowMic(dock, 'Priya')
      expect(mic.singer).toBe('Priya')
      expect(dock.holder).toBe('Priya')
    }
    expect(dock.holder).toBeNull()
  })

  it('sings and frees the mic', () => {
    const dock = new MicDock()
    expect(perform(dock, priya)).toBe('Priya sings Dancing Queen (4 min)')
    expect(dock.holder).toBeNull()
  })

  it('frees the mic even when the song fails', () => {
    const dock = new MicDock()
    expect(() => perform(dock, kofi)).toThrow('No backing track for My Way')
    expect(dock.holder).toBeNull()
  })

  it('borrows the mic with a using declaration', () => {
    expect(source).toMatch(/\busing\s+\w+\s*=\s*borrowMic\(/)
  })

  it('runs the whole night', () => {
    expect(runNight(new MicDock(), requests)).toEqual([
      'Priya sings Dancing Queen (4 min)',
      'Skipped Kofi: No backing track for My Way',
      'Mo sings Valerie (4 min)',
      '3 requests rejected',
    ])
  })
})

group('step 3: prove the DOM types', () => {
  it('returns the input element', () => {
    const singer = input('Ana')
    expect(field(fakeRoot({ '#singer': singer }), '#singer')).toBe(singer)
  })

  it('throws when the element is missing or is not an input', () => {
    expect(() => field(fakeRoot({}), '#singer')).toThrow('Missing field #singer')
    expect(() => field(fakeRoot({ '#singer': { value: 'Ana' } }), '#singer')).toThrow('Missing field #singer')
  })

  it('the sign-up form now works', () => {
    const page = fakePage('Ana', 'Valerie', '4')
    mount(page.root, new MicDock())
    log.mockClear()
    page.submit()
    expect(log).toHaveBeenCalledWith('Ana sings Valerie (4 min)')
  })
})

group('no shortcuts', () => {
  it('uses no any and no ts-ignore', () => {
    expect(source).not.toMatch(/\bany\b/)
    expect(source).not.toMatch(/@ts-(ignore|nocheck|expect-error)/)
  })

  it('proves DOM types instead of asserting them', () => {
    expect(source).not.toMatch(/\bas\s+HTML|querySelector</)
    expect(source).not.toMatch(/[\w)\]]!(?=[.;,)\s])/)
  })
})
