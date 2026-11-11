// Exercise 4 scene: the door of an escape room, its keypad, and the CCTV log of your @logged decorator.
// It only calls the classes you export. You do not need to modify this file.
import { print } from '../print'
import './escape-room.css'

// ---------- what the scene receives from your exercise file ----------

export interface SceneTeam {
  readonly name: string
  readonly players: number
}

export interface SceneRoom {
  readonly name: string
  readonly team: SceneTeam | undefined
  hint(): string
  checkIn(team: SceneTeam | undefined): void
  isOccupied(): boolean
  tryCode(code: string): boolean
  reset(): void
}

export interface SceneWaitlist {
  join(item: SceneTeam): number
  next(): SceneTeam | undefined
  names(): string[]
}

/** The rooms, waitlist and audit built by src/4-begin.ts (or src/4-end.ts) */
export interface EscapeRoomApi<R extends SceneRoom, W extends SceneWaitlist> {
  rooms: readonly R[]
  waitlist: W
  audit: readonly string[]
  board: (rooms: readonly R[], waitlist: W) => string[]
}

type Result<T> = { ok: true; value: T } | { ok: false }
type Step = { n: number; hint: string }

const CODE_LENGTH = 4
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'DEL', '0', 'ENT'] as const

// ---------- small DOM helpers ----------

