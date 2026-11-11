// The Food Truck Rally scene: shows the result of your helpers on the page. You do not need to modify this file.
import { type Dish, type Truck, dishes, trucks } from '../food-truck-rally'
import { print } from '../print'
import './rally.css'

type LookupResult<T> = { found: true; value: T } | { found: false; error: string }

// What the scene needs from src/2-begin.ts (or 2-end.ts)
export type RallyApi = {
  first: <T>(items: readonly T[]) => T | undefined
  quickest: <T extends { minutes: number }>(items: readonly T[]) => T | undefined
  findById: <T extends { id: string }>(items: readonly T[], id: string) => LookupResult<T>
  route: (stops: readonly string[]) => readonly string[]
  report: () => string[]
}

// the same stops and the same missing truck as in report()
const tastingStops = ['T2', 'T4', 'T1'] as const
const missingId = 'T9'

// the exercise files as text: the steps only change types, so the scene reads the code to know which steps are done
const sources = import.meta.glob<string>('../../2-*.ts', { query: '?raw', import: 'default', eager: true })

// ---------- drawings ----------

type Food = 'taco' | 'bao' | 'scone' | 'curry'
type Look = { color: string; shade: string; food: Food }

const looks: Record<string, Look> = {
  T1: { color: '#ff8a5b', shade: '#d9623a', food: 'taco' },
  T2: { color: '#4bc9a0', shade: '#2f9c79', food: 'bao' },
  T3: { color: '#f4a6c0', shade: '#d47a99', food: 'scone' },
  T4: { color: '#f5b83d', shade: '#cf8f1b', food: 'curry' },
}
const fallbackLook: Look = { color: '#358ef1', shade: '#3178c6', food: 'bao' }

const lookOf = (id: string): Look => looks[id] ?? fallbackLook

const foods: Record<Food, string> = {
  taco: `<path d="M-14 -2 A14 13 0 0 0 14 -2 Z" fill="#f5c451"/>
    <path d="M-12 -3 q3 -5 6 -1 q3 -5 6 -1 q3 -5 6 -1 q3 -5 6 0" stroke="#4be0a6" stroke-width="2.6" fill="none" stroke-linecap="round"/>
    <circle cx="-4" cy="-4" r="2" fill="#e0424b"/><circle cx="5" cy="-4.5" r="2" fill="#e0424b"/>
    <path d="M-8 3 q8 5 16 0" stroke="#d9a032" stroke-width="1.4" fill="none"/>`,
  bao: `<path d="M-13 6 Q-14 -9 0 -9 Q14 -9 13 6 Z" fill="#fff3e0" stroke="#c99a68" stroke-width="1.4"/>
    <path d="M-5 -7 q5 5 10 0 M0 -9 v5" stroke="#d9b48a" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    <path d="M-13 6 h26" stroke="#d9b48a" stroke-width="1.6"/>`,
  scone: `<path d="M-13 7 Q-12 -7 0 -8 Q12 -7 13 7 Z" fill="#d9a066"/>
    <path d="M-11 0 q11 -6 22 0" stroke="#fff3e0" stroke-width="4" fill="none" stroke-linecap="round"/>
    <circle cx="0" cy="-5.5" r="3.6" fill="#e0424b"/>`,
  curry: `<path d="M-14 -1 A14 10 0 0 0 14 -1 Z" fill="#faf9f8"/>
    <ellipse cx="0" cy="-1" rx="14" ry="3.2" fill="#f1a235"/>
    <circle cx="-5" cy="-1.5" r="1.4" fill="#4bc9a0"/><circle cx="4" cy="-0.5" r="1.4" fill="#e0424b"/>
    <path d="M-5 -6 q-3 -4 0 -8 M3 -6 q-3 -4 0 -8" stroke="#a9bdcf" fill="none" stroke-width="1.6" stroke-linecap="round"/>`,
}

function awning(look: Look): string {
  let stripes = ''
  for (let i = 0; i < 8; i++) {
    const x = 24 + i * 14
    const fill = i % 2 === 0 ? '#faf9f8' : look.shade
    stripes += `<rect x="${x}" y="40" width="14" height="11" fill="${fill}"/><path d="M${x} 51 a7 6 0 0 0 14 0 Z" fill="${fill}"/>`
  }
  return stripes
}

