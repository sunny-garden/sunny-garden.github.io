# Procedural Fantasy Bouquet Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current procedural rose-only scene with a complete, rotatable fantasy bouquet containing red and blue roses, foliage, white fillers, layered navy-and-cream wrapping with gold details, and a red-and-blue bow while preserving the mobile gift interaction.

**Architecture:** Keep `RoseBouquet` as the React/Framer boundary and keep direct Three.js for rendering. Move deterministic layout, geometry generation, shader materials, and model assembly into focused modules so the scene controller only owns renderer lifecycle and input. Batch repeated geometry by material class and select one of three quality tiers before constructing the model.

**Tech Stack:** React 19, TypeScript 6, Three.js 0.185, Framer Motion 12, styled-components 6, Vite 8, Vitest 4

## Global Constraints

- Preserve `RoseBouquet({ presented: boolean })` and the current home-page handoff sequence.
- Preserve one-finger rotation, pinch zoom, tap-to-bloom, keyboard controls, reduced motion, and the WebGL fallback.
- Use procedural geometry and shader inputs only; add no GLB, downloaded texture, Blender, card, letter, or card-like geometry.
- Include deliberate front, back, left, and right geometry for blooms, foliage, wrapping, and bow.
- Medium quality must retain 13 roses, complete wrapping and bow, and target 45-60 FPS on mid-range phones.
- Low quality must retain the defining red/blue dome, cream/navy wrapper, rear coverage, and bow.
- Pause rendering before presentation, while off-screen, and while the document is hidden.
- Keep the transparent canvas bounded to the existing portrait mobile stage with no horizontal overflow.
- Do not change `/proposal`, `/quiz`, the garden character, or unrelated dirty worktree files.

---

## File Map

- `src/components/home/bouquetQuality.ts`: pure capability-to-tier policy and zoom bounds.
- `src/components/home/bouquetLayout.ts`: deterministic roses, radial wrappers, filler branches, and bow definitions.
- `src/components/home/bouquetGeometry.ts`: reusable petals, stems, filler blossoms, folded paper, and thick ribbon strips.
- `src/components/home/bouquetPalette.ts`: rose and material color constants.
- `src/components/home/bouquetMaterials.ts`: procedural shader material creation and shared animated uniforms.
- `src/components/home/createBouquetModel.ts`: batched mesh assembly, bloom state, secondary motion, and model disposal.
- `src/components/home/createRoseBouquetScene.ts`: renderer, camera, observers, input, raycasting, and RAF lifecycle.
- `src/components/home/RoseBouquet.tsx`: lazy initialization, accessibility, transition, and CSS fallback.
- `src/pages/HomePage.tsx`: responsive bouquet stage sizing only.

### Task 1: Three-Tier Mobile Quality Policy

**Files:**
- Modify: `src/components/home/bouquetQuality.ts`
- Modify: `src/components/home/bouquetQuality.test.ts`

**Interfaces:**
- Consumes: `BouquetCapabilities` containing width, DPR, optional device memory, and optional hardware concurrency.
- Produces: `BouquetQualityTier`, `BouquetQuality`, `selectBouquetQuality(capabilities)`, and `clampBouquetZoom(distance)`.

- [ ] **Step 1: Replace the quality tests with failing three-tier coverage**

```ts
import { describe, expect, it } from 'vitest'
import { clampBouquetZoom, selectBouquetQuality } from './bouquetQuality'

describe('selectBouquetQuality', () => {
  it('uses low quality for constrained phones', () => {
    expect(
      selectBouquetQuality({
        width: 360,
        devicePixelRatio: 3,
        deviceMemory: 4,
        hardwareConcurrency: 4,
      }),
    ).toEqual({
      tier: 'low',
      roseCount: 11,
      petalSegments: 4,
      leafCount: 12,
      fillerCount: 8,
      wrappingPanelCount: 18,
      ribbonSegments: 8,
      sparkleCount: 8,
      dpr: 1.1,
      frameInterval: 1000 / 30,
    })
  })

  it('defaults ordinary and unknown mobile hardware to medium quality', () => {
    expect(selectBouquetQuality({ width: 390, devicePixelRatio: 3 })).toMatchObject({
      tier: 'medium',
      roseCount: 13,
      wrappingPanelCount: 24,
      dpr: 1.4,
      frameInterval: 0,
    })
  })

  it('uses high quality only when viewport and hardware are capable', () => {
    expect(
      selectBouquetQuality({
        width: 430,
        devicePixelRatio: 3,
        deviceMemory: 8,
        hardwareConcurrency: 8,
      }),
    ).toMatchObject({ tier: 'high', roseCount: 15, wrappingPanelCount: 30, dpr: 1.75 })
  })

  it('never raises the physical device pixel ratio', () => {
    expect(
      selectBouquetQuality({
        width: 430,
        devicePixelRatio: 1,
        deviceMemory: 8,
        hardwareConcurrency: 8,
      }).dpr,
    ).toBe(1)
  })
})

describe('clampBouquetZoom', () => {
  it('keeps the complete wrapper and bow inside camera-safe bounds', () => {
    expect(clampBouquetZoom(7)).toBe(9.6)
    expect(clampBouquetZoom(10.2)).toBe(10.2)
    expect(clampBouquetZoom(12)).toBe(10.9)
  })
})
```

- [ ] **Step 2: Run the focused test and verify the old two-tier policy fails**

Run: `npm test -- src/components/home/bouquetQuality.test.ts`

Expected: FAIL because the current result has `lowPower` and lacks `tier`, filler, wrapping, ribbon, and sparkle fields.

- [ ] **Step 3: Implement the three-tier policy**