const svgPaths = {
  next: '<path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" /><path d="M4 12h11" /><path d="m11 8 4 4-4 4" />',
  bulb: '<path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3Z" />',
  key: '<circle cx="8" cy="15" r="4" /><path d="m11 12 8-8" /><path d="m16 7 2 2" /><path d="m18 5 2 2" />',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5" />',
  wait: '<circle cx="12" cy="12" r="8" /><path d="M12 8v4.5l3 2" />',
  alert: '<path d="M12 4 2.8 20h18.4z" /><path d="M12 10v4.5" /><path d="M12 17.5v.01" />',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="3" />',
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

function svg(name: keyof typeof svgPaths, className = 'er-icon'): SVGSVGElement {
  const node = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  node.setAttribute('viewBox', '0 0 24 24')
  node.setAttribute('aria-hidden', 'true')
  node.setAttribute('class', className)
  node.innerHTML = svgPaths[name]
  return node
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function quietly<T>(run: () => T, fallback: T): T {
  try {
    return run()
  } catch {
    return fallback
  }
}

/** "Clockmaker's Attic: tryCode(1066) returned false" -> "tryCode(1066) returned false" */
function shortLine(line: string): string {
  const colon = line.indexOf(': ')
  return colon === -1 ? line : line.slice(colon + 2)
}

// ---------- the scene ----------

// Mounts the scene in #scene, and prints the board in the console
export function mountScene<R extends SceneRoom, W extends SceneWaitlist>(api: EscapeRoomApi<R, W>): void {
  try {
    api.board(api.rooms, api.waitlist).forEach(print)
  } catch (error) {
    console.error('The board threw while printing:', error)
  }

  if (typeof document === 'undefined') return
  const host = document.querySelector<HTMLElement>('#scene')
  if (!host) return
  const root = el('div', 'er-root')
  host.replaceChildren(root)

  try {
    build(root, api)
  } catch (error) {
    root.replaceChildren(el('p', 'er-alert', `The scene could not start: ${describe(error)}`))
  }
}

function build<R extends SceneRoom, W extends SceneWaitlist>(root: HTMLElement, api: EscapeRoomApi<R, W>): void {
  const { waitlist, audit } = api
  // one door: the first room with a team inside, else the first room
  const found = api.rooms.find(r => quietly(() => r.isOccupied(), false)) ?? api.rooms[0]
  if (!found) {
    root.append(el('p', 'er-alert', 'No room was given to the scene.'))
    return
  }
  const room: R = found

  let entry = ''
  let busy = false
  let open = false
  let hint = ''
  let error = ''
  let shownLines = 0

  function call<T>(label: string, run: () => T): Result<T> {
    try {
      return { ok: true, value: run() }
    } catch (thrown) {
      console.error(`${label} threw:`, thrown)
      error = `${label} threw: ${describe(thrown)}`
      return { ok: false }
    }
  }

  // ---------- stage: toolbar, plaque, door, keypad, CCTV ----------
  const stage = el('section', 'er-stage')
  stage.setAttribute('aria-label', `The door of ${room.name}`)

  const toolbar = el('div', 'er-toolbar')
  const nextButton = el('button', 'er-primary')
  nextButton.type = 'button'
  nextButton.append(svg('next'), 'Next team')
  toolbar.append(nextButton)

  const set = el('div', 'er-set')
  const wall = el('div', 'er-wall')

  // the plaque: one line, from the isOccupied guard
  const plaque = el('div', 'er-plaque')
  plaque.title = room.name

  const frame = el('div', 'er-frame')
  const door = el('div', 'er-door')
  door.append(el('span', 'er-door-panel'), el('span', 'er-door-panel'), el('span', 'er-handle'))
  frame.append(el('div', 'er-light'), door)
  const doorway = el('div', 'er-doorway')
  doorway.append(plaque, frame)

  const keypad = el('div', 'er-keypad')
  keypad.setAttribute('role', 'group')
  keypad.setAttribute('aria-label', `Keypad of ${room.name}`)
  const display = el('div', 'er-display')
  const slots = Array.from({ length: CODE_LENGTH }, () => el('span', 'er-slot'))
  display.append(...slots)
  const keys = el('div', 'er-keys')
  const keyButtons = KEYS.map(key => {
    const node = el('button', `er-key${key === 'ENT' ? ' er-key--enter' : key === 'DEL' ? ' er-key--side' : ''}`, key)
    node.type = 'button'
    if (key === 'DEL') node.setAttribute('aria-label', 'Delete the last digit')
    if (key === 'ENT') node.setAttribute('aria-label', 'Enter: try the code')
    node.addEventListener('click', () => (key === 'ENT' ? submit() : key === 'DEL' ? backspace() : press(key)))
    keys.append(node)
    return { key, node }
  })
  const hintButton = el('button', 'er-hint')
  hintButton.type = 'button'
  keypad.append(display, keys, hintButton)

  // step 2: the base class of the room (Room.prototype), and whether it still has its own hint()
  const base = quietly((): { hint?: unknown } | null => {
    let proto: object | null = Object.getPrototypeOf(room)
    while (proto && Object.getPrototypeOf(proto) && Object.getPrototypeOf(proto) !== Object.prototype) proto = Object.getPrototypeOf(proto)
    return proto
  }, null)
  const isAbstract = !!base && !Object.prototype.hasOwnProperty.call(base, 'hint')
  const roomKind = quietly(() => room.constructor.name, '') || room.name
  // before step 2: a plain Hint link; after: the abstract hint() each room writes
  hintButton.append(svg('bulb'), isAbstract ? el('code', 'er-hint-tag', 'abstract hint()') : 'Hint')
  hintButton.title = isAbstract ? `${roomKind} writes its own hint()` : 'Room still has a generic hint()'

  wall.append(doorway, keypad)
  set.append(wall, el('div', 'er-shadow'))

  // the CCTV: what your @logged decorator wrote into audit
  const cctv = el('aside', 'er-cctv')
  cctv.setAttribute('aria-label', 'CCTV: the audit written by @logged')
  const cctvHead = el('header', 'er-cctv-head')
  cctvHead.append(el('span', 'er-rec', 'REC'), el('code', 'er-cctv-title', '@logged'))
  const log = el('ol', 'er-log')
  log.setAttribute('aria-live', 'polite')
  cctv.append(cctvHead, log)

  // the lobby screen: what JSON.stringify reads from the room (step 1 hides the code)
  const lobby = el('div', 'er-lobby')
  const lobbyText = el('span', '')
  lobby.append(svg('eye'), lobbyText)

  // the first step still to do floats over the door
  const waitingCard = el('div', 'er-waiting')
  const waitingTitle = el('strong', '')
  const waitingText = el('span', '')
  waitingCard.append(svg('wait', 'er-waiting-icon'), waitingTitle, waitingText)

  stage.append(toolbar, lobby, set, cctv, waitingCard)

  // one short caption under the stage: the latest attempt and what to do next
  const caption = el('div', 'er-caption')
  caption.setAttribute('aria-live', 'polite')
  root.append(stage, caption)

  // ---------- keypad ----------
  function press(key: string): void {
    if (busy || open || entry.length >= CODE_LENGTH) return
    entry += key
    const match = keyButtons.find(k => k.key === key)
    if (match) {
      match.node.classList.add('is-pressed')
      setTimeout(() => match.node.classList.remove('is-pressed'), 140)
    }
    renderDisplay()
  }

  function backspace(): void {
    if (busy || open) return
    entry = entry.slice(0, -1)
    renderDisplay()
  }

  function submit(): void {
    if (busy || open || entry.length < CODE_LENGTH) return
    const code = entry
    error = ''
    const result = call(`${room.name}.tryCode`, () => room.tryCode(code))
    syncLog()
    if (result.ok && result.value) {
      open = true
      stage.classList.add('is-open')
    } else if (result.ok) {
      busy = true
      stage.classList.remove('is-wrong')
      void stage.offsetWidth // restart the shake
      stage.classList.add('is-wrong')
      setTimeout(() => {
        busy = false
        entry = ''
        stage.classList.remove('is-wrong')
        renderDisplay()
        render()
      }, 900)
    }
    renderDisplay()
    render()
  }

  function renderDisplay(): void {
    const word = open ? 'OPEN' : ''
    slots.forEach((slot, i) => {
      slot.textContent = word ? (word[i] ?? '') : (entry[i] ?? '')
      slot.classList.toggle('is-filled', !word && i < entry.length)
    })
    display.setAttribute('aria-label', open ? 'Door open' : `Code: ${entry.split('').join(' ') || 'empty'}`)
    for (const { node } of keyButtons) node.disabled = open
  }

  // ---------- steps you can see on the page ----------
  function pendingSteps(): Step[] {
    const steps: Step[] = []
    const json = quietly(() => JSON.stringify(room), '')
    if (/"code"\s*:/.test(json)) steps.push({ n: 1, hint: 'The lobby can read the code: keep it in a #code field.' })
    if (!isAbstract) steps.push({ n: 2, hint: 'Room still writes a generic hint(): make Room and hint() abstract.' })
    if (audit.length === 0) steps.push({ n: 3, hint: 'The CCTV records nothing: put @logged above tryCode.' })
    return steps
  }

  function render(): void {
    // the plaque: the isOccupied guard tells whether a team is inside
    const occupied = quietly(() => room.isOccupied(), false)
    plaque.textContent = occupied ? `${room.team?.name ?? 'A team'}${open ? ' escaped!' : ' inside'}` : `${room.name} is free`
    plaque.classList.toggle('is-busy', occupied)

    // the lobby: the same JSON.stringify the board prints for a free room
    const leaked = quietly(() => (JSON.parse(JSON.stringify(room)) as { code?: unknown }).code, undefined)
    lobby.classList.toggle('is-leaking', leaked !== undefined)
    lobbyText.textContent = leaked !== undefined ? `Lobby sees code ${String(leaked)}` : 'Lobby sees no code'

    const names = quietly(() => waitlist.names(), [])
    nextButton.disabled = names.length === 0 || busy
    nextButton.title = names.length ? `Reset the room and check in ${names[0]}` : 'Nobody is waiting'

    const [first] = pendingSteps()
    waitingCard.hidden = !first
    if (first) {
      waitingTitle.textContent = `Waiting for step ${first.n}`
      waitingText.textContent = first.hint
    }

    // caption line 1: the latest attempt the CCTV recorded, or the hint you asked for
    const latest = el('p', 'er-caption-latest')
    const last = audit.at(-1)
    if (hint) latest.append(svg('bulb'), el('span', 'er-hint-text', hint))
    else latest.append(svg('key'), 'Latest: ', el('code', '', last ? shortLine(last) : 'no attempt recorded'))

    // caption line 2: errors first, then the steps left, then all done
    const status = el('p', 'er-caption-status')
    if (error) {
      status.classList.add('is-error')
      status.append(svg('alert'), error)
    } else if (first) {
      status.classList.add('is-waiting')
      status.append(svg('wait'), el('strong', '', `Waiting for step ${first.n}.`), ` ${first.hint}`)
    } else {
      status.append(svg('check'), open ? 'All steps done: the door is open.' : 'All steps done. Type the code and press Enter.')
    }
    caption.replaceChildren(latest, status)
  }

  // ---------- CCTV ----------
  function syncLog(): void {
    if (audit.length < shownLines) {
      log.replaceChildren()
      shownLines = 0
    }
    const isFirst = shownLines === 0
    for (const line of audit.slice(shownLines)) {
      const match = shortLine(line).match(/^(.*) returned (.*)$/)
      const item = el('li', `er-line${isFirst ? '' : ' is-new'}`)
      if (match) {
        const [, callText = '', result = ''] = match
        item.append(el('span', '', callText), el('span', `er-result is-${result}`, result))
      } else {
        item.append(el('span', '', shortLine(line)))
      }
      log.append(item)
    }
    // a small log: only the last four lines stay
    while (log.children.length > 4) log.firstElementChild?.remove()
    const changed = shownLines !== audit.length
    shownLines = audit.length
    cctv.classList.toggle('is-off', audit.length === 0)
    if (audit.length > 0) log.querySelector('.er-line--off')?.remove()
    else if (log.children.length === 0) log.append(el('li', 'er-line er-line--off', 'no signal'))
    if (changed) render()
  }

  // ---------- buttons ----------
  hintButton.addEventListener('click', () => {
    error = ''
    if (isAbstract) {
      // after step 2: the room's own hint
      const result = call(`${room.name}.hint`, () => room.hint())
      hint = result.ok ? `${roomKind}: “${result.value || '...'}”` : ''
    } else {
      // before step 2: the generic body that Room still gives every room
      const generic = typeof base?.hint === 'function' ? call('Room.hint', () => String((base.hint as () => unknown).call(room))) : { ok: true as const, value: '' }
      hint = generic.ok ? `Generic Room hint: “${generic.value || 'nothing'}”` : ''
    }
    render()
  })

  // reset the room, then the next team of the waitlist checks in
  nextButton.addEventListener('click', () => {
    error = ''
    if (!call(`${room.name}.reset`, () => room.reset()).ok) return render()
    const next = call('waitlist.next', () => waitlist.next())
    if (!next.ok) return render()
    const team = next.value
    if (!call(`${room.name}.checkIn`, () => room.checkIn(team)).ok) return render()
    open = false
    entry = ''
    hint = ''
    stage.classList.remove('is-open')
    renderDisplay()
    render()
  })

  // physical keyboard: digits, Backspace, Enter
  document.addEventListener('keydown', (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return
    const target = event.target
    if (target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return
    if (event.key === 'Enter') {
      if (target instanceof HTMLElement && /^(BUTTON|A|SUMMARY)$/.test(target.tagName)) return
      event.preventDefault()
      submit()
    } else if (event.key === 'Backspace') {
      event.preventDefault()
      backspace()
    } else if (/^\d$/.test(event.key)) {
      press(event.key)
    }
  })

  // the CCTV also picks up audit lines written outside the scene
  setInterval(syncLog, 600)

  renderDisplay()
  syncLog()
  render()
}