function truckDrawing(look: Look): string {
  return `
    <ellipse cx="110" cy="139" rx="102" ry="6" fill="#000" opacity="0.28"/>
    <rect x="10" y="30" width="160" height="92" rx="12" fill="${look.color}"/>
    <rect x="156" y="56" width="56" height="66" rx="11" fill="${look.color}"/>
    <path d="M168 64 h26 a8 8 0 0 1 8 8 v16 h-34 Z" fill="#bfe3ff" opacity="0.9"/>
    <path d="M172 68 l8 0 l-6 14 l-4 0 Z" fill="#fff" opacity="0.55"/>
    <rect x="182" y="96" width="9" height="3" rx="1.5" fill="${look.shade}"/>
    <circle cx="209" cy="108" r="3.5" fill="#f1dd35"/>
    <rect x="70" y="30" width="4" height="4" fill="${look.shade}"/><rect x="106" y="30" width="4" height="4" fill="${look.shade}"/>
    <rect x="58" y="8" width="64" height="26" rx="8" fill="#2a1a12" stroke="${look.shade}" stroke-width="2.5"/>
    <g transform="translate(90 22) scale(0.85)">${foods[look.food]}</g>
    <rect x="30" y="50" width="100" height="38" rx="4" fill="#24160f"/>
    <rect x="30" y="50" width="100" height="38" rx="4" fill="#ffcf7a" opacity="0.2"/>
    <circle cx="80" cy="72" r="7" fill="#e9b892"/>
    <rect x="72.5" y="60" width="15" height="7" rx="3" fill="#faf9f8"/>
    <path d="M67 88 q13 -16 26 0 Z" fill="#faf9f8"/>
    ${awning(look)}
    <rect x="26" y="87" width="108" height="6" rx="2" fill="#faf9f8"/>
    <rect x="10" y="108" width="202" height="13" rx="5" fill="${look.shade}"/>
    <circle cx="50" cy="122" r="15" fill="#13202b"/><circle cx="50" cy="122" r="6" fill="#a9bdcf"/>
    <circle cx="180" cy="122" r="15" fill="#13202b"/><circle cx="180" cy="122" r="6" fill="#a9bdcf"/>`
}

const coneDrawing = `
  <ellipse cx="30" cy="54" rx="22" ry="4" fill="#000" opacity="0.25"/>
  <rect x="12" y="48" width="36" height="6" rx="2" fill="#ff8a5b"/>
  <path d="M24 12 h12 l8 36 h-28 Z" fill="#ff8a5b"/>
  <path d="M22 24 h16 l2 8 h-20 Z" fill="#faf9f8"/>`

const ui = {
  replay: '<path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  alert: '<path d="M12 4 2.8 20h18.4z M12 10v4.5 M12 17.5v.01" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  star: '<path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5-4.8-4.6 6.6-.9z" fill="currentColor"/>',
  hourglass: '<path d="M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9s8 4 8 9" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>',
}

// ---------- small DOM helpers ----------

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

function drawing(viewBox: string, markup: string, className: string, label?: string): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', viewBox)
  svg.setAttribute('class', className)
  if (label) {
    svg.setAttribute('role', 'img')
    svg.setAttribute('aria-label', label)
  } else {
    svg.setAttribute('aria-hidden', 'true')
  }
  svg.innerHTML = markup
  return svg
}

const glyph = (name: keyof typeof ui, className = 'rally-glyph') => drawing('0 0 24 24', ui[name], className)

const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// ---------- which steps are done: read from your code ----------

type StepCheck = { n: number; done: boolean; hint: string }

function withoutComments(code: string): string {
  return code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
}

// the declaration that starts with `start`, up to the next export
function declaration(code: string, start: RegExp): string {
  const from = code.search(start)
  if (from < 0) return ''
  const rest = code.slice(from)
  const next = rest.slice(1).search(/\nexport /)
  return next < 0 ? rest : rest.slice(0, next + 1)
}

