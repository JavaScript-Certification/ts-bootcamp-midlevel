// The Mars mission control scene of exercise 5. You do not need to modify this file.
// It runs your functions and shows what they do: beams to each rover, retries, the uplink report.
import * as THREE from 'three'
import { type Network, type Telemetry, RoverOfflineError, SignalLostError, sleep } from '../rover-network'
import './mars.css'

/** A report as reportLine expects it once step 1 is done. */
export type Report = { ok: true; value: Telemetry } | { ok: false; error: string }

/** What pingWithRetry resolves to: the loose starter shape or the union of step 1. */
export type Outcome = { ok: boolean; value?: Telemetry; error?: string }

/** The functions and values of the exercise that the scene runs. */
export type UplinkApi = {
  roster: readonly string[]
  createNetwork: () => Network
  reportLine: (rover: string, outcome: Report) => string
  retryDelays: (base: number, attempts: number) => Iterable<number>
  describeFailure: (err: unknown) => string
  pingWithRetry: (network: Network, rover: string) => Promise<Outcome>
  uplink: (network: Network, rovers: readonly string[]) => Promise<string[]>
}

type Visual = 'idle' | 'pinging' | 'retrying' | 'ok' | 'offline' | 'failed' | 'waiting'
type FailureKind = 'lost' | 'offline' | 'other'

const COLORS: Record<Visual, string> = {
  idle: '#faf9f8',
  pinging: '#358ef1',
  retrying: '#f1dd35',
  ok: '#4be0a6',
  offline: '#ff5d5d',
  failed: '#ff9f43',
  waiting: '#a9bdcf',
}

// where each rover sits on the globe (latitude, longitude from the side facing the camera)
const SITES: Record<string, { lat: number; lon: number }> = {
  curiosity: { lat: -12, lon: -24 },
  perseverance: { lat: 24, lon: 26 },
  spirit: { lat: -34, lon: 22 },
  sojourner: { lat: 40, lon: -30 },
}

const OUTBOUND_MS = 900
const RETURN_MS = 650

/** Shows your work on the page (and prints the report in the console). */
export function mountScene(api: UplinkApi): void {
  api.uplink(api.createNetwork(), api.roster).then(
    lines => lines.forEach(line => console.log(line)),
    (err: unknown) => console.error('The uplink failed:', err),
  )
  if (typeof document === 'undefined') return
  const host = document.querySelector<HTMLElement>('#scene')
  if (!host) return
  try {
    buildScene(host, api)
  }
  catch (err) {
    console.error(err)
    host.replaceChildren(el('p', 'mars-crash', `The scene could not start: ${errorText(err)}`))
  }
}

// ---------- small helpers ----------

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

const ICONS = {
  dish: '<path d="M4 10a7.31 7.31 0 0 0 10 10Z"/><path d="m9 15 3-3"/><path d="M17 13a6 6 0 0 0-6-6"/><path d="M21 13A10 10 0 0 0 11 3"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  wait: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  alert: '<path d="M12 3 2 21h20Z"/><path d="M12 10v4"/><path d="M12 17.5v.01"/>',
} as const

function svg(name: keyof typeof ICONS, className: string): SVGSVGElement {
  const node = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  node.setAttribute('viewBox', '0 0 24 24')
  node.setAttribute('fill', 'none')
  node.setAttribute('stroke', 'currentColor')
  node.setAttribute('stroke-width', '2')
  node.setAttribute('stroke-linecap', 'round')
  node.setAttribute('stroke-linejoin', 'round')
  node.setAttribute('aria-hidden', 'true')
  node.setAttribute('class', className)
  node.innerHTML = ICONS[name]
  return node
}

function errorText(err: unknown): string {
  return err instanceof Error ? `${err.name}: ${err.message}` : String(err)
}

/** Reads at most `limit` values: a broken generator must not freeze the page. */
function firstValues(source: Iterable<number>, limit: number): number[] {
  const values: number[] = []
  for (const value of source) {
    values.push(value)
    if (values.length >= limit) break
  }
  return values
}

