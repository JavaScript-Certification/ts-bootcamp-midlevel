// The karaoke stage of exercise 6: requests accepted or dropped in the bin, one mic that always goes back to its dock, and the sign-up form.
// It only calls the functions you export, on a dock that reports every lend and give back. You do not need to modify this file.
import { MicDock } from '../karaoke-night'
import './karaoke.css'

export type SceneSongRequest = { singer: string; song: string; minutes: number }

// What the scene needs from your file. Your functions fit these shapes, before and after the steps.
export type KaraokeApi = {
  requests: readonly string[]
  toSongRequest: (value: unknown) => SceneSongRequest | null
  parseRequest: (raw: string) => SceneSongRequest | null
  borrowMic: (dock: MicDock, singer: string) => { singer: string }
  perform: (dock: MicDock, request: SceneSongRequest) => string
  turn: (dock: MicDock, request: SceneSongRequest) => string
  runNight: (dock: MicDock, raws: readonly string[]) => string[]
  field: (root: ParentNode, selector: string) => HTMLInputElement
}

// ---------- a dock that tells the stage what happened ----------

type DockEvent =
  | { kind: 'lend'; singer: string }
  | { kind: 'refused'; singer: string; holder: string | null }
  | { kind: 'sing' }
  | { kind: 'back' }

class StageDock extends MicDock {
  events: DockEvent[] = []

  // sing() reads the holder: that read marks the moment the song starts
  override get holder(): string | null {
    this.events.push({ kind: 'sing' })
    return super.holder
  }

  current(): string | null {
    return super.holder
  }

  override lend(singer: string): void {
    const holder = super.holder
    try {
      super.lend(singer)
    } catch (error) {
      this.events.push({ kind: 'refused', singer, holder })
      throw error
    }
    this.events.push({ kind: 'lend', singer })
  }

  override giveBack(): void {
    super.giveBack()
    this.events.push({ kind: 'back' })
  }

  take(): DockEvent[] {
    const events = this.events
    this.events = []
    return events
  }
}

// ---------- small helpers ----------

type Attempt<T> = { ok: true; value: T } | { ok: false; error: string }

function attempt<T>(run: () => T): Attempt<T> {
  try {
    return { ok: true, value: run() }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}

function check(run: () => boolean): boolean {
  const result = attempt(run)
  return result.ok && result.value
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

// static, trusted markup only: names and songs always go through textContent
function drawing(tag: 'span' | 'div', className: string, markup: string): HTMLElement {
  const node = el(tag, className)
  node.innerHTML = markup
  return node
}

function find<T extends Element>(root: ParentNode, selector: string, type: new () => T): T {
  const node = root.querySelector(selector)
  if (!(node instanceof type)) throw new Error(`Karaoke scene: missing ${selector}`)
  return node
}

const reduceMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))
// movement is skipped with reduced motion, reading pauses are only shortened
const move = (ms: number) => wait(reduceMotion() ? 0 : ms)
const pause = (ms: number) => wait(reduceMotion() ? Math.round(ms * 0.6) : ms)

function hash(text: string): number {
  let value = 7
  for (const char of text) value = (value * 31 + (char.codePointAt(0) ?? 0)) % 9973
  return value
}

const outfits = ['#358ef1', '#ff4fd8', '#f1dd35', '#4be0a6'] as const
const skins = ['#f2c7a5', '#d9a074', '#a8693f', '#7a4a2a', '#f5d6b8'] as const
const hairs = ['#2a1a12', '#5a3418', '#111018', '#c98a3a', '#7b2f6b'] as const

function pick<T>(list: readonly [T, ...T[]], seed: number): T {
  return list[seed % list.length] ?? list[0]
}

// ---------- drawings ----------

const icon = {
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z"/></svg>',
  again: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" d="M4 12a8 8 0 1 0 2.6-5.9M4 4v4.5h4.5"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
  cross: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" d="m6.5 6.5 11 11m0-11-11 11"/></svg>',
  note: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M9 17.5a3 3 0 1 1-2-2.83V5.2a1 1 0 0 1 .76-.97l9-2.25A1 1 0 0 1 18 3v11.5a3 3 0 1 1-2-2.83V6.3l-7 1.75Z"/></svg>',
  hourglass: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" d="M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9s8 4 8 9"/></svg>',
}