```ts
export interface BouquetCapabilities {
  width: number
  devicePixelRatio: number
  deviceMemory?: number
  hardwareConcurrency?: number
}

export type BouquetQualityTier = 'low' | 'medium' | 'high'

export interface BouquetQuality {
  tier: BouquetQualityTier
  roseCount: number
  petalSegments: number
  leafCount: number
  fillerCount: number
  wrappingPanelCount: number
  ribbonSegments: number
  sparkleCount: number
  dpr: number
  frameInterval: number
}

const PROFILES: Record<BouquetQualityTier, Omit<BouquetQuality, 'tier' | 'dpr'>> = {
  low: {
    roseCount: 11,
    petalSegments: 4,
    leafCount: 12,
    fillerCount: 8,
    wrappingPanelCount: 18,
    ribbonSegments: 8,
    sparkleCount: 8,
    frameInterval: 1000 / 30,
  },
  medium: {
    roseCount: 13,
    petalSegments: 5,
    leafCount: 18,
    fillerCount: 12,
    wrappingPanelCount: 24,
    ribbonSegments: 11,
    sparkleCount: 12,
    frameInterval: 0,
  },
  high: {
    roseCount: 15,
    petalSegments: 6,
    leafCount: 24,
    fillerCount: 16,
    wrappingPanelCount: 30,
    ribbonSegments: 14,
    sparkleCount: 16,
    frameInterval: 0,
  },
}

const DPR_CAPS: Record<BouquetQualityTier, number> = { low: 1.1, medium: 1.4, high: 1.75 }

export const selectBouquetQuality = (capabilities: BouquetCapabilities): BouquetQuality => {
  const memory = capabilities.deviceMemory ?? 6
  const concurrency = capabilities.hardwareConcurrency ?? 6
  const constrained = capabilities.width <= 360 || memory <= 4 || concurrency <= 4
  const capable = capabilities.width >= 412 && memory >= 8 && concurrency >= 8
  const tier: BouquetQualityTier = constrained ? 'low' : capable ? 'high' : 'medium'

  return {
    tier,
    ...PROFILES[tier],
    dpr: Math.min(capabilities.devicePixelRatio, DPR_CAPS[tier]),
  }
}

export const clampBouquetZoom = (distance: number) => Math.min(10.9, Math.max(9.6, distance))
```

- [ ] **Step 4: Run the quality tests**

Run: `npm test -- src/components/home/bouquetQuality.test.ts`

Expected: 5 tests PASS.

- [ ] **Step 5: Commit the policy when implementation commits are authorized**

```bash
git add src/components/home/bouquetQuality.ts src/components/home/bouquetQuality.test.ts
git commit -m "Add adaptive bouquet quality tiers"
```

### Task 2: Deterministic Full-Surround Layout

**Files:**
- Create: `src/components/home/bouquetLayout.ts`
- Create: `src/components/home/bouquetLayout.test.ts`

**Interfaces:**
- Consumes: `BouquetQualityTier` from `bouquetQuality.ts`.
- Produces: `RoseDefinition`, `WrappingPanelDefinition`, `FillerDefinition`, `BowDefinition`, `BouquetLayout`, and `getBouquetLayout(tier)`.

- [ ] **Step 1: Write failing layout tests**

```ts
import { describe, expect, it } from 'vitest'
import { getBouquetLayout } from './bouquetLayout'

describe('getBouquetLayout', () => {
  it.each([
    ['low', 11, 18, 8],
    ['medium', 13, 24, 12],
    ['high', 15, 30, 16],
  ] as const)('returns complete %s-tier content', (tier, roseCount, panelCount, fillerCount) => {
    const layout = getBouquetLayout(tier)

    expect(layout.roses).toHaveLength(roseCount)
    expect(layout.wrappingPanels).toHaveLength(panelCount)
    expect(layout.fillers).toHaveLength(fillerCount)
    expect(layout.bow).toHaveLength(7)
  })

  it('alternates rose colors and covers front and back depth', () => {
    const { roses } = getBouquetLayout('high')

    roses.forEach((rose, index) => {
      expect(rose.colorRole).toBe(index % 2 === 0 ? 'crimson' : 'blue')
    })
    expect(Math.min(...roses.map((rose) => rose.position[2]))).toBeLessThan(-0.65)
    expect(Math.max(...roses.map((rose) => rose.position[2]))).toBeGreaterThan(0.65)
  })

  it('wraps all azimuths with both navy and cream paper', () => {
    const { wrappingPanels } = getBouquetLayout('medium')
    const quadrants = new Set(wrappingPanels.map((panel) => Math.floor(panel.angle / (Math.PI / 2))))

    expect(quadrants.size).toBe(4)
    expect(new Set(wrappingPanels.map((panel) => panel.colorRole))).toEqual(new Set(['navy', 'cream']))
  })

  it('contains no card or letter content', () => {
    const serialized = JSON.stringify(getBouquetLayout('high')).toLowerCase()

    expect(serialized).not.toContain('card')
    expect(serialized).not.toContain('letter')
  })
})
```

- [ ] **Step 2: Run the layout test and verify the module is missing**

Run: `npm test -- src/components/home/bouquetLayout.test.ts`

Expected: FAIL because `bouquetLayout.ts` does not exist.

- [ ] **Step 3: Add the layout types and all rose definitions**

Create `bouquetLayout.ts` with these public types and ordered definitions. The array order is the quality priority order and also enforces red/blue alternation.