function toReport(outcome: Outcome): Report {
  if (outcome.ok && outcome.value) return { ok: true, value: outcome.value }
  if (outcome.ok) return { ok: false, error: 'ok without a value' }
  return { ok: false, error: outcome.error ?? 'no error message' }
}

// ---------- the steps: which ones are done ----------

type StepState = { done: boolean; pending?: boolean; detail: string }

function checkStep1(api: UplinkApi): StepState {
  try {
    const line = api.reportLine('curiosity', { ok: true, value: { rover: 'curiosity', battery: 87, site: 'Gale Crater' } })
    const failure = api.reportLine('spirit', { ok: false, error: 'offline since sol 2210' })
    const done = line === 'curiosity: 87% battery at Gale Crater' && failure === 'spirit: offline since sol 2210'
    return { done, detail: done ? '' : `reportLine answers “${line}”` }
  }
  catch (err) {
    return { done: false, detail: `reportLine threw ${errorText(err)}` }
  }
}

function checkStep2(api: UplinkApi): StepState {
  try {
    const lost = api.describeFailure(new SignalLostError('perseverance'))
    const offline = api.describeFailure(new RoverOfflineError('spirit', 'sol 2210'))
    const plain = api.describeFailure(new Error('antenna jammed'))
    const raw = api.describeFailure('dust storm')
    const done = lost === 'signal lost' && offline === 'offline since sol 2210'
      && plain === 'antenna jammed' && raw === 'unknown failure: dust storm'
    return { done, detail: done ? '' : `describeFailure of a lost signal is “${lost}”` }
  }
  catch (err) {
    return { done: false, detail: `describeFailure threw ${errorText(err)}` }
  }
}

type RoverRun = { pings: number; outcome?: Report; rejected?: unknown }

function checkStep3(runs: Map<string, RoverRun>): StepState {
  const all = [...runs.entries()]
  const rejected = all.find(([, run]) => run.rejected !== undefined)
  if (rejected) return { done: false, detail: `pingWithRetry rejected for ${rejected[0]}: it must never reject` }
  if (all.every(([, run]) => run.pings === 0)) return { done: false, detail: 'pingWithRetry has not pinged any rover yet' }
  const perseverance = runs.get('perseverance')
  if (perseverance && !perseverance.outcome?.ok) return { done: false, detail: 'perseverance lost its signal: pingWithRetry should retry it' }
  const spirit = runs.get('spirit')
  if (spirit && spirit.pings > 1) return { done: false, detail: 'spirit is offline for good: pingWithRetry should not retry it' }
  return { done: true, detail: '' }
}

// ---------- the scene ----------

type Label = { root: HTMLElement; status: HTMLElement; word: string; full?: string }

/** The one short word a card shows while its rover is not the latest to answer. */
const WORDS: Record<Visual, string> = {
  idle: 'standing by',
  pinging: 'ping…',
  retrying: 'no answer',
  ok: 'ok',
  offline: 'offline',
  failed: 'failed',
  waiting: 'not pinged',
}

const HINTS = [
  'reportLine still says “no report yet”. Make Result a union on ok, then narrow it.',
  'describeFailure says “unknown failure” for everything. Narrow err with instanceof.',
] as const