const micDrawing = `<svg viewBox="0 0 24 60" aria-hidden="true">
  <path d="M6.5 22 9 57a2 2 0 0 0 2 1.8h2A2 2 0 0 0 15 57l2.5-35Z" fill="#2a2f45"/>
  <rect x="5.5" y="19.5" width="13" height="4" rx="1.6" fill="#8a93b8"/>
  <circle cx="12" cy="11" r="10" fill="#d9dce8"/>
  <path d="M4 8h16M2.6 12h18.8M4 16h16M8 2.5v17M12 1v20M16 2.5v17" stroke="#9aa1bb" stroke-width=".7"/>
  <circle class="kn-mic-led" cx="12" cy="31" r="1.6"/>
</svg>`

const dockDrawing = `<svg viewBox="0 0 60 70" aria-hidden="true">
  <ellipse class="kn-dock-ring" cx="30" cy="62" rx="26" ry="6"/>
  <ellipse cx="30" cy="61" rx="21" ry="4.5" fill="#1e3a57"/>
  <path d="M25 61V30h10v31Z" fill="#24476a"/>
  <path d="M17 18h26l-4 14H21Z" fill="#2c5680"/>
</svg>`

function singerDrawing(name: string, index: number): string {
  const outfit = pick(outfits, index)
  const skin = pick(skins, hash(`${name}skin`))
  const hair = pick(hairs, hash(`${name}hair`))
  return `<svg viewBox="0 0 60 110" aria-hidden="true">
    <path d="M15 58 Q9 72 12 86" stroke="${outfit}" stroke-width="7" stroke-linecap="round" fill="none"/>
    <path d="M30 44C17 44 11 55 11 69L9 103Q30 108 51 103L49 69C49 55 43 44 30 44Z" fill="${outfit}"/>
    <g class="kn-arm"><path d="M45 58 Q51 72 48 86" stroke="${outfit}" stroke-width="7" stroke-linecap="round" fill="none"/><circle cx="48" cy="87" r="4" fill="${skin}"/></g>
    <circle cx="12" cy="87" r="4" fill="${skin}"/>
    <rect x="26" y="36" width="8" height="9" rx="3" fill="${skin}"/>
    <circle cx="30" cy="26" r="15" fill="${skin}"/>
    <path d="M14.5 26Q14 9 30 9.5Q46 9 45.5 26Q42 17 33 16.5Q27 21 19 20Q16 22 14.5 26Z" fill="${hair}"/>
    <circle cx="24.5" cy="28" r="1.9" fill="#00273f"/><circle cx="35.5" cy="28" r="1.9" fill="#00273f"/>
    <path class="kn-smile" d="M25.5 33.5Q30 37.5 34.5 33.5" fill="none" stroke="#00273f" stroke-width="1.8" stroke-linecap="round"/>
    <ellipse class="kn-sing-mouth" cx="30" cy="35" rx="3" ry="3.4" fill="#00273f"/>
    <path class="kn-frown" d="M26 36Q30 32.5 34 36" fill="none" stroke="#00273f" stroke-width="1.8" stroke-linecap="round"/>
  </svg>`
}

// the stage itself: a platform seen from the front, drawn in the 160 by 90 box of the stage
const platformDrawing = `<svg viewBox="0 0 160 90" aria-hidden="true">
  <defs>
    <linearGradient id="kn-top" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2357"/><stop offset="1" stop-color="#55327a"/></linearGradient>
    <linearGradient id="kn-front" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1442"/><stop offset="1" stop-color="#1f0e33"/></linearGradient>
    <radialGradient id="kn-shadow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#000" stop-opacity=".45"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
  </defs>
  <ellipse cx="80" cy="84" rx="70" ry="5" fill="url(#kn-shadow)"/>
  <path d="M56 4v52M104 4v52" stroke="#4a3866" stroke-width="1"/>
  <path d="M33 56h94l11 17H22Z" fill="url(#kn-top)"/>
  <path d="M51 56 45 73M68 56 66 73M85 56 86 73M102 56 106 73M118 56 126 73" stroke="#000" stroke-opacity=".18" stroke-width=".5"/>
  <path d="M22 73h116v7H22Z" fill="url(#kn-front)"/>
  <path d="M22 73h116" stroke="#ff6fe0" stroke-opacity=".7" stroke-width=".6"/>
</svg>`

