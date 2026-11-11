// Exercise 7 scene: a small 3D rooftop cinema. You do not need to modify this file.
// The projector asks your filmFor for each reel: the screen shows the film it got back,
// or TV static when the reel is missing. The tickets show the labels from your board.
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { print } from '../print'
import './cinema.css'

// Step 1 only changes an import, so the scene reads your file to see whether it is done
const sources = import.meta.glob<string>('../../7-*.ts', { query: '?raw', import: 'default', eager: true })

function importsScreening(): boolean {
  if (typeof location === 'undefined') return true
  const raw = sources[location.pathname.includes('7-end') ? '../../7-end.ts' : '../../7-begin.ts']
  if (raw === undefined) return true
  const code = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
  const local = /\btype\s+Screening\s*=/.test(code)
  const imported = /import\s+(type\s+)?\{[^}]*\bScreening\b[^}]*\}\s*from\s*['"][^'"]*rooftop-programme['"]/.test(code)
  return imported && !local
}

// ---------- what the scene receives from your exercise file ----------

export type CinemaFilm = { title: string; year: number; minutes: number }
export type CinemaScreening = { time: string; reel: string }

/** The functions exported by src/7-begin.ts (or src/7-end.ts), and tonight's programme */
export type CinemaApi = {
  filmFor: (reel: string) => CinemaFilm | null
  describe: (screening: CinemaScreening) => string
  board: (programme: readonly CinemaScreening[]) => string[]
  programme: readonly CinemaScreening[]
}

// ---------- running your functions without letting them break the page ----------

type Attempt<T> = { ok: true; value: T } | { ok: false; error: unknown }