```ts
import type { BouquetQualityTier } from './bouquetQuality'

type VectorTuple = readonly [number, number, number]
export type RoseColorRole = 'crimson' | 'blue'

export interface RoseDefinition {
  position: VectorTuple
  rotation: VectorTuple
  colorRole: RoseColorRole
  scale: number
  stage: number
}

export interface WrappingPanelDefinition {
  angle: number
  radius: number
  height: number
  rotation: number
  scale: readonly [number, number]
  colorRole: 'navy' | 'cream'
  phase: number
}

export interface FillerDefinition {
  position: VectorTuple
  rotation: VectorTuple
  scale: number
  phase: number
}

export interface BowDefinition {
  kind: 'loop' | 'tail' | 'knot'
  colorRole: RoseColorRole
  mirror: -1 | 0 | 1
  rotation: VectorTuple
  scale: VectorTuple
}

export interface BouquetLayout {
  roses: readonly RoseDefinition[]
  wrappingPanels: readonly WrappingPanelDefinition[]
  fillers: readonly FillerDefinition[]
  bow: readonly BowDefinition[]
}

const ROSES: readonly RoseDefinition[] = [
  { position: [0, 1.28, 0.74], rotation: [-0.11, 0, 0], colorRole: 'crimson', scale: 1.08, stage: 1 },
  { position: [-0.76, 1.43, 0.46], rotation: [-0.07, 0.15, -0.08], colorRole: 'blue', scale: 0.96, stage: 0.98 },
  { position: [0.77, 1.4, 0.44], rotation: [-0.06, -0.15, 0.08], colorRole: 'crimson', scale: 0.97, stage: 0.98 },
  { position: [-0.43, 2.02, 0.12], rotation: [0.03, 0.13, -0.05], colorRole: 'blue', scale: 0.88, stage: 0.92 },
  { position: [0.44, 1.99, 0.1], rotation: [0.03, -0.13, 0.05], colorRole: 'crimson', scale: 0.89, stage: 0.93 },
  { position: [-1.26, 1.08, 0], rotation: [-0.02, 0.26, -0.13], colorRole: 'blue', scale: 0.81, stage: 0.86 },
  { position: [1.26, 1.09, -0.02], rotation: [-0.02, -0.25, 0.13], colorRole: 'crimson', scale: 0.82, stage: 0.87 },
  { position: [-0.73, 0.68, 0.51], rotation: [-0.13, 0.18, -0.1], colorRole: 'blue', scale: 0.88, stage: 0.94 },
  { position: [0.73, 0.7, 0.49], rotation: [-0.12, -0.18, 0.1], colorRole: 'crimson', scale: 0.89, stage: 0.95 },
  { position: [-0.57, 1.48, -0.73], rotation: [0.09, 2.72, -0.05], colorRole: 'blue', scale: 0.84, stage: 0.88 },
  { position: [0.58, 1.45, -0.72], rotation: [0.09, -2.72, 0.05], colorRole: 'crimson', scale: 0.85, stage: 0.89 },
  { position: [0, 2.38, -0.2], rotation: [0.13, Math.PI, 0], colorRole: 'blue', scale: 0.76, stage: 0.8 },
  { position: [0, 0.92, -0.88], rotation: [0.08, Math.PI, 0], colorRole: 'crimson', scale: 0.82, stage: 0.86 },
  { position: [-1.05, 1.83, -0.5], rotation: [0.11, 2.42, -0.12], colorRole: 'blue', scale: 0.74, stage: 0.78 },
  { position: [1.05, 1.81, -0.49], rotation: [0.11, -2.42, 0.12], colorRole: 'crimson', scale: 0.75, stage: 0.79 },
]

const COUNTS: Record<BouquetQualityTier, { roses: number; panels: number; fillers: number }> = {
  low: { roses: 11, panels: 18, fillers: 8 },
  medium: { roses: 13, panels: 24, fillers: 12 },
  high: { roses: 15, panels: 30, fillers: 16 },
}
```

- [ ] **Step 4: Add deterministic wrapper, filler, and bow factories**

Append these definitions to the same file:

```ts
const createWrappingPanels = (count: number): WrappingPanelDefinition[] => {
  const perLayer = count / 3
  return Array.from({ length: count }, (_, index) => {
    const layer = Math.floor(index / perLayer)
    const slot = index % perLayer
    const angle = (slot / perLayer) * Math.PI * 2 + layer * 0.19
    return {
      angle,
      radius: 1.06 + layer * 0.2,
      height: -0.35 + layer * 0.5 + Math.sin(angle * 2) * 0.08,
      rotation: (slot % 2 === 0 ? -1 : 1) * (0.08 + layer * 0.025),
      scale: [0.76 + layer * 0.08, 1.62 - layer * 0.12],
      colorRole: (slot + layer) % 3 === 0 ? 'cream' : 'navy',
      phase: index * 0.47,
    }
  })
}

const createFillers = (count: number): FillerDefinition[] =>
  Array.from({ length: count }, (_, index) => {
    const angle = (index / count) * Math.PI * 2 + 0.28
    const radius = 0.72 + (index % 3) * 0.18
    return {
      position: [
        Math.cos(angle) * radius,
        1.1 + ((index * 5) % 9) * 0.17,
        Math.sin(angle) * radius,
      ] as const,
      rotation: [0.08 * Math.sin(angle), angle + Math.PI / 2, -0.14 * Math.cos(angle)] as const,
      scale: 0.13 + (index % 3) * 0.015,
      phase: index * 0.61,
    }
  })

const BOW: readonly BowDefinition[] = [
  { kind: 'loop', colorRole: 'crimson', mirror: -1, rotation: [0.08, 0.12, -0.18], scale: [1, 1, 1] },
  { kind: 'loop', colorRole: 'blue', mirror: 1, rotation: [0.08, -0.12, 0.18], scale: [1, 1, 1] },
  { kind: 'loop', colorRole: 'blue', mirror: -1, rotation: [0.14, 0.2, -0.34], scale: [0.78, 0.78, 0.78] },
  { kind: 'loop', colorRole: 'crimson', mirror: 1, rotation: [0.14, -0.2, 0.34], scale: [0.78, 0.78, 0.78] },
  { kind: 'tail', colorRole: 'crimson', mirror: -1, rotation: [0.04, 0.08, -0.08], scale: [1, 1, 1] },
  { kind: 'tail', colorRole: 'blue', mirror: 1, rotation: [0.04, -0.08, 0.08], scale: [1, 1, 1] },
  { kind: 'knot', colorRole: 'crimson', mirror: 0, rotation: [0, 0, 0], scale: [1, 1, 1] },
]

export const getBouquetLayout = (tier: BouquetQualityTier): BouquetLayout => {
  const counts = COUNTS[tier]
  return {
    roses: ROSES.slice(0, counts.roses),
    wrappingPanels: createWrappingPanels(counts.panels),
    fillers: createFillers(counts.fillers),
    bow: BOW,
  }
}
```

- [ ] **Step 5: Run the layout tests**

Run: `npm test -- src/components/home/bouquetLayout.test.ts`

Expected: 6 parameterized and direct tests PASS.

- [ ] **Step 6: Commit the layout when implementation commits are authorized**