const binDrawing = `<svg viewBox="0 0 40 36" aria-hidden="true">
  <path d="M5 8h30l-3.5 25a3 3 0 0 1-3 2.6h-17a3 3 0 0 1-3-2.6Z" fill="#2b1846" stroke="#ff7b72" stroke-opacity=".7" stroke-width="1.2"/>
  <ellipse cx="20" cy="8" rx="15" ry="3.2" fill="#1a0c2b" stroke="#ff7b72" stroke-opacity=".7" stroke-width="1.2"/>
</svg>`

// ---------- positions on the stage, in % of its width (x) and height (y from the bottom) ----------

const CENTER = 50
const SINGER_Y = 20
const DOCK_X = 76
const DOCKED = { x: DOCK_X, y: 34, rotate: 0 }
const queueX = (index: number) => Math.max(18, 33 - index * 6)
const inHand = (x: number) => ({ x: x + 5, y: SINGER_Y + 17, rotate: -14 })
const DROPPED = { x: CENTER + 4, y: 20, rotate: 78 }

type Spot = { x: number; y: number; rotate: number }

type Singer = { request: SceneSongRequest; node: HTMLElement }

type Step = { n: 1 | 2 | 3; done: boolean; hint: string }

// ---------- the scene ----------

class KaraokeScene {
  readonly api: KaraokeApi
  readonly root: HTMLElement
  readonly startButton: HTMLButtonElement
  readonly stage: HTMLElement
  readonly screen: HTMLElement
  readonly people: HTMLElement
  readonly spot: HTMLElement
  readonly dockLabel: HTMLElement
  readonly mic: HTMLElement
  readonly micTag: HTMLElement
  readonly toast: HTMLElement
  readonly card: HTMLElement
  readonly binCount: HTMLElement
  readonly waiting: HTMLElement
  readonly latest: HTMLElement
  readonly status: HTMLElement
  readonly signupNote: HTMLElement
  readonly form: HTMLFormElement | null

  dock = new StageDock()
  queue: Singer[] = []
  micAt: Spot = DOCKED
  chain: Promise<void> = Promise.resolve()
  pending = 0
  nightRun = 0
  rejected = 0
  toastTimer = 0
  singerCount = 0
  readonly steps: Step[]

