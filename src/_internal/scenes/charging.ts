// Exercise 1 scene: a small 3D car park that shows your charging board. You do not need to modify this file.
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { feed, latest } from '../charger-feed'
import './charging.css'

// ---------- what the scene receives from your exercise file ----------

type ChargerShape = { id: string; status: string }

/** The functions exported by src/1-begin.ts (or src/1-end.ts) */
export type ChargingApi<C extends ChargerShape> = {
  describe: (charger: C) => string
  isCharger: (value: unknown) => value is C
  assertIsCharger: (value: unknown) => asserts value is C
  board: (records: readonly unknown[], last: unknown) => string[]
}

// ---------- running your functions without letting them break the page ----------

type State = 'available' | 'charging' | 'faulted' | 'reserved' | 'unknown'

type BayInfo = {
  id: string
  state: State
  text: string
  problem?: string
  onlyId: boolean
  kWh: number
  until: string
  code: string
}

type StepCheck = { n: number; done: boolean; hint: string }

type Analysis = {
  bays: BayInfo[]
  rejected: string[]
  latest: { id: string; text: string; problem?: string; onlyId: boolean }
  steps: StepCheck[]
  errors: string[]
  /** the values your code threw, one per message */
  thrown: unknown[]
  lines: string[]
  /** what happened to each record of the feed, in order */
  order: ({ kind: 'bay'; bay: number } | { kind: 'bin'; label: string })[]
}