```bash
git add src/components/home/bouquetLayout.ts src/components/home/bouquetLayout.test.ts
git commit -m "Add full-surround bouquet layout"
```

### Task 3: Wrapping, Filler, And Ribbon Geometry

**Files:**
- Modify: `src/components/home/bouquetGeometry.ts`
- Modify: `src/components/home/bouquetGeometry.test.ts`

**Interfaces:**
- Keeps: `createPetalGeometry(segments)` and `createStemGeometry(stems, curveSegments)`.
- Produces: `createFillerFlowerGeometry(segments)`, `createWrappingPanelGeometry(segments)`, and `createRibbonGeometry(kind, segments)`.

- [ ] **Step 1: Add failing geometry tests**

Replace the current `bouquetGeometry` import with one import containing the existing and new generators, then add the test block after the current tests:

```ts
import {
  createFillerFlowerGeometry,
  createPetalGeometry,
  createRibbonGeometry,
  createStemGeometry,
  createWrappingPanelGeometry,
} from './bouquetGeometry'

describe('fantasy bouquet geometry', () => {
  it('creates a five-lobed filler flower with normals and UVs', () => {
    const geometry = createFillerFlowerGeometry(3)
    expect(geometry.index).not.toBeNull()
    expect(geometry.getAttribute('position').count).toBeGreaterThanOrEqual(40)
    expect(geometry.getAttribute('normal').count).toBe(geometry.getAttribute('position').count)
    expect(geometry.getAttribute('uv').count).toBe(geometry.getAttribute('position').count)
    geometry.dispose()
  })

  it('creates a curled wrapping panel with bounded depth', () => {
    const geometry = createWrappingPanelGeometry(5)
    geometry.computeBoundingBox()
    expect(geometry.index).not.toBeNull()
    expect(geometry.boundingBox?.max.z).toBeGreaterThan(0.04)
    expect(geometry.boundingBox?.max.z).toBeLessThan(0.3)
    geometry.dispose()
  })

  it.each(['loop', 'tail', 'knot'] as const)('creates a thick %s ribbon part', (kind) => {
    const geometry = createRibbonGeometry(kind, 8)
    geometry.computeBoundingBox()
    expect(geometry.index).not.toBeNull()
    expect(geometry.getAttribute('normal').count).toBe(geometry.getAttribute('position').count)
    expect((geometry.boundingBox?.max.z ?? 0) - (geometry.boundingBox?.min.z ?? 0)).toBeGreaterThan(0.02)
    geometry.dispose()
  })
})
```

- [ ] **Step 2: Run the geometry tests and verify missing exports**

Run: `npm test -- src/components/home/bouquetGeometry.test.ts`

Expected: FAIL because the three new geometry functions do not exist.

- [ ] **Step 3: Implement the filler flower geometry**

Add the function below to `bouquetGeometry.ts`. It builds five curved lobes into one indexed mesh.

```ts
export const createFillerFlowerGeometry = (segments: number) => {
  const geometry = new BufferGeometry()
  const positions: number[] = []
  const uvs: number[] = []
  const indices: number[] = []

  for (let petal = 0; petal < 5; petal += 1) {
    const angle = (petal / 5) * Math.PI * 2
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    const offset = positions.length / 3

    for (let row = 0; row <= segments; row += 1) {
      const v = row / segments
      const radius = v * 0.62
      const halfWidth = Math.sin(v * Math.PI) * 0.24
      const curl = Math.sin(v * Math.PI) * 0.1 + v * v * 0.08
      for (let sideIndex = 0; sideIndex < 2; sideIndex += 1) {
        const side = sideIndex === 0 ? -1 : 1
        const localX = side * halfWidth
        const localY = radius
        positions.push(localX * cos - localY * sin, localX * sin + localY * cos, curl)
        uvs.push(sideIndex, v)
      }
    }

    for (let row = 0; row < segments; row += 1) {
      const first = offset + row * 2
      indices.push(first, first + 2, first + 1, first + 1, first + 2, first + 3)
    }
  }

  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  geometry.computeBoundingSphere()
  return geometry
}
```

- [ ] **Step 4: Implement folded wrapping panel geometry**

```ts
export const createWrappingPanelGeometry = (segments: number) => {
  const geometry = new BufferGeometry()
  const positions: number[] = []
  const uvs: number[] = []
  const indices: number[] = []

  for (let row = 0; row <= segments; row += 1) {
    const v = row / segments
    const halfWidth = 0.48 - v * 0.16
    for (let column = 0; column <= segments; column += 1) {
      const u = column / segments
      const side = u * 2 - 1
      const fold = Math.abs(side) * 0.08 + side * side * (0.05 + v * 0.07)
      const rimCurl = Math.pow(v, 5) * (0.05 + Math.abs(side) * 0.08)
      positions.push(side * halfWidth, v, fold + rimCurl)
      uvs.push(u, v)
    }
  }

  for (let row = 0; row < segments; row += 1) {
    for (let column = 0; column < segments; column += 1) {
      const first = row * (segments + 1) + column
      const next = first + segments + 1
      indices.push(first, next, first + 1, first + 1, next, next + 1)
    }
  }

  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  geometry.computeBoundingSphere()
  return geometry
}
```

- [ ] **Step 5: Implement thick loop, tail, and knot ribbon geometry**

Add `Vector2` to the Three.js imports, then add this function. Four vertices per centerline sample produce front, back, and edge faces, avoiding a paper-thin side view.