function buildScene(host: HTMLElement, api: UplinkApi): void {
  const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  const reduced = () => reducedQuery.matches

  // layout: the globe with its button, then a one-line caption
  const root = el('div', 'mars-scene')
  const stage = el('div', 'mars-stage')
  const canvas = el('canvas', 'mars-canvas')
  canvas.setAttribute('aria-hidden', 'true')
  const overlay = el('div', 'mars-overlay')
  const waiting = el('div', 'mars-waiting')
  waiting.setAttribute('role', 'status')
  const button = el('button', 'mars-ping')
  button.type = 'button'
  button.append(svg('dish', 'mars-icon'), el('span', '', 'Ping all rovers'))
  stage.append(canvas, overlay, waiting, button)

  const caption = el('div', 'mars-caption')
  caption.setAttribute('aria-live', 'polite')
  const latest = el('p', 'mars-caption-latest')
  const status = el('p', 'mars-caption-status')
  caption.append(latest, status)

  root.append(stage, caption)
  host.replaceChildren(root)

  // one short card per rover: its name and one status word.
  // Only the rover that answered last shows its full report line.
  const labels = new Map<string, Label>()
  for (const rover of api.roster) {
    const label = el('div', 'mars-label')
    const head = el('div', 'mars-label-head')
    const text = el('span', 'mars-label-text', WORDS.idle)
    head.append(el('span', 'mars-dot'), el('span', 'mars-label-name', rover), text)
    label.append(head)
    overlay.append(label)
    labels.set(rover, { root: label, status: text, word: WORDS.idle })
  }
  const earthLabel = el('div', 'mars-earth', 'Earth')
  overlay.append(earthLabel)

  let globe: Globe
  try {
    globe = createGlobe(stage, canvas, api.roster, labels, earthLabel, reduced)
  }
  catch (err) {
    console.error(err)
    stage.classList.add('mars-stage--flat')
    globe = { setVisual: () => {}, beam: () => {}, dispose: () => {} }
  }

  let latestRover: string | undefined

  function paint(rover: string) {
    const label = labels.get(rover)
    if (!label) return
    const isLatest = rover === latestRover && label.full !== undefined
    label.root.classList.toggle('is-latest', isLatest)
    label.status.textContent = isLatest ? label.full ?? '' : label.word
  }

  function setRover(rover: string, visual: Visual, word: string = WORDS[visual]) {
    globe.setVisual(rover, visual)
    const label = labels.get(rover)
    if (!label) return
    label.root.dataset.visual = visual
    label.word = word
    label.full = undefined
    paint(rover)
  }

  /** The rover that just answered shows its full report line; the previous one goes back to its word. */
  function setAnswer(rover: string, visual: Visual, full: string) {
    setRover(rover, visual)
    const label = labels.get(rover)
    if (label) label.full = full
    const previous = latestRover
    latestRover = rover
    if (previous !== undefined && previous !== rover) paint(previous)
    paint(rover)
  }

  function setLatest(text: string) {
    latest.replaceChildren(svg('dish', 'mars-icon'), el('code', '', `Latest: ${text}`))
  }

  // steps: the first one not done yet shows in a card over Mars and in the caption
  const steps: StepState[] = [checkStep1(api), checkStep2(api), { done: false, pending: true, detail: '' }]
  let problem: string | undefined

  function renderStatus() {
    const next = steps.findIndex(step => !step.done && !step.pending)
    const hint = next === 2 ? `${steps[2]?.detail ?? ''}.` : HINTS[next] ?? ''
    waiting.hidden = next === -1
    if (next !== -1) {
      waiting.replaceChildren(svg('wait', 'mars-icon mars-waiting-icon'), el('strong', '', `Waiting for step ${next + 1}`), el('span', '', hint))
    }
    status.className = 'mars-caption-status'
    if (problem) {
      status.classList.add('is-error')
      status.replaceChildren(svg('alert', 'mars-icon'), el('span', '', problem))
    }
    else if (next !== -1) {
      status.classList.add('is-waiting')
      status.replaceChildren(svg('wait', 'mars-icon'), el('strong', '', `Waiting for step ${next + 1}.`), ` ${hint}`)
    }
    else if (steps[2]?.pending) {
      status.replaceChildren(svg('dish', 'mars-icon'), 'Pinging the rovers…')
    }
    else {
      status.classList.add('is-done')
      status.replaceChildren(svg('check', 'mars-icon'), 'All steps done: every rover answers with a Result, nothing rejects.')
    }
  }
  setLatest('no transmission yet')
  renderStatus()

  // the delays of the given retryDelays, read once for the retry words on the cards
  let delays: number[] = []
  try {
    delays = firstValues(api.retryDelays(5, 3), 10)
  }
  catch {
    delays = []
  }

  const failures = new Map<string, FailureKind>()
  let running = false

  // a network that shows every ping on the globe, at a pace a human can follow
  function watchedNetwork(runs: Map<string, RoverRun>): Network {
    const real = api.createNetwork()
    return {
      async ping(rover) {
        const index = Math.max(0, api.roster.indexOf(rover))
        const run = runs.get(rover) ?? { pings: 0 }
        runs.set(rover, run)
        run.pings++
        const attempt = run.pings
        const outbound = OUTBOUND_MS + index * 160
        setRover(rover, 'pinging', attempt === 1 ? 'ping…' : `ping #${attempt}…`)
        globe.beam(rover, 'out', 'pinging', outbound)
        await sleep(outbound)
        try {
          const telemetry = await real.ping(rover)
          globe.beam(rover, 'back', 'ok', RETURN_MS)
          await sleep(RETURN_MS)
          return telemetry
        }
        catch (err) {
          const kind: FailureKind = err instanceof SignalLostError ? 'lost' : err instanceof RoverOfflineError ? 'offline' : 'other'
          failures.set(rover, kind)
          if (kind === 'lost') {
            const delay = delays[attempt - 1]
            // the word on the card is the next delay of your retryDelays generator
            const next = delay === undefined ? 'retrying' : attempt >= delays.length ? 'no retry left' : `retry in ${delay} ms`
            setRover(rover, 'retrying', next)
            setLatest(`${rover}: no answer, ${next}`)
          }
          else {
            globe.beam(rover, 'back', kind === 'offline' ? 'offline' : 'failed', RETURN_MS)
          }
          await sleep(RETURN_MS)
          throw err
        }
      },
      attempts: rover => real.attempts(rover),
    }
  }

  async function run() {
    if (running) return
    running = true
    button.disabled = true
    button.setAttribute('aria-busy', 'true')
    failures.clear()
    problem = undefined
    steps[2] = { done: false, pending: true, detail: '' }
    renderStatus()
    latestRover = undefined
    for (const rover of api.roster) setRover(rover, 'idle')

    const runs = new Map<string, RoverRun>(api.roster.map(rover => [rover, { pings: 0 }]))
    const network = watchedNetwork(runs)
    const problems: string[] = []

    await Promise.all(api.roster.map(async (rover) => {
      const roverRun = runs.get(rover) ?? { pings: 0 }
      let report: Report
      try {
        report = toReport(await api.pingWithRetry(network, rover))
        roverRun.outcome = report
      }
      catch (err) {
        roverRun.rejected = err
        setRover(rover, 'offline', 'rejected')
        problems.push(`pingWithRetry rejected for ${rover}: ${errorText(err)}`)
        return
      }

      let line: string
      try {
        line = api.reportLine(rover, report)
      }
      catch (err) {
        line = `${rover}: …`
        problems.push(`reportLine threw ${errorText(err)}`)
      }

      // the latest card shows your report line, without the rover name already in its title
      const text = line.startsWith(`${rover}: `) ? line.slice(rover.length + 2) : line
      const visual: Visual = roverRun.pings === 0 ? 'waiting' : report.ok ? 'ok' : failures.get(rover) === 'offline' ? 'offline' : 'failed'
      setAnswer(rover, visual, text)
      setLatest(line)
      console.log(line)
    }))

    steps[2] = checkStep3(runs)
    problem = problems[0] === undefined ? undefined : `Your code threw: ${problems[0]}`
    renderStatus()
    running = false
    button.disabled = false
    button.removeAttribute('aria-busy')
  }

  function start() {
    run().catch((err: unknown) => {
      console.error(err)
      problem = `The uplink stopped: ${errorText(err)}`
      renderStatus()
      running = false
      button.disabled = false
      button.removeAttribute('aria-busy')
    })
  }

  button.addEventListener('click', start)
  // the first uplink starts by itself, like mission control on a schedule
  const first = window.setTimeout(start, 700)

  window.addEventListener('pagehide', () => {
    window.clearTimeout(first)
    globe.dispose()
  }, { once: true })
}