function attempt<T>(run: () => T): Attempt<T> {
  try {
    return { ok: true, value: run() }
  } catch (error) {
    return { ok: false, error }
  }
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

type Ticket = { screening: CinemaScreening; label?: string; text: string; problem?: string }
type StepCheck = { n: number; done: boolean; hint: string }

type Analysis = {
  tickets: Ticket[]
  steps: StepCheck[]
  lines: string[]
  thrown: unknown[]
  filmsWork: boolean
}

function analyse(api: CinemaApi): Analysis {
  const thrown: unknown[] = []
  const fail = (error: unknown) => {
    if (!thrown.some(known => messageOf(known) === messageOf(error))) thrown.push(error)
    return messageOf(error)
  }

  const board = attempt(() => api.board(api.programme))
  const lines = board.ok ? board.value : []
  if (!board.ok) fail(board.error)

  const filmsWork = api.programme.some(screening => {
    const film = attempt(() => api.filmFor(screening.reel))
    if (!film.ok) fail(film.error)
    return film.ok && film.value !== null
  })

  const tickets = api.programme.map((screening, i): Ticket => {
    const line = lines[i]
    const cut = line?.indexOf(': ') ?? -1
    const label = line !== undefined && cut > 0 ? line.slice(0, cut) : undefined
    const text = attempt(() => api.describe(screening))
    if (!text.ok) return { screening, label, text: screening.time, problem: fail(text.error) }
    return { screening, label, text: text.value }
  })

  const empty = attempt(() => api.board([]))
  const steps: StepCheck[] = [
    { n: 1, done: importsScreening(), hint: 'Screening is still a local copy. Delete it, and import the type from rooftop-programme.' },
    { n: 2, done: filmsWork, hint: 'filmFor finds no reel yet. Describe ReelBox, then return what its film method finds.' },
    {
      n: 3,
      done: lines.length > 0 && empty.ok && empty.value.length > 0,
      hint: lines.length === 0 ? "The board is empty. Start with 'Now showing: ', then 'Later: '." : "An empty programme should give 'Nothing on tonight'.",
    },
  ]
  return { tickets, steps, lines, thrown, filmsWork }
}

// ---------- small DOM helpers ----------

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

const svgPaths = {
  play: '<path d="M7 5v14l11-7z" />',
  film: '<rect x="3" y="5" width="18" height="14" rx="2" /><path d="M7 5v14M17 5v14M3 9.5h4M3 14.5h4M17 9.5h4M17 14.5h4" />',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5" />',
  wait: '<circle cx="12" cy="12" r="8" /><path d="M12 8v4.5l3 2" />',
  alert: '<path d="M12 4 2.8 20h18.4z" /><path d="M12 10v4.5" /><path d="M12 17.5v.01" />',
}

function svg(name: keyof typeof svgPaths, className = 'cin-icon'): SVGSVGElement {
  const node = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  node.setAttribute('viewBox', '0 0 24 24')
  node.setAttribute('aria-hidden', 'true')
  node.setAttribute('class', className)
  node.innerHTML = svgPaths[name]
  return node
}

// ---------- colours ----------

const palette = {
  night: '#220a12',
  deck: '#3a1a22',
  frame: '#140509',
  red: '#b3262f',
  redDark: '#7d1820',
  cream: '#fff4dc',
  yellow: '#f1dd35',
  muted: '#c9b3a8',
  steel: '#6f6470',
}

// ---------- what the screen shows ----------

type ScreenState =
  | { kind: 'idle' }
  | { kind: 'film'; film: CinemaFilm }
  | { kind: 'static'; title: string; detail: string }

const SCREEN_W = 1024
const SCREEN_H = 512

function drawScreen(ctx: CanvasRenderingContext2D, state: ScreenState, noise: HTMLCanvasElement | null) {
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  if (state.kind === 'film') {
    const gradient = ctx.createRadialGradient(512, 230, 40, 512, 256, 620)
    gradient.addColorStop(0, '#4a2c1c')
    gradient.addColorStop(1, '#170909')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H)
    ctx.fillStyle = palette.cream
    let size = 120
    ctx.font = `700 ${size}px Montserrat, sans-serif`
    while (ctx.measureText(state.film.title).width > 880 && size > 40) {
      size -= 6
      ctx.font = `700 ${size}px Montserrat, sans-serif`
    }
    ctx.shadowColor = 'rgba(255, 196, 107, 0.5)'
    ctx.shadowBlur = 30
    ctx.fillText(state.film.title, 512, 215)
    ctx.shadowBlur = 0
    ctx.strokeStyle = palette.yellow
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(392, 303)
    ctx.lineTo(492, 303)
    ctx.moveTo(532, 303)
    ctx.lineTo(632, 303)
    ctx.stroke()
    ctx.fillStyle = palette.yellow
    ctx.beginPath()
    ctx.moveTo(512, 293)
    ctx.lineTo(522, 303)
    ctx.lineTo(512, 313)
    ctx.lineTo(502, 303)
    ctx.fill()
    ctx.font = '600 34px "Open Sans", sans-serif'
    ctx.fillStyle = '#ead8b8'
    ctx.fillText(`${state.film.year}  ·  ${state.film.minutes} min`, 512, 365)
    return
  }
  if (state.kind === 'static') {
    if (noise) {
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(noise, 0, 0, SCREEN_W, SCREEN_H)
    }
    ctx.fillStyle = 'rgba(20, 5, 9, 0.88)'
    ctx.beginPath()
    ctx.roundRect(172, 176, 680, 160, 18)
    ctx.fill()
    ctx.fillStyle = palette.yellow
    ctx.font = '700 46px "JetBrains Mono", monospace'
    ctx.fillText(state.title, 512, 232)
    ctx.fillStyle = palette.cream
    ctx.font = '600 30px "Open Sans", sans-serif'
    ctx.fillText(state.detail, 512, 290)
    return
  }
  ctx.fillStyle = '#1c0b10'
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H)
  ctx.fillStyle = palette.muted
  ctx.font = '600 38px "Open Sans", sans-serif'
  ctx.fillText('The projector is warming up', 512, 256)
}