  constructor(host: HTMLElement, api: KaraokeApi) {
    this.api = api
    this.form = host.querySelector('form')
    this.steps = this.soundcheck()

    const root = el('section', 'kn-scene')
    root.setAttribute('aria-label', 'Karaoke stage')
    this.root = root

    // the one object: the stage, with its screen, spotlight, mic dock and rejected bin
    this.stage = el('div', 'kn-stage')
    this.stage.innerHTML = `
      <div class="kn-platform">${platformDrawing}</div>
      <div class="kn-spot"><div class="kn-cone"></div><div class="kn-pool"></div></div>
      <div class="kn-screen"></div>
      <div class="kn-bin">${binDrawing}<span class="kn-bin-label">Rejected <b class="kn-bin-count">0</b></span></div>
      <div class="kn-dock">${dockDrawing}<span class="kn-dock-label"></span></div>
      <div class="kn-people"></div>
      <div class="kn-mic">${micDrawing}<span class="kn-mic-tag"></span></div>
      <div class="kn-card" hidden></div>
      <div class="kn-toast" hidden></div>
      <div class="kn-waiting" role="status" hidden></div>`
    this.screen = find(this.stage, '.kn-screen', HTMLElement)
    this.people = find(this.stage, '.kn-people', HTMLElement)
    this.spot = find(this.stage, '.kn-spot', HTMLElement)
    this.dockLabel = find(this.stage, '.kn-dock-label', HTMLElement)
    this.mic = find(this.stage, '.kn-mic', HTMLElement)
    this.micTag = find(this.stage, '.kn-mic-tag', HTMLElement)
    this.toast = find(this.stage, '.kn-toast', HTMLElement)
    this.card = find(this.stage, '.kn-card', HTMLElement)
    this.binCount = find(this.stage, '.kn-bin-count', HTMLElement)
    this.waiting = find(this.stage, '.kn-waiting', HTMLElement)
    this.dockLabel.setAttribute('aria-live', 'polite')

    // the single button, floating over the stage
    const toolbar = el('div', 'kn-toolbar')
    this.startButton = el('button', 'kn-start')
    this.startButton.type = 'button'
    toolbar.append(this.startButton)
    this.stage.append(toolbar)

    // one line under the object
    const caption = el('div', 'kn-caption')
    this.latest = el('p', 'kn-latest')
    this.status = el('p', 'kn-status')
    this.status.setAttribute('aria-live', 'polite')
    caption.append(this.latest, this.status)

    // the sign-up form (step 3), kept small
    const signup = el('section', 'kn-signup')
    signup.setAttribute('aria-label', 'Sign up a singer')
    this.signupNote = el('p', 'kn-signup-note')
    this.signupNote.setAttribute('aria-live', 'polite')
    if (this.form) {
      this.form.classList.add('kn-form')
      signup.append(this.form)
      this.form.addEventListener('submit', event => {
        event.preventDefault()
        this.signUp()
      })
    }
    signup.append(this.signupNote)

    root.append(this.stage, caption, signup)
    host.replaceChildren(root)

    this.startButton.addEventListener('click', () => this.startNight())
    this.setStart('idle')
    this.placeMic(DOCKED)
    this.updateDock()
    this.screenText('Karaoke Night', 'Press Start the night')
    this.setLatest(null)
    this.showStatus()
    this.showWaiting()
    // until step 3 works the form looks closed: the status line already says which step is next
    signup.classList.toggle('is-closed', !this.isDone(3))
  }

  // ---------- which steps already work ----------

  soundcheck(): Step[] {
    const { toSongRequest, borrowMic, perform, field } = this.api
    const priya = { singer: 'Priya', song: 'Dancing Queen', minutes: 4 }
    const step1 = check(() => {
      const request = toSongRequest({ ...priya, table: 12 })
      return request !== null && request.singer === 'Priya' && request.song === 'Dancing Queen' && request.minutes === 4
        && toSongRequest({ singer: 'Sam', minutes: 3 }) === null && toSongRequest({ ...priya, minutes: '4' }) === null
        && toSongRequest({ ...priya, minutes: 0 }) === null
    })
    const disposable = check(() => {
      const dock = new MicDock()
      const mic = borrowMic(dock, 'Priya')
      if (!(Symbol.dispose in mic)) return false
      const dispose = mic[Symbol.dispose]
      if (typeof dispose !== 'function') return false
      dispose.call(mic)
      return dock.holder === null
    })
    const performs = check(() => {
      const dock = new MicDock()
      if (perform(dock, priya) !== 'Priya sings Dancing Queen (4 min)' || dock.holder !== null) return false
      const failed = attempt(() => perform(dock, { singer: 'Kofi', song: 'My Way', minutes: 5 }))
      return !failed.ok && dock.holder === null
    })
    const step3 = check(() => {
      const form = document.createElement('form')
      const input = document.createElement('input')
      input.id = 'kn-probe'
      form.append(input, document.createElement('textarea'))
      return field(form, '#kn-probe') === input && !attempt(() => field(form, 'textarea')).ok && !attempt(() => field(form, '#none')).ok
    })
    return [
      { n: 1, done: step1, hint: 'toSongRequest rejects every request: check minutes, then return it.' },
      {
        n: 2,
        done: disposable && performs,
        hint: disposable ? 'perform sings without the mic. Borrow it with using.' : 'The mic has no [Symbol.dispose], so it cannot go back to its dock.',
      },
      { n: 3, done: step3, hint: 'field cannot prove the inputs yet, so the sign-up form is closed.' },
    ]
  }