```ts
export type RibbonKind = 'loop' | 'tail' | 'knot'

export const createRibbonGeometry = (kind: RibbonKind, segments: number) => {
  const geometry = new BufferGeometry()
  const positions: number[] = []
  const uvs: number[] = []
  const indices: number[] = []
  const samples = kind === 'knot' ? Math.max(6, segments) : segments
  const center = (t: number) => {
    if (kind === 'loop') {
      return new Vector3(Math.sin(Math.PI * t) * 0.92, Math.sin(Math.PI * 2 * t) * 0.24, Math.sin(Math.PI * t) * 0.28)
    }
    if (kind === 'tail') {
      return new Vector3(t * 0.34 + Math.sin(t * Math.PI * 1.5) * 0.08, -t * 1.52, Math.sin(Math.PI * t) * 0.14)
    }
    return new Vector3((t - 0.5) * 0.46, Math.sin(t * Math.PI) * 0.1, Math.sin(t * Math.PI) * 0.09)
  }

  for (let index = 0; index <= samples; index += 1) {
    const t = index / samples
    const previous = center(Math.max(0, t - 1 / samples))
    const next = center(Math.min(1, t + 1 / samples))
    const tangent = next.sub(previous).normalize()
    const side = new Vector2(-tangent.y, tangent.x).normalize()
    const width = kind === 'knot' ? 0.48 : kind === 'loop' ? 0.34 - Math.abs(t - 0.5) * 0.08 : 0.28 - t * 0.07
    const thickness = 0.035
    const point = center(t)
    positions.push(
      point.x + side.x * width, point.y + side.y * width, point.z + thickness,
      point.x - side.x * width, point.y - side.y * width, point.z + thickness,
      point.x + side.x * width, point.y + side.y * width, point.z - thickness,
      point.x - side.x * width, point.y - side.y * width, point.z - thickness,
    )
    uvs.push(0, t, 1, t, 0, t, 1, t)
  }

  for (let index = 0; index < samples; index += 1) {
    const first = index * 4
    const next = first + 4
    indices.push(
      first, next, first + 1, first + 1, next, next + 1,
      first + 2, first + 3, next + 2, first + 3, next + 3, next + 2,
      first, first + 2, next, first + 2, next + 2, next,
      first + 1, next + 1, first + 3, first + 3, next + 1, next + 3,
    )
  }

  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  geometry.computeBoundingSphere()
  return geometry
}
```

- [ ] **Step 6: Run geometry tests and the TypeScript build**

Run: `npm test -- src/components/home/bouquetGeometry.test.ts && npx tsc -b`

Expected: all bouquet geometry tests PASS and TypeScript exits with no diagnostics.

- [ ] **Step 7: Commit the geometry when implementation commits are authorized**

```bash
git add src/components/home/bouquetGeometry.ts src/components/home/bouquetGeometry.test.ts
git commit -m "Add wrapping and ribbon geometry"
```

### Task 4: Procedural Palette And Material Factory

**Files:**
- Modify: `src/components/home/bouquetPalette.ts`
- Modify: `src/components/home/bouquetPalette.test.ts`
- Create: `src/components/home/bouquetMaterials.ts`
- Create: `src/components/home/bouquetMaterials.test.ts`

**Interfaces:**
- Produces: `ROSE_PALETTE`, `MATERIAL_PALETTE`, `BouquetMaterials`, and `createBouquetMaterials()`.
- `BouquetMaterials` exposes one shared `time` uniform, one petal material, foliage/filler materials, navy/cream paper materials, red/blue ribbon materials, and a glow material.

- [ ] **Step 1: Replace the palette tests with reference-specific invariants**

```ts
import { Color } from 'three'
import { describe, expect, it } from 'vitest'
import { MATERIAL_PALETTE, ROSE_PALETTE } from './bouquetPalette'

describe('bouquet palettes', () => {
  it('keeps crimson red-dominant and royal blue blue-dominant', () => {
    ROSE_PALETTE.crimson.forEach((hex) => {
      const color = new Color(hex)
      expect(color.r).toBeGreaterThan(color.g * 3)
      expect(color.r).toBeGreaterThan(color.b * 1.8)
    })
    ROSE_PALETTE.blue.forEach((hex) => {
      const color = new Color(hex)
      expect(color.b).toBeGreaterThan(color.r * 1.8)
      expect(color.b).toBeGreaterThan(color.g * 1.2)
    })
  })

  it('keeps wrapping, foliage, filler, and gold roles distinct', () => {
    expect(new Color(MATERIAL_PALETTE.navy).getHex()).not.toBe(new Color(MATERIAL_PALETTE.blueRibbon).getHex())
    expect(new Color(MATERIAL_PALETTE.cream).r).toBeGreaterThan(0.7)
    expect(new Color(MATERIAL_PALETTE.leaf).g).toBeGreaterThan(new Color(MATERIAL_PALETTE.leaf).r)
    expect(new Color(MATERIAL_PALETTE.filler).r).toBeGreaterThan(0.85)
    expect(new Color(MATERIAL_PALETTE.gold).r).toBeGreaterThan(new Color(MATERIAL_PALETTE.gold).b)
  })
})
```

- [ ] **Step 2: Add a failing no-texture material contract test**

```ts
import { ShaderMaterial } from 'three'
import { describe, expect, it } from 'vitest'
import { createBouquetMaterials } from './bouquetMaterials'

describe('createBouquetMaterials', () => {
  it('creates procedural materials without texture samplers', () => {
    const materials = createBouquetMaterials()
    const shaders = materials.owned.flatMap((material) =>
      material instanceof ShaderMaterial ? [material.vertexShader, material.fragmentShader] : [],
    )

    expect(shaders.join('\n')).not.toContain('sampler2D')
    expect(materials.paperNavy.fragmentShader).toContain('uGoldStrength')
    expect(materials.ribbonRed.fragmentShader).toContain('uSatinStrength')
    materials.dispose()
  })
})
```

- [ ] **Step 3: Run the focused tests and verify the new exports are missing**

Run: `npm test -- src/components/home/bouquetPalette.test.ts src/components/home/bouquetMaterials.test.ts`

Expected: FAIL because `MATERIAL_PALETTE` and `bouquetMaterials.ts` do not exist.

- [ ] **Step 4: Add the complete reference palette**

```ts
export const ROSE_PALETTE = {
  crimson: ['#b80e1a', '#ca1327', '#9e0b18', '#d11a2f'],
  blue: ['#2346b0', '#2d55c7', '#1f3994', '#365ed0'],
} as const

export const MATERIAL_PALETTE = {
  leaf: '#173b2d',
  stem: '#204936',
  filler: '#fffaf0',
  fillerCenter: '#d7b56d',
  navy: '#1b2a4d',
  cream: '#e6ddea',
  gold: '#c9a46a',
  redRibbon: '#8b0e1a',
  blueRibbon: '#203c8c',
} as const
```

