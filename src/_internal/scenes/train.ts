// The night train scene of exercise 3. You do not need to modify this file.
// It draws the Moonline sleeper, one carriage per cabin class. Clicking a cabin window runs
// your issue, fare and ticketLine, and the ticket slides out above the carriage.
import './train.css'
import { breakfastPerNight, departure, euros } from '../night-train'

export type SceneBooking = {
  readonly id: string
  readonly passenger: string
  readonly cabin: string
  readonly nights: number
  readonly breakfast: boolean
}

export type SceneTicket = {
  readonly id: string
  readonly passenger: string
  readonly cabin: string
  readonly total: number
}

export type SceneCabin = { readonly car: number; readonly class: string }

export type TrainApi<B extends SceneBooking, T extends SceneTicket> = {
  cabinClasses: readonly string[]
  fares: { readonly [cabinClass: string]: number }
  cabins: { readonly [cabinId: string]: SceneCabin }
  bookings: readonly B[]
  issue: (booking: B) => T
  ticketLine: (ticket: T) => string
}

type Outcome<T> =
  | { kind: 'ticket'; ticket: T; line: string }
  | { kind: 'waiting'; step: number; message: string }
  | { kind: 'error'; message: string }

// ---------- small DOM helpers ----------

const SVG_NS = 'http://www.w3.org/2000/svg'

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

function svg(className: string, viewBox: string, markup: string): SVGSVGElement {
  const node = document.createElementNS(SVG_NS, 'svg')
  node.setAttribute('class', className)
  node.setAttribute('viewBox', viewBox)
  node.setAttribute('aria-hidden', 'true')
  node.setAttribute('focusable', 'false')
  node.innerHTML = markup
  return node
}