  isDone(n: Step['n']): boolean {
    return this.steps.find(step => step.n === n)?.done ?? false
  }

  showStatus(error?: string): void {
    const next = this.steps.find(step => !step.done)
    this.status.className = 'kn-status'
    if (error !== undefined) {
      this.status.classList.add('is-error')
      this.status.replaceChildren(drawing('span', 'kn-icon', icon.cross), `Your code threw: ${error}`)
    } else if (next) {
      this.status.classList.add('is-waiting')
      this.status.replaceChildren(drawing('span', 'kn-icon', icon.hourglass), el('strong', '', `Waiting for step ${next.n}.`), ` ${next.hint}`)
    } else {
      this.status.replaceChildren(drawing('span', 'kn-icon', icon.check), 'All steps done: the mic always goes back to its dock.')
    }
  }

  showWaiting(): void {
    const next = this.steps.find(step => !step.done)
    this.waiting.hidden = next === undefined || this.pending > 0
    if (next) this.waiting.replaceChildren(drawing('span', 'kn-waiting-icon', icon.hourglass), el('strong', '', `Waiting for step ${next.n}`), el('span', '', next.hint))
  }

  setLatest(line: string | null): void {
    this.latest.hidden = line === null
    if (line !== null) this.latest.replaceChildren(drawing('span', 'kn-icon', icon.note), el('code', '', `Latest: ${line}`))
  }

  setStart(state: 'idle' | 'busy' | 'again'): void {
    const label = state === 'again' ? 'Run the night again' : state === 'busy' ? 'On stage...' : 'Start the night'
    this.startButton.replaceChildren(drawing('span', 'kn-start-icon', state === 'again' ? icon.again : icon.play), el('span', '', label))
    this.startButton.disabled = state === 'busy'
  }

  // ---------- the job queue: one thing on stage at a time ----------

  enqueue(job: () => Promise<void>): void {
    this.pending++
    this.setStart('busy')
    this.waiting.hidden = true
    this.chain = this.chain
      .then(job)
      .catch(error => {
        console.error(error)
        this.showStatus(error instanceof Error ? error.message : String(error))
      })
      .finally(() => {
        this.pending--
        if (this.pending > 0) return
        this.setStart(this.nightRun > 0 ? 'again' : 'idle')
        this.showWaiting()
      })
  }

  // ---------- the night ----------

  startNight(): void {
    if (this.pending > 0) return
    this.reset()
    this.nightRun++
    const raws = this.api.requests
    this.enqueue(async () => {
      this.screenText('Requests coming in', 'JSON text from phones')
      let valid = 0
      for (const raw of raws) {
        const parsed = attempt(() => this.api.parseRequest(raw))
        if (!parsed.ok) throw new Error(`parseRequest threw: ${parsed.error}`)
        await this.intake(raw, parsed.value)
        if (parsed.value !== null) valid++
      }
      const rejected = raws.length - valid
      if (valid === 0) this.screenText('Nobody on stage', this.isDone(1) ? 'Every request was rejected' : 'Waiting for step 1')
      this.enqueue(async () => {
        this.setLatest(`${rejected} requests rejected`)
        // the count is already on the bin: the screen tells where the mic ended up
        this.screenText("That's the night!", this.dock.current() === null ? 'The mic is on its dock' : 'The mic never came back')
        await pause(200)
      })
    })
  }

  reset(): void {
    this.dock = new StageDock()
    this.queue = []
    this.rejected = 0
    this.binCount.textContent = '0'
    this.people.replaceChildren()
    this.placeMic(DOCKED)
    this.updateDock()
    this.setLatest(null)
    this.showStatus()
  }