- [ ] **Step 5: Create the material factory and move shader ownership out of the scene controller**

Create `bouquetMaterials.ts` with this contract:

```ts
import * as THREE from 'three'
import { MATERIAL_PALETTE } from './bouquetPalette'

export interface BouquetMaterials {
  time: { value: number }
  petal: THREE.ShaderMaterial
  stem: THREE.ShaderMaterial
  leaf: THREE.ShaderMaterial
  filler: THREE.ShaderMaterial
  fillerCenter: THREE.ShaderMaterial
  paperNavy: THREE.ShaderMaterial
  paperCream: THREE.ShaderMaterial
  ribbonRed: THREE.ShaderMaterial
  ribbonBlue: THREE.ShaderMaterial
  glow: THREE.ShaderMaterial
  owned: THREE.Material[]
  dispose: () => void
}
```

Move the current petal, stem, leaf, and glow shader strings from `createRoseBouquetScene.ts` into this module. Keep the existing bloom attributes and illustrated warm-key/cool-fill/ground-bounce model. Add one surface vertex shader with `aPhase`, optional instancing guarded by `#ifdef USE_INSTANCING`, `uTime`, and `uMotionStrength`, plus one procedural surface fragment shader with uniforms `uBaseColor`, `uRoughness`, `uGoldStrength`, and `uSatinStrength`. Instanced wrapping adds `instancePhase`; merged ribbon geometry adds per-vertex `aPhase`; non-animated filler surfaces set both phase sources to zero.

Use these exact procedural material rules in the surface fragment shader:

```glsl
float fiber = sin(vUv.y * 94.0 + sin(vUv.x * 37.0) * 2.0) * 0.018;
float goldVein = smoothstep(0.965, 1.0, sin(vUv.x * 31.0 + vUv.y * 17.0) * sin(vUv.y * 43.0));
float goldFleck = step(0.992, fract(sin(dot(floor(vUv * 46.0), vec2(12.9898, 78.233))) * 43758.5453));
float wrappedKey = clamp(dot(normal, lightDirection) * 0.55 + 0.45, 0.0, 1.0);
float specular = pow(max(dot(reflect(-lightDirection, normal), viewDirection), 0.0), mix(54.0, 12.0, uRoughness));
float satin = pow(max(0.0, 1.0 - abs(dot(normal, viewDirection))), 3.0) * uSatinStrength;
vec3 gold = vec3(0.58, 0.36, 0.14) + specular * vec3(0.9, 0.65, 0.28);
vec3 color = uBaseColor * (0.42 + wrappedKey * 0.58 + fiber);
color = mix(color, gold, clamp((goldVein * 0.7 + goldFleck) * uGoldStrength, 0.0, 0.72));
color += vec3(specular * (1.0 - uRoughness) * 0.24 + satin * 0.18);
```

Construct `paperNavy` with gold strength `0.7`, roughness `0.82`, and no satin; `paperCream` with gold strength `0`, roughness `0.88`, and no satin; ribbon materials with gold strength `0`, roughness `0.3`, and satin strength `0.75`. Set all folded surfaces to `THREE.DoubleSide`, share the same `time` uniform object, return every material in `owned`, and implement `dispose()` as `owned.forEach((material) => material.dispose())`.

- [ ] **Step 6: Run material and palette tests**

Run: `npm test -- src/components/home/bouquetPalette.test.ts src/components/home/bouquetMaterials.test.ts`

Expected: all palette and material contract tests PASS.

- [ ] **Step 7: Commit the materials when implementation commits are authorized**

```bash
git add src/components/home/bouquetPalette.ts src/components/home/bouquetPalette.test.ts src/components/home/bouquetMaterials.ts src/components/home/bouquetMaterials.test.ts
git commit -m "Add procedural fantasy bouquet materials"
```

### Task 5: Batched Complete Bouquet Model

**Files:**
- Create: `src/components/home/createBouquetModel.ts`
- Create: `src/components/home/createBouquetModel.test.ts`

**Interfaces:**
- Consumes: `BouquetQuality`, `BouquetLayout`, all geometry generators, palettes, and `createBouquetMaterials()`.
- Produces: `createBouquetModel({ quality, layout })` returning `BouquetModel`.
- `BouquetModel` exposes `group`, `petals`, `petalRoseIds`, `triggerRose(index)`, `update(time, delta)`, `hasActiveBloom()`, and `dispose()`.

- [ ] **Step 1: Write a failing model assembly test**

```ts
import { describe, expect, it } from 'vitest'
import { getBouquetLayout } from './bouquetLayout'
import { selectBouquetQuality } from './bouquetQuality'
import { createBouquetModel } from './createBouquetModel'

describe('createBouquetModel', () => {
  it('batches every visible material class into a complete model', () => {
    const quality = selectBouquetQuality({ width: 390, devicePixelRatio: 3 })
    const model = createBouquetModel({ quality, layout: getBouquetLayout(quality.tier) })
    const names = model.group.children.map((child) => child.name)

    expect(names).toEqual(expect.arrayContaining([
      'rose-petals',
      'rose-stems',
      'foliage',
      'filler-branches',
      'filler-petals',
      'filler-centers',
      'paper-navy',
      'paper-cream',
      'ribbon-red',
      'ribbon-blue',
      'bloom-glow',
    ]))
    expect(model.group.children.length).toBeLessThanOrEqual(14)
    expect(model.petalRoseIds.length).toBe(model.petals.count)
    model.dispose()
  })

  it('updates and decays one rose bloom without rebuilding geometry', () => {
    const quality = selectBouquetQuality({ width: 390, devicePixelRatio: 3 })
    const model = createBouquetModel({ quality, layout: getBouquetLayout(quality.tier) })
    const petalGeometry = model.petals.geometry

    model.triggerRose(2)
    expect(model.hasActiveBloom()).toBe(true)
    model.update(1, 16)
    expect(model.petals.geometry).toBe(petalGeometry)

    for (let index = 0; index < 400; index += 1) model.update(1 + index / 60, 16)
    expect(model.hasActiveBloom()).toBe(false)
    model.dispose()
  })
})
```