function describeError(error: unknown): string {
  return error instanceof Error ? `${error.name}: ${error.message}` : String(error)
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

// ---------- drawings ----------

const moonIcon = '<path d="M15.5 3.2a9 9 0 1 0 5.3 12.6A7.4 7.4 0 0 1 15.5 3.2Z" fill="currentColor"/>'
const checkIcon = '<path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'
const hourglassIcon = '<path d="M7 3h10M7 21h10M8 3c0 5 8 6 8 9s-8 4-8 9M16 3c0 5-8 6-8 9s8 4 8 9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
const ticketIcon = '<path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2.5a2.5 2.5 0 0 0 0 5V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2.5a2.5 2.5 0 0 0 0-5Z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M14 5v14" stroke="currentColor" stroke-width="2" stroke-dasharray="2 2.4"/>'
const bugIcon = '<path d="M9 7a3 3 0 0 1 6 0M6 11h12M12 11v9M5 8l2.5 2M19 8l-2.5 2M4 14h3M17 14h3M5.5 19.5 8 17M18.5 19.5 16 17M7 11a5 5 0 0 0 10 0v3a5 5 0 0 1-10 0Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'

function icon(markup: string, className: string): SVGSVGElement {
  return svg(className, '0 0 24 24', markup)
}

function wheelsMarkup(): string {
  const wheel = (cx: number) =>
    `<g class="ml-wheel" style="transform-origin:${cx}px 17px"><circle cx="${cx}" cy="17" r="9.5" fill="#06192a" stroke="#8aa3b8" stroke-width="2"/>` +
    `<path d="M${cx - 8} 17H${cx + 8}M${cx} 9V25" stroke="#8aa3b8" stroke-width="1.6"/></g>`
  return `<rect x="4" y="4" width="52" height="7" rx="3" fill="#061827"/>${wheel(15)}${wheel(45)}`
}

const locoMarkup = `
  <path d="M60 30 75 10M90 30 75 10M62 10H88" stroke="#8aa3b8" stroke-width="2.4" stroke-linecap="round" fill="none"/>
  <path d="M6 46Q6 32 20 32H116Q138 32 152 54L166 84Q170 94 170 106V142Q170 150 162 150H12Q6 150 6 144Z" fill="#1d5a8c"/>
  <path d="M124 44H142L156 74H124Z" fill="#0a2033"/>
  <rect x="6" y="112" width="164" height="6" fill="#e2bf6b"/>
  <path d="M60 60a14 14 0 1 0 10 23a11 11 0 0 1-10-23Z" fill="#e2bf6b"/>
  <circle cx="163" cy="128" r="5" fill="#fff6d2"/>
`

// ---------- the scene ----------

let mounted = false

function errorScene(text: string): HTMLElement {
  const root = el('div', 'moonline')
  const note = el('p', 'ml-caption-status is-error')
  note.append(icon(bugIcon, 'ml-icon'), text)
  root.append(note)
  return root
}

// If your code stops before calling mountScene, the scene still says why instead of staying blank
if (typeof document !== 'undefined') {
  setTimeout(() => {
    if (mounted) return
    document.querySelector('#scene')?.replaceChildren(errorScene('The train is still at the depot: your code stopped before the scene could start. The red panel above says why.'))
  }, 0)
}

export function mountScene<B extends SceneBooking, T extends SceneTicket>(api: TrainApi<B, T>): void {
  mounted = true
  if (typeof document === 'undefined') return
  const host = document.querySelector<HTMLElement>('#scene')
  if (!host) return
  try {
    host.replaceChildren(buildScene(api))
  } catch (error) {
    console.error(error)
    host.replaceChildren(errorScene(`The scene could not start: ${describeError(error)}`))
  }
}

function buildScene<B extends SceneBooking, T extends SceneTicket>(api: TrainApi<B, T>): HTMLElement {
  const root = el('div', 'moonline')
  const issued = new Map<string, { ticket: T; line: string; node: HTMLElement }>()
  const cabinButtons = new Map<string, HTMLButtonElement>()
  const route = departure.match(/^(.*?), (.*) to (.*)$/)
  let latest: { line: string } | { error: string } | undefined

  function cabinOf(id: string): SceneCabin | undefined {
    return Object.hasOwn(api.cabins, id) ? api.cabins[id] : undefined
  }

  function evaluate(booking: B): Outcome<T> {
    const cabin = cabinOf(booking.cabin)
    if (!cabin) return { kind: 'error', message: `cabin ${booking.cabin} is not on this train.` }
    let ticket: T
    try {
      ticket = api.issue(booking)
    } catch (error) {
      console.error(error)
      return { kind: 'error', message: `issue(${booking.id}) threw ${describeError(error)}` }
    }
    const perNight = api.fares[cabin.class]
    if (perNight === undefined) {
      return { kind: 'waiting', step: 1, message: `fares has no ${cabin.class} price. Add as const, then satisfies Record<CabinClass, number>.` }
    }
    const expected = (perNight + (booking.breakfast ? breakfastPerNight : 0)) * booking.nights
    if (ticket.total !== expected) {
      return { kind: 'waiting', step: 3, message: `fare() returns ${String(ticket.total)} for ${booking.cabin}. Derive CabinId with keyof typeof cabins, then set perNight.` }
    }
    try {
      return { kind: 'ticket', ticket, line: api.ticketLine(ticket) }
    } catch (error) {
      console.error(error)
      return { kind: 'error', message: `ticketLine(${ticket.id}) threw ${describeError(error)}` }
    }
  }

  // ----- the stage: the Depart button, the waiting card and the train -----

  const stage = el('div', 'ml-stage')
  const departButton = el('button', 'ml-depart')
  departButton.type = 'button'
  departButton.setAttribute('aria-pressed', 'false')
  const departLabel = el('span', '', 'Depart')
  departButton.append(icon(moonIcon, 'ml-icon'), departLabel)

  const waiting = el('div', 'ml-waiting')
  waiting.setAttribute('role', 'status')

  const line = el('div', 'ml-line')
  const train = el('div', 'ml-train')
  train.setAttribute('role', 'group')
  train.setAttribute('aria-label', 'The Moonline train, one carriage per cabin class')

  const cabinIds = Object.keys(api.cabins)
  const classes = [...api.cabinClasses]
  for (const id of cabinIds) {
    const cls = cabinOf(id)?.class
    if (cls !== undefined && !classes.includes(cls)) classes.push(cls)
  }
  for (const [index, cls] of classes.toReversed().entries()) {
    const ids = cabinIds.filter(id => cabinOf(id)?.class === cls)
    const car = el('div', `ml-car ml-car--${index % 3}`)
    const body = el('div', 'ml-car-body')
    body.append(el('span', 'ml-car-class', capitalize(cls)))
    const windows = el('div', 'ml-windows')
    for (const id of ids) {
      const booking = api.bookings.find(b => b.cabin === id)
      const button = el('button', 'ml-cabin')
      button.type = 'button'
      button.append(el('span', 'ml-cabin-id', id), icon(checkIcon, 'ml-cabin-check'))
      button.setAttribute('aria-label', booking ? `Cabin ${id}, ${cls}, ${booking.passenger}: print the ticket` : `Cabin ${id}, ${cls}: empty`)
      button.addEventListener('click', () => {
        if (booking) board(booking, button, car)
      })
      if (!booking) button.disabled = true
      cabinButtons.set(id, button)
      windows.append(button)
    }
    const fare = api.fares[cls]
    body.append(windows, fare === undefined ? el('span', 'ml-fare ml-fare--missing', 'No fare') : el('span', 'ml-fare', euros(fare)))
    const bogies = el('div', 'ml-bogies')
    bogies.append(svg('ml-bogie', '0 0 60 28', wheelsMarkup()), svg('ml-bogie', '0 0 60 28', wheelsMarkup()))
    car.append(body, bogies)
    train.append(car)
  }
  const loco = el('div', 'ml-loco')
  const locoBogies = el('div', 'ml-bogies')
  locoBogies.append(svg('ml-bogie', '0 0 60 28', wheelsMarkup()), svg('ml-bogie', '0 0 60 28', wheelsMarkup()))
  loco.append(svg('ml-loco-svg', '0 0 170 150', locoMarkup), locoBogies)
  train.append(loco)
  line.append(train, el('div', 'ml-rail'))
  stage.append(line, waiting, departButton)

  // ----- one short caption under the train: the latest ticket and what to do next -----

  const caption = el('div', 'ml-caption')
  caption.setAttribute('aria-live', 'polite')
  root.append(stage, caption)

  function steps(): { step: number; message: string } | { error: string } | undefined {
    const outcomes = api.bookings.map(evaluate)
    const error = outcomes.find(outcome => outcome.kind === 'error')
    if (error) return { error: error.message }
    return outcomes
      .filter(outcome => outcome.kind === 'waiting')
      .toSorted((a, b) => a.step - b.step)[0]
  }

  function render() {
    const next = steps()
    waiting.hidden = next === undefined || 'error' in next
    if (next && !('error' in next)) {
      waiting.replaceChildren(icon(hourglassIcon, 'ml-icon ml-waiting-icon'), el('strong', '', `Waiting for step ${next.step}`), el('span', '', next.message))
    }

    const latestLine = el('p', 'ml-caption-latest')
    latestLine.append(icon(ticketIcon, 'ml-icon'))
    if (latest === undefined) latestLine.append(el('span', '', 'Click a cabin window to print its ticket.'))
    else if ('error' in latest) latestLine.append(el('code', 'ml-problem', latest.error))
    else latestLine.append(el('code', '', `Latest: ${latest.line}`))

    const status = el('p', 'ml-caption-status')
    if (next && 'error' in next) {
      status.classList.add('is-error')
      status.append(icon(bugIcon, 'ml-icon'), el('span', '', `Your code threw: ${next.error}`))
    } else if (next) {
      status.classList.add('is-waiting')
      status.append(icon(hourglassIcon, 'ml-icon'), el('strong', '', `Waiting for step ${next.step}.`), ` ${next.message}`)
    } else {
      status.append(icon(checkIcon, 'ml-icon'), 'All steps done: every cabin prints its ticket.')
    }
    caption.replaceChildren(latestLine, status)

    for (const [id, button] of cabinButtons) {
      const booking = api.bookings.find(b => b.cabin === id)
      button.classList.toggle('is-booked', booking !== undefined && issued.has(booking.id))
    }
    for (const entry of issued.values()) {
      entry.node.classList.toggle('is-latest', latest !== undefined && 'line' in latest && latest.line === entry.line)
    }
  }

  // one short line per ticket: id, passenger, total. The latest one wears the type it was derived from.
  function ticketNode(ticket: T): HTMLElement {
    const node = el('article', 'ml-ticket')
    node.setAttribute('aria-label', `Ticket ${ticket.id} for ${ticket.passenger}, ${euros(ticket.total)}`)
    node.append(
      el('span', 'ml-ticket-id', ticket.id),
      el('span', 'ml-ticket-name', ticket.passenger),
      el('span', 'ml-ticket-fare', euros(ticket.total)),
      el('code', 'ml-ticket-type', 'ReturnType<typeof issue>'),
    )
    return node
  }

  function nudge(target: HTMLElement) {
    if (reducedMotion()) return
    target.animate(
      [{ transform: 'translateX(0)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'translateX(0)' }],
      { duration: 260, iterations: 2 },
    )
  }

  function board(booking: B, origin: HTMLElement, car: HTMLElement) {
    const existing = issued.get(booking.id)
    if (existing) {
      latest = { line: existing.line }
      render()
      nudge(existing.node)
      return
    }
    const outcome = evaluate(booking)
    if (outcome.kind === 'waiting') {
      nudge(waiting.hidden ? origin : waiting)
      return
    }
    if (outcome.kind === 'error') {
      latest = { error: `${outcome.message} (details in the console)` }
      render()
      nudge(origin)
      return
    }
    const node = ticketNode(outcome.ticket)
    car.append(node)
    issued.set(booking.id, { ticket: outcome.ticket, line: outcome.line, node })
    latest = { line: outcome.line }
    render()
    // the ticket slides up out of the cabin window
    if (!reducedMotion()) {
      const from = origin.getBoundingClientRect()
      const to = node.getBoundingClientRect()
      const dx = from.left + from.width / 2 - (to.left + to.width / 2)
      const dy = from.top + from.height / 2 - (to.top + to.height / 2)
      node.animate(
        [
          { transform: `translate(${dx}px, ${dy}px) scale(0.1)`, opacity: 0 },
          { transform: `translate(${dx * 0.3}px, ${dy * 0.3}px) scale(0.8)`, opacity: 1, offset: 0.45 },
          { transform: 'translate(0, 0) scale(1)', opacity: 1 },
        ],
        { duration: 900, easing: 'cubic-bezier(.2, .8, .3, 1)' },
      )
    }
  }

  // ----- departure: the train rolls gently to the right -----

  let rolling = false
  departButton.addEventListener('click', () => {
    rolling = !rolling
    root.classList.toggle('is-rolling', rolling)
    departButton.setAttribute('aria-pressed', String(rolling))
    departLabel.textContent = rolling ? `On the way to ${route?.[3]?.replace(/ \d\d:\d\d/, '') ?? 'Vienna'}` : 'Depart'
  })

  render()
  return root
}