function checkSteps(): StepCheck[] {
  const file = location.pathname.includes('2-end') ? '../../2-end.ts' : '../../2-begin.ts'
  const raw = sources[file]
  const code = raw === undefined ? '' : withoutComments(raw)
  const known = code !== ''
  const noAny = (text: string) => !/\bany\b/.test(text)
  const quickest = declaration(code, /export function quickest\b/)
  const lookup = declaration(code, /export type Lookup\b/)
  const route = declaration(code, /export function route\b/)
  // first is given: its "Opening" banner is always on
  return [
    { n: 1, done: !known || (/quickest\s*<\s*\w+\s+extends\b/.test(quickest) && noAny(quickest)), hint: 'quickest still takes any. Use T, then constrain it to what the body reads.' },
    { n: 2, done: !known || (/Lookup\s*<\s*\w+\s*,\s*\w+\s*=/.test(lookup) && !/error\s*:\s*string\b/.test(lookup)), hint: 'Lookup has no error type yet. Add E, with string as its default.' },
    { n: 3, done: !known || (/route\s*<\s*const\s+\w+/.test(route) && noAny(route)), hint: 'route loses the exact stops. Make it generic with a const type parameter.' },
  ]
}

// ---------- calling your helpers safely ----------

const isTruck = (value: unknown): value is Truck => trucks.some(truck => truck === value)
const isDish = (value: unknown): value is Dish => dishes.some(dish => dish === value)
const isStops = (value: unknown): value is readonly string[] =>
  Array.isArray(value) && value.every(stop => typeof stop === 'string')

function isLookup(value: unknown): value is LookupResult<Truck> {
  if (typeof value !== 'object' || value === null || !('found' in value)) return false
  if (value.found === true) return 'value' in value && isTruck(value.value)
  return value.found === false && 'error' in value && typeof value.error === 'string'
}

class Unexpected extends Error {}

// ---------- the scene ----------