- [ ] **Step 2: Run the model test and verify the module is missing**

Run: `npm test -- src/components/home/createBouquetModel.test.ts`

Expected: FAIL because `createBouquetModel.ts` does not exist.

- [ ] **Step 3: Define the model API and resource ownership**

```ts
import * as THREE from 'three'
import type { BouquetLayout } from './bouquetLayout'
import type { BouquetQuality } from './bouquetQuality'

export interface CreateBouquetModelOptions {
  quality: BouquetQuality
  layout: BouquetLayout
}

export interface BouquetModel {
  group: THREE.Group
  petals: THREE.InstancedMesh
  petalRoseIds: Uint16Array
  triggerRose: (roseIndex: number) => void
  update: (time: number, delta: number) => void
  hasActiveBloom: () => boolean
  dispose: () => void
}
```

- [ ] **Step 4: Assemble the model in material-class batches**

Implement `createBouquetModel` with these exact batches and ownership rules:

1. Build all rose petals into one `InstancedMesh` using `createPetalGeometry(quality.petalSegments)`. Preserve `instancePhase`, `instanceOpen`, `instanceBloom`, `instanceColor`, and `petalRoseIds` exactly once per petal. Use five rings `[5, 7, 9, 11, 13]`, truncating outer rings by each rose's `stage`.
2. Build rose stems as one mesh with the existing `createStemGeometry` and place leaves in one instanced mesh. Distribute `quality.leafCount` leaves around front and rear roses rather than only the first visible roses.
3. Build filler branches as a second merged stem mesh ending at every `layout.fillers` position. Build filler petals from one instanced `createFillerFlowerGeometry(3)` and centers from one instanced low-segment sphere.
4. Build two wrapping `InstancedMesh` objects from `createWrappingPanelGeometry(quality.petalSegments)`: one navy and one cream. Clone the base geometry for each material batch before attaching its count-specific `instancePhase` attribute. Convert each definition's angle into `x = cos(angle) * radius`, `z = sin(angle) * radius`, orient the local panel inward with `rotation.y = -angle + Math.PI / 2`, and apply the definition's height, rotation, scale, and phase.
5. Build loop, tail, and knot ribbon geometry with `createRibbonGeometry(kind, quality.ribbonSegments)`. Merge transformed vertex/index data by red or blue role into at most two ribbon meshes named `ribbon-red` and `ribbon-blue`; place the bow group at `[0, -1.42, 1.02]` so it remains below the rose dome and visible from the front.
6. Build one glow point layer with one point per rose and `quality.sparkleCount` additional deterministic points around filler tips. Keep depth writing disabled and additive blending enabled.
7. Add batches to `group` in this order so translucent petals and glows render last: stems, filler branches, wrapping, ribbons, foliage, filler centers, filler petals, rose petals, glow.

Use these exact names: `rose-petals`, `rose-stems`, `foliage`, `filler-branches`, `filler-petals`, `filler-centers`, `paper-navy`, `paper-cream`, `ribbon-red`, `ribbon-blue`, and `bloom-glow`.

Do not use `BufferGeometryUtils`; add a local `appendTransformedGeometry(targetArrays, geometry, matrix)` function that copies transformed positions/normals/UVs and offsets indices. This keeps the dependency list unchanged and lets both ribbon colors remain one draw call each.

- [ ] **Step 5: Implement secondary motion and bloom decay**

Use the shared material `time` uniform for leaf, filler, wrapping edge, and ribbon-tail vertex movement. `update(time, delta)` must set that uniform, decay each bloom by `Math.pow(0.966, delta / 16)`, write rose bloom values into the petal `instanceBloom` buffer, update glow strengths, and mark only those two dynamic attributes for upload. Treat values below `0.001` as zero so `hasActiveBloom()` eventually returns false.

`triggerRose(index)` must ignore out-of-range values, set the selected rose response to `1`, update the two dynamic attributes immediately, and never allocate geometry or materials.

`dispose()` must dispose every geometry exactly once and call `materials.dispose()`. Do not dispose geometry through both the mesh loop and local references; maintain `ownedGeometries: Set<THREE.BufferGeometry>` and iterate the set once.

- [ ] **Step 6: Run the model tests and all pure bouquet tests**

Run: `npm test -- src/components/home/createBouquetModel.test.ts src/components/home/bouquetLayout.test.ts src/components/home/bouquetGeometry.test.ts src/components/home/bouquetMaterials.test.ts`

Expected: all focused tests PASS with no WebGL context required.

- [ ] **Step 7: Commit the model when implementation commits are authorized**

```bash
git add src/components/home/createBouquetModel.ts src/components/home/createBouquetModel.test.ts
git commit -m "Build complete batched bouquet model"
```

### Task 6: Scene Lifecycle And Preserved Interaction

**Files:**
- Modify: `src/components/home/createRoseBouquetScene.ts`

**Interfaces:**
- Consumes: `selectBouquetQuality`, `getBouquetLayout`, and `createBouquetModel`.
- Preserves: `createRoseBouquetScene(options): RoseBouquetScene`, `setPresented(presented)`, and `dispose()`.

- [ ] **Step 1: Replace inline geometry and shader assembly with the model boundary**

At scene initialization, use:

```ts
const navigatorWithMemory = navigator as Navigator & { deviceMemory?: number }
const quality = selectBouquetQuality({
  width: window.innerWidth,
  devicePixelRatio: window.devicePixelRatio || 1,
  deviceMemory: navigatorWithMemory.deviceMemory,
  hardwareConcurrency: navigator.hardwareConcurrency,
})
const layout = getBouquetLayout(quality.tier)
const model = createBouquetModel({ quality, layout })
const bouquet = model.group
bouquet.rotation.x = -0.025
scene.add(bouquet)
```

Delete shader strings, rose constants, and inline mesh-building code now owned by `bouquetMaterials.ts`, `bouquetLayout.ts`, and `createBouquetModel.ts`. Keep the renderer configured with transparent alpha, antialiasing, capped DPR, sRGB output, neutral tone mapping, and exposure `1.08`.