function fillNoise(noise: HTMLCanvasElement) {
  const ctx = noise.getContext('2d')
  if (!ctx) return
  const image = ctx.createImageData(noise.width, noise.height)
  for (let i = 0; i < image.data.length; i += 4) {
    const v = Math.random() * 160 + 20
    image.data[i] = v
    image.data[i + 1] = v
    image.data[i + 2] = v
    image.data[i + 3] = 255
  }
  ctx.putImageData(image, 0, 0)
}

// ---------- the scene ----------

type Label = { node: HTMLElement; anchor: THREE.Vector3 }

export function mountScene(api: CinemaApi): void {
  const first = analyse(api)
  first.lines.forEach(print)

  if (typeof document === 'undefined') return // tests run without a page
  const host = document.querySelector<HTMLElement>('#scene')
  if (!host) return

  // real errors also reach the runtime error panel of the page, pointing at your exercise file
  const exerciseFile = location.pathname.match(/(\d+-(?:begin|end))/)?.[1]
  const report = (error: unknown) => {
    console.error(error)
    const stackFile = error instanceof Error ? error.stack?.match(/\/(src\/\d+-(?:begin|end)\.ts)/)?.[1] : undefined
    window.dispatchEvent(new ErrorEvent('error', {
      error,
      message: messageOf(error),
      filename: stackFile ?? (exerciseFile ? `src/${exerciseFile}.ts` : ''),
    }))
  }
  first.thrown.forEach(report)

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  const root = el('div', 'cin-root')
  host.replaceChildren(root)

  // stage: the 3D rooftop with its HTML tickets
  const stage = el('div', 'cin-stage')
  const labelLayer = el('div', 'cin-labels')
  const toolbar = el('div', 'cin-toolbar')
  const next = el('button', 'cin-next')
  next.type = 'button'
  next.append(svg('play'), 'Play the next reel')
  toolbar.append(next)
  const waiting = el('div', 'cin-waiting')
  waiting.setAttribute('role', 'status')
  stage.append(labelLayer, waiting, toolbar)

  const caption = el('div', 'cin-caption')
  caption.setAttribute('aria-live', 'polite')
  root.append(stage, caption)

  // ----- the floating card while step 1 or 2 is not done -----
  const early = first.steps.find(step => step.n <= 2 && !step.done)
  waiting.hidden = early === undefined
  if (early) waiting.append(svg('wait', 'cin-icon cin-waiting-icon'), el('strong', '', `Waiting for step ${early.n}`), el('span', '', early.hint))

  // ----- the caption: what filmFor returned, then the next step -----
  const playedLine = el('p', 'cin-caption-played')
  const status = el('p', 'cin-caption-status')
  caption.append(playedLine, status)
  const nextStep = first.steps.find(step => !step.done)
  if (first.thrown.length > 0) {
    status.classList.add('is-error')
    status.append(svg('alert'), el('span', '', `Your code threw: ${first.thrown.map(messageOf).join(' / ')}`))
  } else if (nextStep) {
    status.classList.add('is-waiting')
    status.append(svg('wait'), el('strong', '', `Waiting for step ${nextStep.n}.`), ` ${nextStep.hint}`)
  } else {
    status.append(svg('check'), 'All steps done: every reel plays, the missing one shows static.')
  }

  // ----- the tickets: one short line each, the label your board gave, then the time -----
  const ticketNodes = first.tickets.map((ticket) => {
    const now = ticket.label !== undefined && /now/i.test(ticket.label)
    const node = el('div', now ? 'cin-label cin-ticket is-now' : 'cin-label cin-ticket')
    if (ticket.problem) {
      node.classList.add('is-problem')
      node.append(el('span', 'cin-ticket-text', `${ticket.screening.time} describe threw`))
    } else {
      if (ticket.label !== undefined) node.append(el('span', 'cin-ticket-head', ticket.label))
      node.append(el('span', 'cin-ticket-text', ticket.screening.time))
    }
    labelLayer.append(node)
    return node
  })

  // ----- the screen texture -----
  const screenCanvas = document.createElement('canvas')
  screenCanvas.width = SCREEN_W
  screenCanvas.height = SCREEN_H
  const screenCtx = screenCanvas.getContext('2d')
  const noise = document.createElement('canvas')
  noise.width = 192
  noise.height = 96
  fillNoise(noise)
  let screenState: ScreenState = { kind: 'idle' }
  const screenTexture = new THREE.CanvasTexture(screenCanvas)
  screenTexture.colorSpace = THREE.SRGBColorSpace
  screenTexture.anisotropy = 4
  const paint = () => {
    if (screenCtx) drawScreen(screenCtx, screenState, noise)
    screenTexture.needsUpdate = true
  }

  let renderer: THREE.WebGLRenderer
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  } catch {
    stage.classList.add('cin-no-webgl')
    waiting.hidden = false
    waiting.replaceChildren(el('strong', '', 'This browser cannot draw the 3D cinema.'), el('span', '', 'The board is still printed in the console.'))
    return
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap
  renderer.domElement.className = 'cin-canvas'
  renderer.domElement.setAttribute('role', 'img')
  renderer.domElement.setAttribute('aria-label', 'A rooftop cinema: a big screen on a deck, and a projector facing it')
  stage.prepend(renderer.domElement)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(32, 16 / 9, 0.1, 100)

  scene.add(new THREE.HemisphereLight('#ffe9d6', '#2a0d16', 1.5))
  const moon = new THREE.DirectionalLight('#dfe8ff', 1.6)
  moon.position.set(-5, 12, 8)
  moon.castShadow = true
  moon.shadow.mapSize.set(1024, 1024)
  moon.shadow.camera.left = -9
  moon.shadow.camera.right = 9
  moon.shadow.camera.top = 7
  moon.shadow.camera.bottom = -7
  moon.shadow.radius = 4
  moon.shadow.bias = -0.0005
  scene.add(moon)

  const mat = (color: string, extra: THREE.MeshStandardMaterialParameters = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.05, ...extra })
  const mesh = (geometry: THREE.BufferGeometry, material: THREE.Material, x: number, y: number, z: number) => {
    const m = new THREE.Mesh(geometry, material)
    m.position.set(x, y, z)
    m.castShadow = true
    m.receiveShadow = true
    return m
  }

  // the deck
  const deck = mesh(new RoundedBoxGeometry(9.6, 0.3, 7, 4, 0.12), mat(palette.deck), 0, -0.15, 0.6)
  scene.add(deck)
  for (let i = -4; i <= 4; i++) {
    const plank = mesh(new THREE.BoxGeometry(0.03, 0.01, 6.8), mat('#2c1219'), i * 1.05, 0.005, 0.6)
    plank.castShadow = false
    scene.add(plank)
  }

  // the screen: a dark frame on two legs, the picture itself is unlit so it glows
  const SW = 5.6
  const SH = 2.8
  const screenY = 2.35
  const screenZ = -2.4
  scene.add(mesh(new RoundedBoxGeometry(SW + 0.36, SH + 0.36, 0.2, 3, 0.06), mat(palette.frame), 0, screenY, screenZ - 0.12))
  const picture = new THREE.Mesh(new THREE.PlaneGeometry(SW, SH), new THREE.MeshBasicMaterial({ map: screenTexture, toneMapped: false }))
  picture.position.set(0, screenY, screenZ)
  scene.add(picture)
  for (const x of [-SW / 2 + 0.5, SW / 2 - 0.5]) {
    scene.add(mesh(new THREE.CylinderGeometry(0.07, 0.09, screenY - SH / 2, 12), mat(palette.frame), x, (screenY - SH / 2) / 2, screenZ - 0.15))
  }
  // a row of marquee bulbs along the top of the frame
  const bulbMaterial = new THREE.MeshStandardMaterial({ color: palette.yellow, emissive: palette.yellow, emissiveIntensity: 1.2 })
  for (let i = 0; i < 15; i++) {
    const bulb = mesh(new THREE.SphereGeometry(0.06, 12, 8), bulbMaterial, -SW / 2 + 0.1 + i * ((SW - 0.2) / 14), screenY + SH / 2 + 0.18, screenZ + 0.02)
    bulb.castShadow = false
    scene.add(bulb)
  }
  // the screen lights the deck in front of it
  const screenLight = new THREE.PointLight(palette.cream, 0, 8, 1.6)
  screenLight.position.set(0, screenY - 0.6, screenZ + 1.2)
  scene.add(screenLight)

  // the projector, at the back of the deck, facing the screen
  const projector = new THREE.Group()
  projector.position.set(0, 0, 2.6)
  projector.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.55, 8), mat(palette.steel), 0, 0.27, 0))
  projector.add(mesh(new RoundedBoxGeometry(0.75, 0.5, 0.95, 3, 0.1), mat(palette.red), 0, 0.8, 0))
  projector.add(mesh(new RoundedBoxGeometry(0.78, 0.08, 0.98, 2, 0.03), mat(palette.redDark), 0, 0.58, 0))
  const lensMaterial = new THREE.MeshStandardMaterial({ color: '#2a2a33', emissive: palette.cream, emissiveIntensity: 0 })
  const lens = mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.22, 20), lensMaterial, 0, 0.82, -0.55)
  lens.rotation.x = Math.PI / 2
  projector.add(lens)
  const reels: THREE.Mesh[] = []
  for (const z of [-0.28, 0.32]) {
    const reel = mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.07, 28), mat('#2b2530', { metalness: 0.4, roughness: 0.4 }), 0, 1.4, z)
    reel.rotation.z = Math.PI / 2
    const hub = mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.1, 12), mat(palette.muted), 0, 0, 0)
    reel.add(hub)
    for (let k = 0; k < 4; k++) {
      const hole = mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.09, 10), mat(palette.frame), Math.cos(k * Math.PI / 2) * 0.19, 0, Math.sin(k * Math.PI / 2) * 0.19)
      reel.add(hole)
    }
    projector.add(reel)
    reels.push(reel)
  }
  scene.add(projector)

  // the beam: from the lens to the four corners of the picture
  const lensPoint = new THREE.Vector3(0, 0.82, 2.6 - 0.66)
  const corners = [
    new THREE.Vector3(-SW / 2, screenY - SH / 2, screenZ + 0.01),
    new THREE.Vector3(SW / 2, screenY - SH / 2, screenZ + 0.01),
    new THREE.Vector3(SW / 2, screenY + SH / 2, screenZ + 0.01),
    new THREE.Vector3(-SW / 2, screenY + SH / 2, screenZ + 0.01),
  ]
  const beamPositions: number[] = []
  for (let i = 0; i < 4; i++) {
    const a = corners[i]
    const b = corners[(i + 1) % 4]
    if (a && b) beamPositions.push(lensPoint.x, lensPoint.y, lensPoint.z, a.x, a.y, a.z, b.x, b.y, b.z)
  }
  const beamGeometry = new THREE.BufferGeometry()
  beamGeometry.setAttribute('position', new THREE.Float32BufferAttribute(beamPositions, 3))
  const beamMaterial = new THREE.MeshBasicMaterial({
    color: palette.cream,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  })
  scene.add(new THREE.Mesh(beamGeometry, beamMaterial))

  // ----- tickets float above the front of the deck -----
  const count = ticketNodes.length
  const labels: Label[] = ticketNodes.map((node, i) => ({
    node,
    anchor: new THREE.Vector3(count <= 1 ? 0 : -3.3 + (6.6 * i) / (count - 1), 0.05, 3.5),
  }))

  // ----- playing a reel -----
  let playing = -1
  let beamTarget = 0
  const play = (index: number) => {
    const screening = api.programme[index]
    if (!screening) return
    playing = index
    ticketNodes.forEach((node, i) => node.classList.toggle('is-playing', i === index))
    const call = `Latest: filmFor('${screening.reel}')`
    playedLine.replaceChildren(svg('film'))
    const result = attempt(() => api.filmFor(screening.reel))
    if (!result.ok) {
      report(result.error)
      screenState = { kind: 'static', title: 'The projector jammed', detail: messageOf(result.error).slice(0, 48) }
      playedLine.append(el('code', '', `${call} threw an error`))
    } else if (result.value === null) {
      screenState = first.filmsWork
        ? { kind: 'static', title: `reel ${screening.reel} is missing`, detail: 'ask the projectionist' }
        : { kind: 'static', title: 'No film on this reel yet', detail: 'Waiting for step 2' }
      playedLine.append(el('code', '', `${call} returned null`))
    } else {
      const film = result.value
      screenState = { kind: 'film', film }
      playedLine.append(el('code', '', `${call} returned ${film.title} (${film.year}), ${film.minutes} min`))
    }
    beamTarget = screenState.kind === 'film' ? 0.16 : 0.08
    paint()
  }
  next.addEventListener('click', () => play((playing + 1) % Math.max(1, api.programme.length)))

  // ---------- camera, resize and the render loop ----------

  const target = new THREE.Vector3(0.1, 0.95, 0.8)
  function resize() {
    const width = stage.clientWidth
    const height = stage.clientHeight
    if (width === 0 || height === 0) return
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    const halfFov = THREE.MathUtils.degToRad(camera.fov / 2)
    const horizontal = Math.atan(Math.tan(halfFov) * camera.aspect)
    const distance = Math.max(14.5, 6.4 / Math.tan(horizontal))
    camera.position.copy(target).addScaledVector(new THREE.Vector3(0.26, 0.5, 1).normalize(), distance)
    camera.lookAt(target)
  }

  const projected = new THREE.Vector3()
  function placeLabels() {
    const width = stage.clientWidth
    const height = stage.clientHeight
    for (const { node, anchor } of labels) {
      projected.copy(anchor).project(camera)
      const x = (projected.x * 0.5 + 0.5) * width
      const y = (-projected.y * 0.5 + 0.5) * height
      node.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -100%)`
    }
  }

  let lastNoise = 0
  function frame(time: number) {
    const motion = !reducedMotion.matches
    const t = time / 1000
    beamMaterial.opacity += (beamTarget - beamMaterial.opacity) * (motion ? 0.08 : 1)
    if (motion && beamTarget > 0) beamMaterial.opacity *= 0.96 + 0.04 * Math.sin(t * 23) * Math.sin(t * 7)
    lensMaterial.emissiveIntensity = beamTarget > 0 ? 1.4 : 0
    screenLight.intensity = screenState.kind === 'film' ? 2.2 : screenState.kind === 'static' ? 1 : 0.3
    if (motion && screenState.kind === 'film') for (const reel of reels) reel.rotation.x = t * 2.2
    bulbMaterial.emissiveIntensity = motion ? 1 + 0.25 * Math.sin(t * 2.4) : 1.2
    if (motion && screenState.kind === 'static' && time - lastNoise > 70) {
      lastNoise = time
      fillNoise(noise)
      paint()
    }
    renderer.render(scene, camera)
    placeLabels()
    requestAnimationFrame(frame)
  }

  new ResizeObserver(resize).observe(stage)

  // painted words use the page fonts: wait for them (at most a second and a half) before the first paint
  const fonts = ['700 48px Montserrat', '600 30px "Open Sans"', '700 32px "JetBrains Mono"'].map(font => document.fonts.load(font).catch(() => []))
  void Promise.race([Promise.all(fonts), new Promise(resolve => setTimeout(resolve, 1500))]).then(() => {
    paint()
    resize()
    if (first.filmsWork && api.programme.length > 0) play(0)
    else playedLine.append(svg('film'), el('span', '', 'Press Play to send the next reel to the projector.'))
    requestAnimationFrame(frame)
  })
}