  // a request card appears, then joins the queue as a singer or drops into the bin
  async intake(text: string, request: SceneSongRequest | null): Promise<void> {
    const card = this.card
    card.className = 'kn-card'
    card.replaceChildren(el('span', 'kn-card-from', 'From a phone'), el('code', 'kn-json', text))
    card.hidden = false
    await pause(650)
    const ok = request !== null
    card.classList.add(ok ? 'is-ok' : 'is-rejected')
    card.append(el('span', 'kn-verdict', ok ? 'Accepted' : 'Rejected'))
    await pause(550)
    if (request === null) {
      card.classList.add('is-binned')
      await move(450)
      this.rejected++
      this.binCount.textContent = String(this.rejected)
    } else {
      card.classList.add('is-gone')
      const singer = this.addSinger(request)
      this.enqueue(() => this.performTurn(singer))
      await move(300)
    }
    card.hidden = true
  }

  addSinger(request: SceneSongRequest): Singer {
    const node = el('div', 'kn-singer is-arriving')
    node.append(el('span', 'kn-name', request.singer), drawing('span', 'kn-figure', singerDrawing(request.singer, this.singerCount++)))
    node.style.left = `${queueX(this.queue.length)}%`
    this.people.append(node)
    const singer = { request, node }
    this.queue.push(singer)
    requestAnimationFrame(() => requestAnimationFrame(() => node.classList.remove('is-arriving')))
    return singer
  }

  layoutQueue(): void {
    this.queue.forEach((singer, index) => {
      singer.node.style.left = `${queueX(index)}%`
      singer.node.style.zIndex = String(20 - index)
    })
  }

  async walk(node: HTMLElement, x: number, ms: number): Promise<void> {
    node.style.setProperty('--walk', `${reduceMotion() ? 0 : ms}ms`)
    node.style.left = `${x}%`
    await move(ms)
  }

  // one turn on stage: walk up, run your turn() on the dock, replay what the dock saw
  // the night itself is printed by runNight when the page loads: only sign-ups print again
  async performTurn(singer: Singer, log = false): Promise<void> {
    this.queue = this.queue.filter(other => other !== singer)
    this.layoutQueue()
    const { node, request } = singer
    node.style.zIndex = '30'
    this.toast.hidden = true
    this.spot.classList.add('is-on')
    this.screenText(request.singer, `${request.song}, ${request.minutes} min`)
    await this.walk(node, CENTER, 900)

    const line = attempt(() => this.api.turn(this.dock, request))
    const events = this.dock.take()
    if (!line.ok) throw new Error(`turn threw: ${line.error}`)
    const skipped = line.value.startsWith('Skipped')
    let shown = false
    const show = async () => {
      if (shown) return
      shown = true
      node.classList.add(skipped ? 'is-sad' : 'is-singing')
      this.screenLine(line.value, skipped)
      this.setLatest(line.value)
      await pause(skipped ? 1600 : 2000)
      node.classList.remove('is-singing')
    }

    for (const event of events) {
      if (event.kind === 'lend') {
        node.classList.add('has-mic')
        await this.flyMic(inHand(CENTER), 750)
        this.updateDock(event.singer)
        await pause(200)
      } else if (event.kind === 'refused') {
        this.mic.classList.add('is-shaking')
        await move(600)
        this.mic.classList.remove('is-shaking')
      } else if (event.kind === 'sing') {
        await show()
      } else {
        await pause(250)
        node.classList.remove('has-mic')
        this.showToast(skipped ? 'Disposed: back, even after a failed song' : 'Disposed: back on the dock')
        await this.flyMic(DOCKED, 800)
        this.updateDock(null)
        await pause(500)
      }
    }
    await show()
    if (log) console.log(line.value)

    // the mic never came back: it stays on the stage floor
    const holder = this.dock.current()
    if (holder !== null && node.classList.contains('has-mic')) {
      node.classList.remove('has-mic')
      await this.flyMic(DROPPED, 600)
      this.updateDock()
    }

    this.spot.classList.remove('is-on')
    node.classList.add('is-leaving')
    await this.walk(node, CENTER + 10, 600)
    node.remove()
  }