export function mountScene(api: RallyApi): void {
  // the board lines still go to the console, as before
  if (typeof document === 'undefined') {
    api.report().forEach(print)
    return
  }
  const host = document.querySelector<HTMLElement>('#scene')
  if (!host) return
  try {
    api.report().forEach(print)
  } catch (error) {
    console.warn('report() threw:', error)
  }

  const root = el('div', 'rally-scene')
  host.replaceChildren(root)

  // stage: one button, the street, a waiting card floating over it
  const stage = el('div', 'rally-stage')
  const replay = el('button', 'rally-replay')
  replay.type = 'button'
  replay.append(glyph('replay'), 'Replay the rally')
  const waiting = el('div', 'rally-waiting')
  waiting.setAttribute('role', 'status')
  waiting.hidden = true

  const street = el('div', 'rally-street')
  street.setAttribute('aria-label', 'The rally street')
  street.setAttribute('role', 'group')
  const lot = el('div', 'rally-lot')
  const spots = new Map<string, HTMLElement>()
  for (const truck of trucks) {
    const look = lookOf(truck.id)
    const spot = el('div', 'rally-spot')
    spot.style.setProperty('--truck', look.color)
    const ride = el('div', 'rally-truck')
    ride.append(drawing('0 0 220 146', truckDrawing(look), 'rally-truck-art', `${truck.name} food truck`))
    const plate = el('p', 'rally-plate')
    plate.title = truck.name
    plate.append(el('span', 'rally-plate-id', truck.id), el('span', 'rally-plate-name', truck.name))
    const line = el('p', 'rally-queue', `${truck.minutes} min queue`)
    spot.append(el('div', 'rally-tags'), ride, plate, line)
    spots.set(truck.id, spot)
    lot.append(spot)
  }
  const empty = el('div', 'rally-spot rally-spot--empty')
  const emptyBox = el('div', 'rally-empty')
  emptyBox.append(drawing('0 0 60 60', coneDrawing, 'rally-cone'), el('span', 'rally-empty-label', missingId))
  empty.append(el('div', 'rally-tags'), emptyBox)
  lot.append(empty)

  street.append(lot)
  stage.append(replay, street, waiting)

  // one short caption under the street: the latest event and what to do next
  const caption = el('div', 'rally-caption')
  caption.setAttribute('aria-live', 'polite')
  const latest = el('p', 'rally-caption-latest')
  const next = el('p', 'rally-caption-status')
  caption.append(latest, next)
  root.append(stage, caption)

  const tagsOf = (spot: HTMLElement | undefined) => spot?.querySelector('.rally-tags') ?? undefined
  const setLatest = (text: string) => latest.replaceChildren(glyph('star'), el('code', '', `Latest: ${text}`))

  // ---------- one run of the rally ----------

  // calls one of your helpers: a throw or a surprising result stops the run with a friendly message
  function call<T>(label: string, run: () => unknown, accept: (value: unknown) => value is T): T {
    let value: unknown
    try {
      value = run()
    } catch (error) {
      throw new Unexpected(`${label} threw: ${error instanceof Error ? error.message : String(error)}`)
    }
    if (!accept(value)) throw new Unexpected(`${label} returned something unexpected.`)
    return value
  }

  function clear() {
    root.querySelectorAll('.rally-tag, .rally-medal, .rally-bubble').forEach(node => node.remove())
    root.querySelectorAll('.is-quickest').forEach(node => node.classList.remove('is-quickest'))
  }

  function showStatus(steps: StepCheck[], problem?: string) {
    const todo = steps.find(step => !step.done)
    next.className = 'rally-caption-status'
    if (problem) {
      next.classList.add('is-error')
      next.replaceChildren(glyph('alert'), el('span', '', problem))
    } else if (todo) {
      next.classList.add('is-waiting')
      next.replaceChildren(glyph('hourglass'), el('strong', '', `Waiting for step ${todo.n}.`), ` ${todo.hint}`)
    } else {
      next.replaceChildren(glyph('check'), 'All steps done: every helper hands back the type it was given.')
    }
    waiting.hidden = !todo || problem !== undefined
    if (todo) waiting.replaceChildren(glyph('hourglass', 'rally-waiting-icon'), el('strong', '', `Waiting for step ${todo.n}`), el('span', '', todo.hint))
  }

  let running = false
  async function play() {
    if (running) return
    running = true
    replay.disabled = true
    const steps = checkSteps()
    const done = (n: number) => steps.find(step => step.n === n)?.done === true
    clear()
    setLatest(`${trucks.length} trucks parked, each with its queue time`)
    showStatus(steps)
    const pause = (ms: number) => wait(reducedMotion() ? Math.min(ms, 250) : ms)
    try {
      await pause(500)
      // first is given, so the opening banner always shows
      const opener = call('first(trucks)', () => api.first(trucks), isTruck)
      tagsOf(spots.get(opener.id))?.append(el('span', 'rally-tag rally-tag--opening', 'Opening'))
      setLatest(`${opener.name} opens the rally`)
      await pause(700)
      if (done(1)) {
        const truck = call('quickest(trucks)', () => api.quickest(trucks), isTruck)
        const dish = call('quickest(dishes)', () => api.quickest(dishes), isDish)
        const spot = spots.get(truck.id)
        spot?.classList.add('is-quickest')
        spot?.querySelector('.rally-truck')?.append(el('span', 'rally-medal', 'Quickest'))
        setLatest(`shortest queue ${truck.name}, ${truck.minutes} min (fastest dish ${dish.name})`)
        await pause(800)
      }
      if (done(3)) {
        const stops = call('route([...])', () => api.route([...tastingStops]), isStops)
        for (const [index, id] of stops.entries()) {
          const stop = call(`findById(trucks, '${id}')`, () => api.findById(trucks, id), isLookup)
          const spot = stop.found ? spots.get(stop.value.id) : empty
          tagsOf(spot)?.append(el('span', 'rally-tag rally-tag--stop', String(index + 1)))
          setLatest(`stop ${index + 1}, ${stop.found ? stop.value.name : stop.error}`)
          await pause(650)
        }
      }
      if (done(2)) {
        const missing = call(`findById(trucks, '${missingId}')`, () => api.findById(trucks, missingId), isLookup)
        if (!missing.found) {
          tagsOf(empty)?.append(el('p', 'rally-bubble', missing.error))
          setLatest(`${missingId}, ${missing.error}`)
        }
      }
      showStatus(steps)
    } catch (error) {
      showStatus(steps, error instanceof Unexpected ? error.message : `Your code threw: ${String(error)}`)
    } finally {
      running = false
      replay.disabled = false
    }
  }

  replay.addEventListener('click', () => void play())
  requestAnimationFrame(() => void play())
}