function field(value: unknown, key: string): unknown {
  if (typeof value !== 'object' || value === null) return undefined
  const read: unknown = Reflect.get(value, key)
  return read
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function quietly<T>(run: () => T, fallback: T): T {
  try {
    return run()
  } catch {
    return fallback
  }
}

function labelOf(record: unknown): string {
  if (record === null) return 'null'
  const id = field(record, 'id')
  return typeof id === 'string' ? id : typeof record
}

function stateOf(record: unknown): State {
  const status = field(record, 'status')
  return status === 'available' || status === 'charging' || status === 'faulted' || status === 'reserved' ? status : 'unknown'
}

function analyse<C extends ChargerShape>(api: ChargingApi<C>): Analysis {
  const errors: string[] = []
  const thrown: unknown[] = []
  const fail = (error: unknown) => {
    const message = messageOf(error)
    if (!errors.includes(message)) {
      errors.push(message)
      thrown.push(error)
    }
    return message
  }

  // 1. the board itself, printed to the console like before
  let lines: string[] = []
  try {
    lines = api.board(feed, latest)
  } catch (error) {
    fail(error)
  }

  // 2. every record of the feed goes through isCharger: a bay or the bin
  const accepted: C[] = []
  const rejected: string[] = []
  const order: Analysis['order'] = []
  for (const record of feed) {
    let ok = false
    try {
      if (api.isCharger(record)) {
        ok = true
        order.push({ kind: 'bay', bay: accepted.length })
        accepted.push(record)
      }
    } catch (error) {
      fail(error)
    }
    if (!ok) {
      rejected.push(labelOf(record))
      order.push({ kind: 'bin', label: labelOf(record) })
    }
  }

  const bays = accepted.map((charger): BayInfo => {
    const id = labelOf(charger)
    const kWh = field(charger, 'kWh')
    const until = field(charger, 'until')
    const code = field(charger, 'code')
    const base = {
      id,
      state: stateOf(charger),
      kWh: typeof kWh === 'number' ? kWh : 0,
      until: typeof until === 'string' ? until : '',
      code: typeof code === 'string' ? code : '',
    }
    try {
      const text = String(api.describe(charger))
      return { ...base, text, onlyId: text.trim() === id }
    } catch (error) {
      return { ...base, text: id, problem: fail(error), onlyId: false }
    }
  })

  // 3. the latest record goes through assertIsCharger, then describe
  const last: unknown = latest
  const latestId = labelOf(last)
  let latestInfo: Analysis['latest']
  try {
    api.assertIsCharger(last)
    const text = String(api.describe(last))
    latestInfo = { id: latestId, text, onlyId: text.trim() === latestId }
  } catch (error) {
    latestInfo = { id: latestId, text: '', problem: fail(error), onlyId: false }
  }

  // 4. quiet probes that tell which steps are done (their errors are expected)
  const accepts = (value: unknown) => quietly(() => api.isCharger(value), false)
  const describes = bays.some(bay => !bay.onlyId && !bay.problem) || (!latestInfo.onlyId && !latestInfo.problem)
  const checks = accepts(feed[0]) && accepts(feed[1]) && accepts(feed[2]) && !accepts(feed[3]) && !accepts(null)
  const asserts = quietly(() => {
    api.assertIsCharger({ id: 'C4' })
    return false
  }, true)
  const reserved = accepts(feed[4])

  const steps: StepCheck[] = [
    { n: 1, done: describes, hint: 'describe still returns only the id. Switch on charger.status.' },
    {
      n: 2,
      done: checks,
      hint: accepted.length === 0
        ? 'isCharger accepts no record yet, so every record drops into the bin.'
        : 'isCharger should accept C1, C2 and C3, and reject C4 and null.',
    },
    { n: 2, done: asserts, hint: 'assertIsCharger lets a bad record through. Throw when isCharger says no.' },
    { n: 3, done: reserved, hint: 'C5 is reserved and still lands in the bin. Add the reserved state.' },
  ]

  return { bays, rejected, latest: latestInfo, steps, errors, thrown, lines, order }
}

// ---------- small DOM helpers ----------

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

const svgPaths = {
  replay: '<path d="M4 12a8 8 0 1 0 2.4-5.7" /><path d="M4 4v4.5h4.5" />',
  bolt: '<path d="M13 3 5 13.5h6L10 21l8-10.5h-6z" />',
  bin: '<path d="M4 7h16" /><path d="M6 7l1.2 12.5h9.6L18 7" /><path d="M9.5 7V4.5h5V7" />',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5" />',
  wait: '<circle cx="12" cy="12" r="8" /><path d="M12 8v4.5l3 2" />',
  alert: '<path d="M12 4 2.8 20h18.4z" /><path d="M12 10v4.5" /><path d="M12 17.5v.01" />',
}

function svg(name: keyof typeof svgPaths, className = 'cs-icon'): SVGSVGElement {
  const node = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  node.setAttribute('viewBox', '0 0 24 24')
  node.setAttribute('aria-hidden', 'true')
  node.setAttribute('class', className)
  node.innerHTML = svgPaths[name]
  return node
}

// ---------- colours of the page ----------

const palette = {
  navy: '#00273f',
  surface: '#0b3553',
  surface2: '#164466',
  blue: '#3178c6',
  blueLight: '#358ef1',
  yellow: '#f1dd35',
  text: '#faf9f8',
  muted: '#a9bdcf',
  green: '#4be0a6',
  red: '#ff6f61',
}

const stateColor: Record<State, string> = {
  available: palette.green,
  charging: palette.blueLight,
  faulted: palette.red,
  reserved: palette.yellow,
  unknown: palette.muted,
}

const stateName: Record<State, string> = {
  available: 'Available',
  charging: 'Charging',
  faulted: 'Out of order',
  reserved: 'Reserved',
  unknown: 'Unknown state',
}

// ---------- canvas textures for the few words painted in the 3D world ----------

function canvasTexture(width: number, height: number, draw: (ctx: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (ctx) draw(ctx)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

function glowTexture(): THREE.CanvasTexture {
  return canvasTexture(128, 128, (ctx) => {
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
    gradient.addColorStop(0, 'rgba(255,255,255,1)')
    gradient.addColorStop(0.35, 'rgba(255,255,255,0.45)')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 128, 128)
  })
}

function paintedText(text: string, color: string): THREE.CanvasTexture {
  return canvasTexture(256, 128, (ctx) => {
    ctx.fillStyle = color
    ctx.font = '700 84px Montserrat, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, 128, 70)
  })
}

function screenTexture(bay: BayInfo): THREE.CanvasTexture {
  return canvasTexture(128, 360, (ctx) => {
    ctx.fillStyle = palette.navy
    ctx.fillRect(0, 0, 128, 360)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const color = stateColor[bay.state]
    ctx.fillStyle = color
    ctx.strokeStyle = color
    ctx.lineWidth = 8
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    if (bay.state === 'available') {
      ctx.beginPath()
      ctx.arc(64, 150, 36, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(48, 152)
      ctx.lineTo(60, 164)
      ctx.lineTo(82, 138)
      ctx.stroke()
      ctx.font = '700 26px Montserrat, sans-serif'
      ctx.fillText('FREE', 64, 230)
    } else if (bay.state === 'faulted') {
      ctx.beginPath()
      ctx.moveTo(64, 108)
      ctx.lineTo(102, 176)
      ctx.lineTo(26, 176)
      ctx.closePath()
      ctx.stroke()
      ctx.font = '700 34px Montserrat, sans-serif'
      ctx.fillText('!', 64, 152)
      ctx.font = '700 30px "JetBrains Mono", monospace'
      ctx.fillText(bay.code || '?', 64, 230)
    } else if (bay.state === 'reserved') {
      ctx.beginPath()
      ctx.arc(64, 150, 34, 0, Math.PI * 2)
      ctx.moveTo(64, 150)
      ctx.lineTo(64, 128)
      ctx.moveTo(64, 150)
      ctx.lineTo(80, 158)
      ctx.stroke()
      ctx.font = '700 28px "JetBrains Mono", monospace'
      ctx.fillText(bay.until || '?', 64, 230)
    } else if (bay.state === 'unknown') {
      ctx.font = '700 64px Montserrat, sans-serif'
      ctx.fillText('?', 64, 170)
    } else {
      // charging: a slot for the energy bar, drawn in 3D on top
      ctx.fillStyle = '#062035'
      ctx.fillRect(34, 40, 60, 260)
      ctx.font = '700 22px "JetBrains Mono", monospace'
      ctx.fillStyle = color
      ctx.fillText('kWh', 64, 330)
    }
  })
}

function crateTexture(label: string): THREE.CanvasTexture {
  return canvasTexture(128, 128, (ctx) => {
    ctx.fillStyle = '#dbe5ee'
    ctx.fillRect(0, 0, 128, 128)
    ctx.strokeStyle = '#9fb3c6'
    ctx.lineWidth = 6
    ctx.strokeRect(8, 8, 112, 112)
    ctx.fillStyle = palette.navy
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `700 ${label.length > 3 ? 34 : 46}px "JetBrains Mono", monospace`
    ctx.fillText(label, 64, 66)
  })
}

// ---------- easing ----------

const easeOutCubic = (k: number) => 1 - (1 - k) ** 3
const easeOutBack = (k: number) => 1 + 2.2 * (k - 1) ** 3 + 1.2 * (k - 1) ** 2
function easeOutBounce(k: number): number {
  if (k < 1 / 2.75) return 7.5625 * k * k
  if (k < 2 / 2.75) return 7.5625 * (k -= 1.5 / 2.75) * k + 0.75
  if (k < 2.5 / 2.75) return 7.5625 * (k -= 2.25 / 2.75) * k + 0.9375
  return 7.5625 * (k -= 2.625 / 2.75) * k + 0.984375
}

type Tween = { start: number; duration: number; apply: (k: number) => void }

// ---------- the scene ----------

const BAY_W = 2.6
const BAY_D = 5.2
const PILLAR_Z = -2.05

type Label = { node: HTMLElement; anchor: THREE.Vector3 }

/** Shows the charging board as a car park: one bay per valid charger, a bin for the rejected records */
export function mountScene<C extends ChargerShape>(api: ChargingApi<C>): void {
  const first = analyse(api)
  first.lines.forEach(line => console.log(line))

  if (typeof document === 'undefined') return // tests run without a page
  const host = document.querySelector<HTMLElement>('#scene')
  if (!host) return

  // real errors also reach the runtime error panel of the page, pointing at your exercise file
  const exerciseFile = location.pathname.match(/(\d+-(?:begin|end))/)?.[1]
  for (const error of first.thrown) {
    console.error(error)
    const stackFile = error instanceof Error ? error.stack?.match(/\/(src\/\d+-(?:begin|end)\.ts)/)?.[1] : undefined
    window.dispatchEvent(new ErrorEvent('error', {
      error,
      message: messageOf(error),
      filename: stackFile ?? (exerciseFile ? `src/${exerciseFile}.ts` : ''),
    }))
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  const root = el('div', 'cs-root')
  host.replaceChildren(root)

  // stage: the 3D car park with its HTML labels
  const stage = el('div', 'cs-stage')
  const labelLayer = el('div', 'cs-labels')
  const toolbar = el('div', 'cs-toolbar')
  const replay = el('button', 'cs-replay')
  replay.type = 'button'
  replay.append(svg('replay'), 'Replay the feed')
  toolbar.append(replay)
  const waiting = el('div', 'cs-waiting')
  waiting.setAttribute('role', 'status')
  stage.append(labelLayer, waiting, toolbar)

  // one short caption under the stage: the latest record and what to do next
  const caption = el('div', 'cs-caption')
  caption.setAttribute('aria-live', 'polite')
  root.append(stage, caption)

  let renderer: THREE.WebGLRenderer
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  } catch {
    stage.classList.add('cs-no-webgl')
    waiting.hidden = false
    waiting.replaceChildren(el('strong', '', 'This browser cannot draw the 3D car park.'), el('span', '', 'The board is still printed in the console.'))
    renderCaption(first)
    return
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap
  renderer.domElement.className = 'cs-canvas'
  renderer.domElement.setAttribute('role', 'img')
  stage.prepend(renderer.domElement)

  const scene = new THREE.Scene()

  const camera = new THREE.PerspectiveCamera(34, 16 / 9, 0.1, 100)

  scene.add(new THREE.HemisphereLight('#d6e8ff', '#0b3553', 1.6))
  const sun = new THREE.DirectionalLight('#fff4e0', 2.2)
  sun.position.set(-6, 14, 9)
  sun.castShadow = true
  sun.shadow.mapSize.set(2048, 2048)
  sun.shadow.camera.left = -14
  sun.shadow.camera.right = 14
  sun.shadow.camera.top = 10
  sun.shadow.camera.bottom = -10
  sun.shadow.radius = 4
  sun.shadow.bias = -0.0005
  scene.add(sun, sun.target)

  const glow = glowTexture()

  const world = new THREE.Group() // rebuilt on each replay
  scene.add(world)

  let labels: Label[] = []
  let tweens: Tween[] = []
  let blinkers: THREE.MeshStandardMaterial[] = []
  let bands: { mesh: THREE.Mesh; height: number }[] = []
  let rings: THREE.MeshBasicMaterial[] = []
  const target = new THREE.Vector3()
  let distance = 18
  let bayStep = BAY_W
  let clockStart = performance.now()

  const now = () => (performance.now() - clockStart) / 1000
  const tween = (start: number, duration: number, apply: (k: number) => void) => {
    if (reducedMotion.matches || duration === 0) apply(1)
    else {
      apply(0)
      tweens.push({ start, duration, apply })
    }
  }

  function dispose(object: THREE.Object3D) {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh || child instanceof THREE.Sprite) {
        child.geometry.dispose()
        const materials: THREE.Material[] = Array.isArray(child.material) ? child.material : [child.material]
        for (const material of materials) {
          if ('map' in material && material.map instanceof THREE.Texture && material.map !== glow) material.map.dispose()
          material.dispose()
        }
      }
    })
  }

  const mat = (color: string, options: THREE.MeshStandardMaterialParameters = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.05, ...options })

  function mesh(geometry: THREE.BufferGeometry, material: THREE.Material, x = 0, y = 0, z = 0): THREE.Mesh {
    const m = new THREE.Mesh(geometry, material)
    m.position.set(x, y, z)
    m.castShadow = true
    m.receiveShadow = true
    return m
  }

  function addLabel(anchor: THREE.Vector3, node: HTMLElement): void {
    node.classList.add('cs-label')
    labelLayer.append(node)
    labels.push({ node, anchor })
  }

  function car(color: string): THREE.Group {
    const group = new THREE.Group()
    group.add(mesh(new RoundedBoxGeometry(1.5, 0.5, 2.7, 3, 0.18), mat(color, { roughness: 0.35, metalness: 0.2 }), 0, 0.5, 0))
    group.add(mesh(new RoundedBoxGeometry(1.26, 0.46, 1.45, 3, 0.16), mat('#0a2a42', { roughness: 0.15, metalness: 0.4 }), 0, 0.9, 0.18))
    const wheel = new THREE.CylinderGeometry(0.27, 0.27, 0.2, 18)
    for (const [wx, wz] of [[-0.7, -0.88], [0.7, -0.88], [-0.7, 0.9], [0.7, 0.9]] as const) {
      const w = mesh(wheel, mat('#0d1b26', { roughness: 0.9 }), wx, 0.27, wz)
      w.rotation.z = Math.PI / 2
      group.add(w)
    }
    const lamp = new THREE.BoxGeometry(0.3, 0.1, 0.04)
    for (const lx of [-0.48, 0.48]) {
      group.add(mesh(lamp, mat('#fff6c8', { emissive: '#fff6c8', emissiveIntensity: 1.2 }), lx, 0.56, -1.36))
      group.add(mesh(lamp, mat('#ff8a7a', { emissive: '#ff6f61', emissiveIntensity: 0.8 }), lx, 0.56, 1.36))
    }
    return group
  }

  // ---------- building one run of the feed ----------

  function build(run: Analysis) {
    dispose(world)
    world.clear()
    labelLayer.replaceChildren()
    labels = []
    tweens = []
    blinkers = []
    bands = []
    rings = []
    clockStart = performance.now()

    const count = Math.max(4, run.bays.length)
    const lotWidth = count * BAY_W
    const left = -lotWidth / 2
    const binX = left + lotWidth + 2.3
    const right = binX + 1.4
    const centerX = (left - 0.4 + right) / 2
    world.position.x = -centerX
    target.set(0, 1.55, -0.5)
    bayStep = BAY_W
    fitCamera(right - left + 3.6)
    renderer.domElement.setAttribute('aria-label', `Car park with ${run.bays.length} charging bays and ${run.rejected.length} records in the rejected bin`)

    // the lot: asphalt, kerb, painted lines and bay names
    const lot = mesh(new THREE.BoxGeometry(lotWidth + 0.8, 0.08, BAY_D + 1.2), mat('#0f4466', { roughness: 0.95 }), left + lotWidth / 2, 0.04, -0.15)
    lot.castShadow = false
    world.add(lot)
    world.add(mesh(new THREE.BoxGeometry(lotWidth + 0.8, 0.22, 0.35), mat('#1d5a83'), left + lotWidth / 2, 0.11, -BAY_D / 2 - 0.65))
    for (let i = 0; i <= count; i++) {
      const line = mesh(new THREE.BoxGeometry(0.07, 0.01, BAY_D - 0.6), mat('#c8d6e3', { roughness: 1 }), left + i * BAY_W, 0.085, -0.15)
      line.castShadow = false
      world.add(line)
    }
    for (let i = 0; i < count; i++) {
      const bay = run.bays[i]
      const name = new THREE.Mesh(
        new THREE.PlaneGeometry(1.1, 0.55),
        new THREE.MeshBasicMaterial({ map: paintedText(bay ? bay.id : `P${i + 1}`, bay ? '#e9f0f6' : '#5f84a3'), transparent: true, opacity: bay ? 0.75 : 0.6, depthWrite: false }),
      )
      name.rotation.x = -Math.PI / 2
      name.position.set(left + (i + 0.5) * BAY_W, 0.09, BAY_D / 2 - 0.55)
      world.add(name)
    }

    // the bin for rejected records
    const binZ = 0.4
    const binGroup = new THREE.Group()
    binGroup.position.set(binX, 0, binZ)
    const binWall = mesh(new THREE.CylinderGeometry(1.05, 0.9, 0.95, 40, 1, true), mat(palette.surface2, { side: THREE.DoubleSide, roughness: 0.5 }), 0, 0.475, 0)
    binGroup.add(binWall)
    binGroup.add(mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.06, 40), mat('#0d3048'), 0, 0.03, 0))
    const rim = mesh(new THREE.TorusGeometry(1.05, 0.06, 12, 48), mat(palette.blueLight, { emissive: palette.blue, emissiveIntensity: 0.35 }), 0, 0.95, 0)
    rim.rotation.x = Math.PI / 2
    binGroup.add(rim)
    world.add(binGroup)

    const binLabel = el('div', 'cs-bin-label')
    const binCount = el('strong', 'cs-bin-count', '0')
    binLabel.append(svg('bin'), el('span', '', 'Rejected'), binCount)
    addLabel(new THREE.Vector3(binX, 2.05, binZ), binLabel)

    // records arrive one after the other, in feed order
    const step = 0.5
    let crateIndex = 0
    let landed = 0
    run.order.forEach((outcome, index) => {
      const start = 0.35 + index * step
      if (outcome.kind === 'bay') {
        const bay = run.bays[outcome.bay]
        if (bay) addBay(bay, left + (outcome.bay + 0.5) * BAY_W, outcome.bay, start, run.latest.id === bay.id && !run.latest.problem, run.order.length * step)
      } else {
        addCrate(outcome.label, binGroup, crateIndex++, start, () => {
          landed++
          binCount.textContent = String(landed)
        })
      }
    })
    if (reducedMotion.matches) binCount.textContent = String(run.rejected.length)

    // the empty lot waits for step 2
    const step2 = run.steps.find(s => s.n === 2)
    waiting.hidden = run.bays.length > 0
    if (run.bays.length === 0) {
      waiting.replaceChildren(svg('wait', 'cs-icon cs-waiting-icon'), el('strong', '', 'Waiting for step 2'), el('span', '', step2?.hint ?? ''))
    }

    renderCaption(run)
  }

  function addBay(bay: BayInfo, x: number, slot: number, start: number, isLatest: boolean, feedTime: number) {
    const color = stateColor[bay.state]
    const group = new THREE.Group()
    group.position.set(x, 0, 0)
    world.add(group)

    // coloured glow on the ground of the bay
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(BAY_W - 0.3, BAY_D - 1),
      new THREE.MeshBasicMaterial({ color, map: glow, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }),
    )
    floor.rotation.x = -Math.PI / 2
    floor.position.set(0, 0.095, -0.6)
    group.add(floor)

    // the charging pillar
    const pillar = new THREE.Group()
    pillar.position.set(0, 0, PILLAR_Z)
    group.add(pillar)
    pillar.add(mesh(new RoundedBoxGeometry(0.85, 0.14, 0.62, 2, 0.05), mat('#1d5a83'), 0, 0.15, 0))
    pillar.add(mesh(new RoundedBoxGeometry(0.6, 1.75, 0.44, 3, 0.1), mat('#e8eef4', { roughness: 0.45 }), 0, 1.0, 0))
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 1.12), new THREE.MeshBasicMaterial({ map: screenTexture(bay) }))
    screen.position.set(0, 1.02, 0.225)
    pillar.add(screen)
    const capMaterial = mat(color, { emissive: color, emissiveIntensity: 1.3 })
    pillar.add(mesh(new RoundedBoxGeometry(0.66, 0.16, 0.5, 2, 0.06), capMaterial, 0, 1.95, 0))
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }))
    halo.position.set(0, 1.98, 0.05)
    halo.scale.setScalar(1.5)
    pillar.add(halo)
    const light = new THREE.PointLight(color, 0, 6, 1.6)
    light.position.set(0, 1.4, 0.9)
    pillar.add(light)

    if (bay.state === 'faulted') blinkers.push(capMaterial)

    if (bay.state === 'charging') {
      // energy bar sized by kWh (a full bar is 30 kWh), with a slow band of light going up
      const height = 0.9 * Math.min(1, Math.max(0.06, bay.kWh / 30))
      const bar = mesh(new THREE.BoxGeometry(0.2, 1, 0.02), mat(palette.blueLight, { emissive: palette.blueLight, emissiveIntensity: 1.1 }), 0, 0.6 + height / 2, 0.235)
      bar.castShadow = false
      pillar.add(bar)
      const band = mesh(new THREE.BoxGeometry(0.2, 0.05, 0.025), mat('#ffffff', { emissive: '#d8ecff', emissiveIntensity: 1.6 }), 0, 0.6, 0.24)
      band.castShadow = false
      pillar.add(band)
      bands.push({ mesh: band, height })
      tween(start + 0.5, 1.1, (k) => {
        const h = Math.max(0.001, height * easeOutCubic(k))
        bar.scale.y = h
        bar.position.y = 0.6 + h / 2
      })

      const parked = car([palette.blueLight, '#f4f1ea', palette.yellow][slot % 3] ?? palette.blueLight)
      group.add(parked)
      const curve = new THREE.CubicBezierCurve3(
        new THREE.Vector3(0.3, 1.05, PILLAR_Z + 0.05),
        new THREE.Vector3(0.75, 0.9, PILLAR_Z + 0.2),
        new THREE.Vector3(0.75, 0.25, -1.2),
        new THREE.Vector3(0.55, 0.62, -0.95),
      )
      const cable = mesh(new THREE.TubeGeometry(curve, 24, 0.035, 8), mat('#11222f', { emissive: palette.blue, emissiveIntensity: 0.25 }))
      group.add(cable)
      cable.visible = false
      tween(start, 0.9, (k) => {
        parked.position.z = 0.35 + (1 - easeOutCubic(k)) * 7
        cable.visible = k >= 1
      })
    }

    if (isLatest) {
      const ringMaterial = new THREE.MeshBasicMaterial({ color: palette.yellow, transparent: true, opacity: 0, depthWrite: false })
      const ring = new THREE.Mesh(new THREE.RingGeometry(1.0, 1.09, 72), ringMaterial)
      ring.rotation.x = -Math.PI / 2
      ring.scale.set(1.05, 2.1, 1)
      ring.position.set(0, 0.1, -0.5)
      group.add(ring)
      tween(0.9 + feedTime, 0.6, (k) => {
        ringMaterial.opacity = 0.95 * k
        if (k >= 1) rings.push(ringMaterial)
      })
    }

    // the pillar rises, then its light turns on
    tween(start, 0.7, (k) => {
      pillar.position.y = -2.2 * (1 - easeOutBack(k))
      pillar.scale.setScalar(0.6 + 0.4 * Math.min(1, k * 1.4))
    })
    tween(start + 0.45, 0.5, (k) => {
      light.intensity = 3.2 * k
      halo.material.opacity = 0.55 * k
      floor.material.opacity = 0.42 * k
    })

    // the HTML label with the text your describe returned
    const label = el('div', `cs-bay-label cs-state-${bay.state}`)
    label.title = stateName[bay.state]
    if (isLatest) label.append(el('span', 'cs-latest-badge', 'Latest'))
    label.append(el('code', 'cs-bay-text', bay.problem ? `threw: ${bay.problem}` : bay.text || '(empty string)'))
    if (bay.onlyId) label.append(el('span', 'cs-bay-wait', 'Waiting for step 1'))
    if (bay.problem) label.classList.add('cs-has-problem')
    if (isLatest) label.classList.add('cs-is-latest')
    label.hidden = true
    addLabel(new THREE.Vector3(x, 2.4, PILLAR_Z), label)
    tween(start + 0.55, 0.01, (k) => {
      label.hidden = k < 1
    })
  }

  function addCrate(label: string, bin: THREE.Group, slot: number, start: number, onLand: () => void) {
    const size = 0.48
    const crate = mesh(new RoundedBoxGeometry(size, size, size, 2, 0.05), new THREE.MeshStandardMaterial({ map: crateTexture(label), roughness: 0.7 }))
    const layer = Math.floor(slot / 4)
    const cell = slot % 4
    const tx = (cell % 2 === 0 ? -0.3 : 0.3) + (layer % 2 ? 0.08 : 0)
    const tz = (cell < 2 ? -0.3 : 0.3)
    const ty = 0.06 + size / 2 + layer * (size + 0.02)
    const spin = (slot % 2 ? 1 : -1) * (0.6 + 0.2 * cell)
    bin.add(crate)
    crate.position.set(tx, ty, tz)
    tween(start, 0.95, (k) => {
      crate.position.y = ty + (1 - easeOutBounce(k)) * 6
      crate.rotation.set(spin * (1 - k) * 2, spin * (1 - k) * 3 + 0.25 * (cell - 1.5), 0)
      crate.visible = k > 0 || reducedMotion.matches
      if (k >= 1) onLand()
    })
  }

  // ---------- caption under the stage ----------

  function renderCaption(run: Analysis) {
    caption.replaceChildren()
    const latestLine = el('p', 'cs-caption-latest')
    latestLine.append(svg('bolt'))
    if (run.latest.problem) latestLine.append(el('code', 'cs-problem-text', `latest record threw: ${run.latest.problem}`))
    else latestLine.append(el('code', '', `Latest: ${run.latest.text || '(empty string)'}`))
    caption.append(latestLine)

    const next = run.steps.find(s => !s.done)
    const status = el('p', 'cs-caption-status')
    if (run.errors.length > 0) {
      status.classList.add('is-error')
      status.append(svg('alert'), el('span', '', `Your code threw: ${run.errors.join(' / ')}`))
    } else if (next) {
      status.classList.add('is-waiting')
      status.append(svg('wait'), el('strong', '', `Waiting for step ${next.n}.`), ` ${next.hint}`)
    } else {
      status.append(svg('check'), 'All steps done: every record lands where it belongs.')
    }
    caption.append(status)
  }

  // ---------- camera, resize and the render loop ----------

  function fitCamera(width: number) {
    const halfFov = THREE.MathUtils.degToRad(camera.fov / 2)
    const horizontal = Math.atan(Math.tan(halfFov) * camera.aspect)
    distance = Math.max(13, (width / 2) / Math.tan(horizontal) * 1.02)
    placeCamera()
  }

  function placeCamera() {
    camera.position.copy(target).addScaledVector(new THREE.Vector3(0, 0.58, 1).normalize(), distance)
    camera.lookAt(target)
  }

  let lastWidth = 0
  function resize() {
    const width = stage.clientWidth
    const height = stage.clientHeight
    if (width === 0 || height === 0) return
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    if (width !== lastWidth) {
      lastWidth = width
      fitCamera(Math.max(4, Math.max(4, current.bays.length) * BAY_W + 7.6))
    }
  }

  const projected = new THREE.Vector3()
  const toScreenX = (x: number, width: number) => {
    projected.set(x, 2.4, PILLAR_Z)
    world.localToWorld(projected)
    projected.project(camera)
    return (projected.x * 0.5 + 0.5) * width
  }
  function placeLabels() {
    const width = stage.clientWidth
    const height = stage.clientHeight
    // each label stays as wide as its bay, so neighbours never overlap
    const room = Math.round(Math.min(176, Math.max(92, toScreenX(bayStep, width) - toScreenX(0, width) - 10)))
    labelLayer.style.setProperty('--cs-bay-room', `${room}px`)
    for (const { node, anchor } of labels) {
      projected.copy(anchor)
      world.localToWorld(projected)
      projected.project(camera)
      const x = (projected.x * 0.5 + 0.5) * width
      const y = (-projected.y * 0.5 + 0.5) * height
      node.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -100%)`
    }
  }

  function frame() {
    const time = now()
    const motion = !reducedMotion.matches
    tweens = tweens.filter((t) => {
      const k = Math.min(1, Math.max(0, (time - t.start) / t.duration))
      t.apply(k)
      return k < 1
    })
    for (const material of blinkers) material.emissiveIntensity = motion ? 0.35 + 1.25 * (Math.sin(time * 3.2) > 0 ? 1 : 0.15) : 1.3
    for (const { mesh: band, height } of bands) {
      const k = motion ? (time * 0.55) % 1 : 1
      band.position.y = 0.6 + height * k
      band.visible = height > 0.08
    }
    for (const material of rings) material.opacity = motion ? 0.7 + 0.25 * Math.sin(time * 1.6) : 0.95
    renderer.render(scene, camera)
    placeLabels()
    requestAnimationFrame(frame)
  }

  let current = first
  new ResizeObserver(resize).observe(stage)

  replay.addEventListener('click', () => {
    current = analyse(api)
    build(current)
    resize()
  })

  // painted words use the page fonts: wait for them before the first build
  const fonts = ['700 48px Montserrat', '700 32px "JetBrains Mono"'].map(font => document.fonts.load(font).catch(() => []))
  // never wait more than a second and a half: the car park must always appear
  const fontsOrTimeout = Promise.race([Promise.all(fonts), new Promise(resolve => setTimeout(resolve, 1500))])
  void fontsOrTimeout.then(() => {
    build(current)
    resize()
    requestAnimationFrame(frame)
  })
}