- [ ] **Step 2: Reframe the complete wrapper and bow**

Use a `PerspectiveCamera(34, 0.8, 0.1, 32)`, target `[0, 0.1, 0]`, initial distance `10.25`, and zoom clamping from Task 1. Continue updating camera aspect from the actual host dimensions in `ResizeObserver`.

- [ ] **Step 3: Route animation and rose picking through `BouquetModel`**

Inside `tick`, retain drag inertia and camera easing, then call:

```ts
const timeSeconds = time * 0.001
model.update(timeSeconds, delta)
render()
```

Raycast against `model.petals`. Convert `hit.instanceId` with `model.petalRoseIds[hit.instanceId]` and call `model.triggerRose(roseIndex)`. Keyboard Enter and Space trigger rose zero. `shouldAnimate()` remains true only when presented, intersecting, visible, not reduced-motion, and either settled motion is enabled or a bloom/rotation/zoom response remains active.

- [ ] **Step 4: Preserve touch intent and accessibility behavior**

Keep the current 6 px horizontal intent threshold, `touch-action: pan-y`, pointer capture, two-pointer pinch baseline, damped rotation velocity, and keyboard controls. Keep reduced motion interaction-driven: after rotation, zoom, or bloom input, update the target immediately, call `model.update(0, 0)`, and render once without starting continuous RAF.

- [ ] **Step 5: Preserve pause/resume and complete cleanup**

Keep `ResizeObserver`, `IntersectionObserver`, `visibilitychange`, and reduced-motion media query listeners. In `dispose()`, cancel RAF, disconnect observers, remove every listener, release active captures, clear the pointer map, call `model.dispose()`, remove the model group, call `renderer.dispose()`, and call `renderer.forceContextLoss()`.

- [ ] **Step 6: Type-check and run all tests**

Run: `npm test && npx tsc -b`

Expected: all Vitest tests PASS and TypeScript exits with no diagnostics.

- [ ] **Step 7: Commit the scene integration when implementation commits are authorized**

```bash
git add src/components/home/createRoseBouquetScene.ts
git commit -m "Integrate complete bouquet scene"
```

### Task 7: Mobile React Fallback And Final Framing

**Files:**
- Modify: `src/components/home/RoseBouquet.tsx`
- Modify: `src/pages/HomePage.tsx:215-247`

**Interfaces:**
- Preserves: `RoseBouquet({ presented: boolean })`.
- Updates: accessible bouquet description, interaction instructions, fallback silhouette, and responsive stage bounds.

- [ ] **Step 1: Update the accessible label and instructions**

Use this label:

```tsx
aria-label={presented ? 'A touch-interactive wrapped bouquet of royal-blue and deep-red roses' : undefined}
```

Use this instruction text:

```tsx
Drag sideways or use left and right arrow keys to turn the wrapped bouquet. Pinch, use up and down arrow keys, or use plus and minus to zoom. Tap a rose, or press Enter, to make it bloom.
```

- [ ] **Step 2: Replace the rose-only CSS fallback with a wrapped bouquet fallback**

Keep the fallback decorative and `aria-hidden`. Add two layered paper shapes behind the existing red and blue rose circles, a green foliage fan, and a two-color bow at the base using styled spans and pseudo-elements. Use only `MATERIAL_PALETTE`-matching literal colors: navy `#1b2a4d`, cream `#e6ddea`, crimson `#b80e1a`, blue `#2346b0`, green `#173b2d`, and gold `#c9a46a`. The fallback must stay inside `inset: 8% 4% 4%` and must not contain visible text.

- [ ] **Step 3: Tune the portrait stage for narrow phones**

In `HomePage.tsx`, keep desktop placement unchanged. Replace the two mobile width rules with:

```css
@media (max-width: 720px) {
  --bouquet-handoff-x: clamp(-38px, -5vw, -18px);

  right: -2vw;
  left: auto;
  bottom: 1vh;
  width: min(68vw, 320px);
}

@media (max-width: 420px) {
  right: -3vw;
  width: min(70vw, 286px);
}
```

Keep the short-height rule bounded by `min(60vw, 270px)` so the button remains reachable.

- [ ] **Step 4: Run automated verification**

Run: `npm test`

Expected: all Vitest tests PASS.

Run: `npm run lint`

Expected: ESLint exits with no errors in changed source.

Run: `npm run build`

Expected: TypeScript and the Vite production build PASS; the lazy Three.js scene remains a separate output chunk.

- [ ] **Step 5: Perform mobile smoke checks**

Run: `npm run dev -- --host 127.0.0.1`

Check `360x640`, `390x844`, and `430x932` viewports. At each viewport confirm:

- `document.documentElement.scrollWidth === window.innerWidth`.
- Before presentation, no continuous bouquet RAF work is visible in the performance timeline.
- After presentation, the rose dome, cream/navy wrapper, gold details, bow knot, both bow colors, and rear panels remain visible while rotating through 360 degrees.
- One-finger vertical movement does not become bouquet rotation.
- Horizontal drag rotates with inertia, pinch stays inside camera bounds, and tapping multiple roses produces independent bloom responses.
- Backgrounding the tab and moving the canvas off-screen pause rendering.
- Reduced-motion emulation shows a stable bouquet and still permits direct rotation, zoom, and bloom renders.
- WebGL logs no shader compilation or context errors.
- A mid-range performance profile sustains 45-60 FPS during idle breathing and drag rotation at `390x844`.

- [ ] **Step 6: Review final scope and bundle output**

Run: `git status --short && git diff --stat && git diff -- src/components/home src/pages/HomePage.tsx package.json`

Expected: source changes are limited to the bouquet modules and responsive bouquet stage; no model or texture assets and no unrelated worktree files are included.

- [ ] **Step 7: Commit the React and framing changes when implementation commits are authorized**

```bash
git add src/components/home/RoseBouquet.tsx src/pages/HomePage.tsx
git commit -m "Finish mobile fantasy bouquet experience"
```