  // ---------- sign-up form (the same steps as mount in your file) ----------

  signUp(): void {
    const form = this.form
    if (form === null) return
    const read = attempt(() => this.api.toSongRequest({
      singer: this.api.field(form, '#singer').value.trim(),
      song: this.api.field(form, '#song').value.trim(),
      minutes: Number(this.api.field(form, '#minutes').value),
    }))
    if (!read.ok) {
      this.signupNote.textContent = `Waiting for step 3: ${read.error}`
      return
    }
    form.reset()
    const request = read.value
    if (request === null) {
      console.log('Request rejected')
      this.signupNote.textContent = 'Rejected: a singer, a song, and minutes above 0.'
      this.setLatest('Request rejected')
      return
    }
    this.signupNote.textContent = `${request.singer} joins the queue.`
    const singer = this.addSinger(request)
    this.enqueue(async () => {
      await this.performTurn(singer, true)
      this.screenText('Thanks!', 'Sign up someone else')
    })
  }

  // ---------- mic, dock, toast ----------

  placeMic(spot: Spot): void {
    this.micAt = spot
    this.mic.style.left = `${spot.x}%`
    this.mic.style.bottom = `${spot.y}%`
    this.mic.style.rotate = `${spot.rotate}deg`
  }

  async flyMic(to: Spot, ms: number): Promise<void> {
    const from = this.micAt
    this.placeMic(to)
    if (reduceMotion() || typeof this.mic.animate !== 'function') return
    const peak = Math.max(from.y, to.y) + 12
    const animation = this.mic.animate(
      [
        { left: `${from.x}%`, bottom: `${from.y}%`, rotate: `${from.rotate}deg` },
        { left: `${(from.x + to.x) / 2}%`, bottom: `${peak}%`, rotate: `${(from.rotate + to.rotate) / 2 - 20}deg`, offset: 0.5 },
        { left: `${to.x}%`, bottom: `${to.y}%`, rotate: `${to.rotate}deg` },
      ],
      { duration: ms, easing: 'cubic-bezier(.45,.05,.35,1)' },
    )
    await animation.finished.catch(() => undefined)
  }

  // holder: who has the mic at this moment of the replay (your code has already finished)
  updateDock(holder: string | null = this.dock.current()): void {
    const state = holder === null ? 'docked' : this.micAt === DROPPED ? 'lost' : 'lent'
    this.root.dataset.mic = state
    this.dockLabel.textContent = holder === null ? 'Mic docked' : state === 'lost' ? `Still with ${holder}` : `With ${holder}`
    this.micTag.textContent = state === 'lost' ? 'not docked' : ''
  }

  showToast(text: string): void {
    window.clearTimeout(this.toastTimer)
    this.toast.textContent = text
    this.toast.hidden = false
    this.toastTimer = window.setTimeout(() => {
      this.toast.hidden = true
    }, 2000)
  }

  // ---------- lyrics screen ----------

  screenText(title: string, sub: string): void {
    this.screen.dataset.mode = 'text'
    this.screen.replaceChildren(el('p', 'kn-screen-title', title), el('p', 'kn-screen-sub', sub))
  }

  screenLine(line: string, skipped: boolean): void {
    this.screen.dataset.mode = skipped ? 'skip' : 'song'
    this.screen.replaceChildren(el('p', 'kn-screen-line', line))
  }
}

// ---------- entry point ----------

export function mountScene(api: KaraokeApi): void {
  // the whole night in the console, as runNight returns it
  const night = attempt(() => api.runNight(new MicDock(), api.requests))
  if (night.ok) night.value.forEach(line => console.log(line))
  else console.warn(`runNight threw: ${night.error}`)

  if (typeof document === 'undefined') return
  const host = document.querySelector('#scene')
  if (!(host instanceof HTMLElement)) return
  try {
    new KaraokeScene(host, api)
  } catch (error) {
    console.error(error)
    const note = el('p', 'kn-alert', `The karaoke stage could not open: ${error instanceof Error ? error.message : String(error)}`)
    host.prepend(note)
  }
}