// ---------- the 3D globe ----------

type Globe = {
  setVisual(rover: string, visual: Visual): void
  beam(rover: string, direction: 'out' | 'back', visual: Visual, duration: number): void
  dispose(): void
}

type Marker = {
  group: THREE.Group
  head: THREE.MeshBasicMaterial
  ring: THREE.MeshBasicMaterial
  pulse: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>
  visual: Visual
  phase: number
}

type Beam = {
  rover: string
  direction: 'out' | 'back'
  start: number
  duration: number
  guide: THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial>
  sprites: THREE.Sprite[]
}

/** A small deterministic random generator, so Mars looks the same at every visit. */
function seeded(seed: number): () => number {
  let state = seed
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function context2d(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2D canvas unavailable')
  return [canvas, ctx]
}

/** Draws a shape three times so it wraps around the globe seamlessly. */
function wrapped(width: number, x: number, draw: (x: number) => void) {
  draw(x)
  draw(x - width)
  draw(x + width)
}

function marsTexture(): HTMLCanvasElement {
  const W = 1024
  const H = 512
  const [canvas, g] = context2d(W, H)
  const rand = seeded(2021)

  const base = g.createLinearGradient(0, 0, 0, H)
  base.addColorStop(0, '#d8a487')
  base.addColorStop(0.1, '#b9603a')
  base.addColorStop(0.45, '#c4653b')
  base.addColorStop(0.7, '#b4522f')
  base.addColorStop(0.9, '#a9502f')
  base.addColorStop(1, '#dcb09a')
  g.fillStyle = base
  g.fillRect(0, 0, W, H)

  // broad dark and light regions
  const blot = (count: number, color: (a: number) => string, minR: number, maxR: number) => {
    for (let i = 0; i < count; i++) {
      const x = rand() * W
      const y = 60 + rand() * (H - 120)
      const rx = minR + rand() * (maxR - minR)
      const ry = rx * (0.35 + rand() * 0.5)
      const rot = rand() * Math.PI
      g.fillStyle = color(0.04 + rand() * 0.1)
      wrapped(W, x, (cx) => {
        g.beginPath()
        g.ellipse(cx, y, rx, ry, rot, 0, Math.PI * 2)
        g.fill()
      })
    }
  }
  blot(90, a => `rgba(74, 26, 14, ${a})`, 18, 120)
  blot(60, a => `rgba(236, 160, 112, ${a})`, 14, 90)

  // a long canyon
  g.strokeStyle = 'rgba(70, 22, 12, 0.35)'
  g.lineWidth = 5
  g.lineCap = 'round'
  g.beginPath()
  g.moveTo(380, 270)
  for (let x = 380; x <= 640; x += 20) g.lineTo(x, 270 + Math.sin(x / 40) * 6 + (x - 380) * 0.08)
  g.stroke()

  // fine grain
  for (let i = 0; i < 9000; i++) {
    const light = rand() > 0.5
    g.fillStyle = light ? `rgba(255, 210, 170, ${rand() * 0.08})` : `rgba(60, 20, 10, ${rand() * 0.1})`
    g.fillRect(rand() * W, rand() * H, 1 + rand() * 2, 1 + rand() * 2)
  }

  // craters: dark floor, lit rim towards the sun, shadowed rim on the other side
  for (let i = 0; i < 70; i++) {
    const x = rand() * W
    const y = 70 + rand() * (H - 140)
    const r = 3 + rand() ** 2 * 24
    wrapped(W, x, (cx) => {
      const floor = g.createRadialGradient(cx, y, 0, cx, y, r)
      floor.addColorStop(0, 'rgba(80, 30, 16, 0.45)')
      floor.addColorStop(0.8, 'rgba(110, 42, 22, 0.3)')
      floor.addColorStop(1, 'rgba(110, 42, 22, 0)')
      g.fillStyle = floor
      g.beginPath()
      g.arc(cx, y, r, 0, Math.PI * 2)
      g.fill()
      g.lineWidth = Math.max(1, r / 7)
      g.strokeStyle = 'rgba(255, 205, 165, 0.4)'
      g.beginPath()
      g.arc(cx, y, r, Math.PI * 0.9, Math.PI * 1.8)
      g.stroke()
      g.strokeStyle = 'rgba(55, 18, 8, 0.35)'
      g.beginPath()
      g.arc(cx, y, r, Math.PI * -0.1, Math.PI * 0.8)
      g.stroke()
    })
  }

  // polar caps
  const north = g.createLinearGradient(0, 0, 0, 46)
  north.addColorStop(0, 'rgba(250, 244, 238, 0.95)')
  north.addColorStop(1, 'rgba(250, 244, 238, 0)')
  g.fillStyle = north
  g.fillRect(0, 0, W, 46)
  const south = g.createLinearGradient(0, H - 34, 0, H)
  south.addColorStop(0, 'rgba(250, 244, 238, 0)')
  south.addColorStop(1, 'rgba(250, 244, 238, 0.85)')
  g.fillStyle = south
  g.fillRect(0, H - 34, W, 34)
  return canvas
}

function glowTexture(): HTMLCanvasElement {
  const [canvas, g] = context2d(64, 64)
  const glow = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  glow.addColorStop(0, 'rgba(255, 255, 255, 1)')
  glow.addColorStop(0.25, 'rgba(255, 255, 255, 0.75)')
  glow.addColorStop(1, 'rgba(255, 255, 255, 0)')
  g.fillStyle = glow
  g.fillRect(0, 0, 64, 64)
  return canvas
}

function surfacePoint(lat: number, lon: number, radius: number): THREE.Vector3 {
  const la = THREE.MathUtils.degToRad(lat)
  const lo = THREE.MathUtils.degToRad(lon)
  return new THREE.Vector3(radius * Math.cos(la) * Math.sin(lo), radius * Math.sin(la), radius * Math.cos(la) * Math.cos(lo))
}

function createGlobe(
  stage: HTMLElement,
  canvas: HTMLCanvasElement,
  rovers: readonly string[],
  labels: Map<string, Label>,
  earthLabel: HTMLElement,
  reduced: () => boolean,
): Globe {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 200)
  const lookAt = new THREE.Vector3(-0.1, 0, 0)

  scene.add(new THREE.AmbientLight('#8aa6c8', 0.6))
  const sun = new THREE.DirectionalLight('#fff1e0', 2.9)
  sun.position.set(-6, 3, 6)
  scene.add(sun)

  // Mars: tilted on its axis, rocking slowly left and right
  const MARS_RADIUS = 1.7
  const marsCenter = new THREE.Vector3(0.45, 0.05, 0)
  const tilt = new THREE.Group()
  tilt.position.copy(marsCenter)
  tilt.rotation.z = -0.32
  tilt.rotation.x = 0.18
  const planet = new THREE.Group()
  tilt.add(planet)
  scene.add(tilt)

  const marsMap = new THREE.CanvasTexture(marsTexture())
  marsMap.colorSpace = THREE.SRGBColorSpace
  marsMap.anisotropy = renderer.capabilities.getMaxAnisotropy()
  const mars = new THREE.Mesh(
    new THREE.SphereGeometry(MARS_RADIUS, 96, 64),
    new THREE.MeshStandardMaterial({ map: marsMap, bumpMap: marsMap, bumpScale: 2.2, roughness: 0.95, metalness: 0 }),
  )
  mars.rotation.y = -Math.PI / 2
  planet.add(mars)
  // where the beams leave from: a small dot for Earth, off to the left
  const earthPoint = new THREE.Vector3(-3.1, -1.35, 0.6)
  const earth = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 12), new THREE.MeshBasicMaterial({ color: '#a9bdcf' }))
  earth.position.copy(earthPoint)
  scene.add(earth)
  const antennaTip = earthPoint

  // rover markers
  const glowMap = new THREE.CanvasTexture(glowTexture())
  const markers = new Map<string, Marker>()
  const headGeometry = new THREE.SphereGeometry(0.05, 16, 12)
  const ringGeometry = new THREE.RingGeometry(0.075, 0.098, 40)
  rovers.forEach((rover, index) => {
    const site = SITES[rover] ?? { lat: -20 + index * 15, lon: -30 + index * 20 }
    const normal = surfacePoint(site.lat, site.lon, 1)
    const group = new THREE.Group()
    group.position.copy(normal).multiplyScalar(MARS_RADIUS)
    group.lookAt(normal.clone().multiplyScalar(10))
    const head = new THREE.MeshBasicMaterial({ color: COLORS.idle })
    const headMesh = new THREE.Mesh(headGeometry, head)
    headMesh.position.z = 0.045
    const ring = new THREE.MeshBasicMaterial({ color: COLORS.idle, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false })
    const ringMesh = new THREE.Mesh(ringGeometry, ring)
    ringMesh.position.z = 0.006
    const pulse = new THREE.Mesh(ringGeometry, new THREE.MeshBasicMaterial({ color: COLORS.pinging, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }))
    pulse.position.z = 0.008
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowMap, color: COLORS.idle, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending }))
    halo.scale.setScalar(0.32)
    halo.position.z = 0.05
    group.add(headMesh, ringMesh, pulse, halo)
    planet.add(group)
    markers.set(rover, { group, head, ring, pulse, visual: 'idle', phase: index * 0.27 })
  })

  // beams: a faint path and a glowing packet with a short tail
  const beams: Beam[] = []
  const TAIL = 7
  const SAMPLES = 48

  function removeBeam(beam: Beam) {
    scene.remove(beam.guide, ...beam.sprites)
    beam.guide.geometry.dispose()
    beam.guide.material.dispose()
    for (const sprite of beam.sprites) sprite.material.dispose()
  }

  function markerWorld(rover: string, target: THREE.Vector3): THREE.Vector3 {
    const marker = markers.get(rover)
    if (!marker) return target.copy(marsCenter)
    return marker.group.getWorldPosition(target)
  }

  // sizing
  function resize() {
    const width = Math.max(1, stage.clientWidth)
    const height = Math.max(1, stage.clientHeight)
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    const distance = 8.3 * Math.max(1, 1.45 / camera.aspect)
    camera.position.set(0, 0.35, distance)
    camera.lookAt(lookAt)
    camera.updateProjectionMatrix()
  }
  const observer = new ResizeObserver(resize)
  observer.observe(stage)
  resize()

  // the render loop
  const from = new THREE.Vector3()
  const to = new THREE.Vector3()
  const control = new THREE.Vector3()
  const curve = new THREE.QuadraticBezierCurve3(from, control, to)
  const projected = new THREE.Vector3()
  const toCamera = new THREE.Vector3()
  const outward = new THREE.Vector3()

  /** Moves an HTML label next to a point of the scene, on the side where it fits. */
  function place(object: THREE.Vector3, element: HTMLElement, facing: number, prefer?: 'left' | 'right') {
    projected.copy(object).project(camera)
    const width = stage.clientWidth
    const height = stage.clientHeight
    const x = (projected.x + 1) / 2 * width
    let y = (1 - projected.y) / 2 * height
    if (prefer) {
      // stay on the preferred side, away from the globe: a narrow stage wraps the text
      // instead of flipping the card across Mars. Flip only when there is no room at all.
      const roomOn = (side: 'left' | 'right') => (side === 'right' ? width - x : x) - 8 - 18
      let side = prefer
      if (roomOn(side) < 150) side = side === 'right' ? 'left' : 'right'
      element.dataset.side = side
      element.style.maxWidth = `${Math.max(120, Math.min(344, roomOn(side))).toFixed(0)}px`
      const half = element.offsetHeight / 2
      y = Math.min(Math.max(y, half + 8), height - half - 8)
    }
    element.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`
    element.classList.toggle('is-hidden', facing < 0.12)
  }

  let frame = 0
  let last = performance.now()
  let swing = 0

  function render(now: number) {
    const delta = Math.min(0.1, (now - last) / 1000)
    last = now
    const still = reduced()
    if (!still) swing += delta
    planet.rotation.y = still ? 0 : Math.sin(swing * 0.11) * 0.38

    // markers
    for (const [rover, marker] of markers) {
      const active = marker.visual === 'pinging' || marker.visual === 'retrying'
      const pulseMaterial = marker.pulse.material
      if (active && !still) {
        const t = (now / 1100 + marker.phase) % 1
        marker.pulse.scale.setScalar(1 + t * 2.4)
        pulseMaterial.opacity = (1 - t) * 0.85
      }
      else {
        marker.pulse.scale.setScalar(1.6)
        pulseMaterial.opacity = active ? 0.5 : 0
      }
      const label = labels.get(rover)
      if (label) {
        const world = marker.group.getWorldPosition(projected.clone())
        outward.copy(world).sub(marsCenter).normalize()
        toCamera.copy(camera.position).sub(world).normalize()
        const facing = outward.dot(toCamera)
        // each card keeps the side of its rover's site, so it never jumps across the globe as Mars rocks
        const lon = SITES[rover]?.lon
        place(world, label.root, facing, (lon === undefined ? world.x < marsCenter.x + 0.1 : lon < 0) ? 'left' : 'right')
      }
    }
    place(earthPoint, earthLabel, 1)

    // beams
    for (let i = beams.length - 1; i >= 0; i--) {
      const beam = beams[i]
      if (!beam) continue
      const age = (now - beam.start) / beam.duration
      if (age > 1.35) {
        removeBeam(beam)
        beams.splice(i, 1)
        continue
      }
      const target = markerWorld(beam.rover, to.clone())
      const start = beam.direction === 'out' ? antennaTip : target
      const end = beam.direction === 'out' ? target : antennaTip
      from.copy(start)
      to.copy(end)
      control.copy(from).add(to).multiplyScalar(0.5).add(new THREE.Vector3(0, 0.9, 0.7))
      const positions = beam.guide.geometry.getAttribute('position')
      for (let s = 0; s < SAMPLES; s++) {
        const point = curve.getPoint(s / (SAMPLES - 1))
        positions.setXYZ(s, point.x, point.y, point.z)
      }
      positions.needsUpdate = true
      const fade = age <= 1 ? 1 : Math.max(0, 1 - (age - 1) / 0.35)
      beam.guide.material.opacity = (still ? 0.7 : 0.28) * fade
      const progress = Math.min(1, age)
      const eased = progress < 0.5 ? 2 * progress * progress : 1 - (-2 * progress + 2) ** 2 / 2
      beam.sprites.forEach((sprite, k) => {
        const t = eased - k * 0.035
        sprite.visible = !still && t >= 0 && age <= 1.05
        if (!sprite.visible) return
        sprite.position.copy(curve.getPoint(Math.min(1, t)))
        sprite.material.opacity = (1 - k / TAIL) * fade
      })
    }

    renderer.render(scene, camera)
  }

  function loop(now: number) {
    frame = requestAnimationFrame(loop)
    render(now)
  }

  function start() {
    if (frame !== 0) return
    last = performance.now()
    frame = requestAnimationFrame(loop)
  }

  function stop() {
    cancelAnimationFrame(frame)
    frame = 0
  }

  const onVisibility = () => (document.hidden ? stop() : start())
  document.addEventListener('visibilitychange', onVisibility)
  if (!document.hidden) start()

  return {
    setVisual(rover, visual) {
      const marker = markers.get(rover)
      if (!marker) return
      marker.visual = visual
      marker.head.color.set(COLORS[visual])
      marker.ring.color.set(COLORS[visual])
      marker.pulse.material.color.set(COLORS[visual])
      const halo = marker.group.children.find((child): child is THREE.Sprite => child instanceof THREE.Sprite)
      halo?.material.color.set(COLORS[visual])
    },

    beam(rover, direction, visual, duration) {
      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(SAMPLES * 3), 3))
      const guide = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: COLORS[visual], transparent: true, opacity: 0, depthWrite: false }))
      const sprites = Array.from({ length: TAIL }, (_, k) => {
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowMap, color: COLORS[visual], transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }))
        sprite.scale.setScalar(0.26 * (1 - k / (TAIL + 2)))
        sprite.visible = false
        return sprite
      })
      scene.add(guide, ...sprites)
      beams.push({ rover, direction, start: performance.now(), duration, guide, sprites })
    },

    dispose() {
      stop()
      observer.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      for (const beam of beams.splice(0)) removeBeam(beam)
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points || object instanceof THREE.Line || object instanceof THREE.Sprite) {
          object.geometry.dispose()
          const materials: THREE.Material[] = Array.isArray(object.material) ? object.material : [object.material]
          for (const material of materials) material.dispose()
        }
      })
      marsMap.dispose()
      glowMap.dispose()
      renderer.dispose()
    },
  }
}
