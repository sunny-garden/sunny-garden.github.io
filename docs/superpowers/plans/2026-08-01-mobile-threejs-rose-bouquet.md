# Mobile Three.js Rose Bouquet Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current SVG flower with a compact, interactive, mobile-optimized Three.js banquet bouquet of red and blue roses while preserving the existing Framer handoff animation.

**Architecture:** Keep `RoseBouquet` as the React/Framer boundary and place the imperative renderer in a focused scene module. Batch petals, stems, foliage, and glows into four draw calls, use procedural shaders with no textures, and isolate deterministic quality selection in a pure helper that can be unit tested.

**Tech Stack:** React 19, TypeScript 6, Three.js, Framer Motion 12, styled-components 6, Vite 8, Vitest

## Global Constraints

- Preserve `RoseBouquet({ presented: boolean })` and the existing home-page handoff sequence.
- Keep the transparent canvas inside the current responsive bouquet stage without horizontal overflow.
- Use no texture or model assets, no post-processing, and no React Three Fiber dependency.
- Target four scene draw calls: petals, stems, foliage, and tap glows.
- Pause rendering while hidden or off-screen and render statically for reduced motion.
- Dispose all Three.js resources, observers, listeners, and animation frames on unmount.
- Do not modify unrelated dirty worktree files.

---

### Task 1: Quality Policy And Dependencies

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/components/home/bouquetQuality.ts`
- Create: `src/components/home/bouquetQuality.test.ts`

**Interfaces:**
- Consumes: browser capability values supplied as plain numbers.
- Produces: `selectBouquetQuality(capabilities: BouquetCapabilities): BouquetQuality`.

- [ ] **Step 1: Install runtime and test dependencies**

Run: `npm install three && npm install --save-dev @types/three vitest`

Expected: `three`, `@types/three`, and `vitest` appear in the lockfile with no audit-blocking install error.

- [ ] **Step 2: Add a test script and write failing policy tests**

Add `"test": "vitest run"` to `scripts`, then create tests covering a capable desktop, a constrained phone, and the DPR cap:

```ts
import { describe, expect, it } from 'vitest'
import { selectBouquetQuality } from './bouquetQuality'

describe('selectBouquetQuality', () => {
  it('uses full geometry on a capable device', () => {
    expect(selectBouquetQuality({ width: 900, devicePixelRatio: 2, deviceMemory: 8, hardwareConcurrency: 8 })).toMatchObject({ lowPower: false, roseCount: 13, dpr: 1.75 })
  })

  it('reduces geometry and cadence on constrained phones', () => {
    expect(selectBouquetQuality({ width: 360, devicePixelRatio: 3, deviceMemory: 2, hardwareConcurrency: 4 })).toMatchObject({ lowPower: true, roseCount: 9, dpr: 1.25, frameInterval: 1000 / 30 })
  })

  it('never raises the physical device pixel ratio', () => {
    expect(selectBouquetQuality({ width: 900, devicePixelRatio: 1, deviceMemory: 8, hardwareConcurrency: 8 }).dpr).toBe(1)
  })
})
```

- [ ] **Step 3: Run the focused test and verify failure**

Run: `npm test -- src/components/home/bouquetQuality.test.ts`

Expected: FAIL because `bouquetQuality.ts` does not exist.

- [ ] **Step 4: Implement the quality policy**

```ts
export interface BouquetCapabilities {
  width: number
  devicePixelRatio: number
  deviceMemory?: number
  hardwareConcurrency?: number
}

export interface BouquetQuality {
  lowPower: boolean
  roseCount: number
  petalSegments: number
  leafCount: number
  dpr: number
  frameInterval: number
}

export const selectBouquetQuality = (capabilities: BouquetCapabilities): BouquetQuality => {
  const lowPower = capabilities.width <= 430 || (capabilities.deviceMemory ?? 8) <= 4 || (capabilities.hardwareConcurrency ?? 8) <= 4
  return {
    lowPower,
    roseCount: lowPower ? 9 : 13,
    petalSegments: lowPower ? 4 : 6,
    leafCount: lowPower ? 8 : 12,
    dpr: Math.min(capabilities.devicePixelRatio, lowPower ? 1.25 : 1.75),
    frameInterval: lowPower ? 1000 / 30 : 0,
  }
}
```

- [ ] **Step 5: Run the focused test**

Run: `npm test -- src/components/home/bouquetQuality.test.ts`

Expected: 3 tests PASS.

### Task 2: Batched Three.js Scene

**Files:**
- Create: `src/components/home/createRoseBouquetScene.ts`

**Interfaces:**
- Consumes: `createRoseBouquetScene({ canvas, host, reducedMotion, presented })`.
- Produces: `RoseBouquetScene` with `setPresented(value: boolean)` and `dispose()`.
- Uses: `selectBouquetQuality` from Task 1.

- [ ] **Step 1: Define the controller contract and deterministic bouquet data**

Create the exported options and controller interfaces, a fixed array of 13 bloom positions/colors/stages, and a fixed foliage layout. Slice these arrays using the selected quality rather than generating random values at runtime.

```ts
export interface RoseBouquetSceneOptions {
  canvas: HTMLCanvasElement
  host: HTMLElement
  reducedMotion: boolean
  presented: boolean
}

export interface RoseBouquetScene {
  setPresented: (presented: boolean) => void
  dispose: () => void
}
```

- [ ] **Step 2: Build one reusable curled-petal geometry and petal instances**

Generate a small indexed UV grid. Shape each vertex into a tapered petal with a cupped center and curled rim. Build concentric rose rings into one `InstancedMesh`, storing per-instance `instanceColor`, `instancePhase`, `instanceRose`, and mutable `instanceBloom` attributes. Keep a parallel `petalRoseIds: number[]` so raycast `instanceId` maps directly to a bloom.

- [ ] **Step 3: Add the lightweight petal shader**

The vertex shader applies breathing and bloom opening without rebuilding matrices. The fragment shader derives veins from UV coordinates, combines ambient and directional diffuse terms, adds a restrained `pow(1.0 - abs(dot(normal, viewDirection)), 3.0)` Fresnel edge, and keeps alpha between `0.86` and `0.98`. It must not sample textures or loop per fragment.

- [ ] **Step 4: Build batched stems, instanced leaves, and point glows**

Create all curved stem vertices in one indexed `BufferGeometry`, with a normalized height and phase attribute for sway. Create one low-poly leaf geometry and instance it along stems. Create one `Points` object with a position and mutable glow strength per rose; use `gl_PointCoord` for a soft radial sprite.

- [ ] **Step 5: Implement adaptive lifecycle rendering**

Use a transparent antialiased `WebGLRenderer`, quality-capped DPR, `ResizeObserver`, `IntersectionObserver`, `visibilitychange`, and `matchMedia('(prefers-reduced-motion: reduce)')`. Start RAF only when presented, intersecting, visible, and not reduced-motion. For reduced motion, render only after resize, presentation changes, and interactions. Throttle low-power mode to 30 FPS.

- [ ] **Step 6: Implement touch-safe interactions**

Track active pointers. Begin one-pointer rotation only after horizontal movement exceeds 6 px and vertical intent; apply velocity with damping after release. With two pointers, adjust target camera distance clamped to `9.3..10.5`. On a stationary release, raycast petals and set the selected rose's bloom/glow response to 1. Use `touch-action: pan-y` on the host so ordinary vertical page scrolling remains native.

- [ ] **Step 7: Implement complete cleanup**

`dispose()` must cancel RAF, disconnect both observers, remove media/document/pointer listeners, dispose every geometry and material once, call `renderer.dispose()` and `renderer.forceContextLoss()`, and clear references held by pointer maps.

- [ ] **Step 8: Type-check the scene**

Run: `npx tsc -b`

Expected: PASS with no diagnostics.

### Task 3: React And Framer Integration

**Files:**
- Replace: `src/components/home/RoseBouquet.tsx`
- Modify: `src/pages/HomePage.tsx:215-247`

**Interfaces:**
- Consumes: `createRoseBouquetScene` from Task 2 and existing `{ presented }` prop.
- Produces: the same default `RoseBouquet` component imported by `HomePage`.

- [ ] **Step 1: Replace the SVG wrapper with the canvas host**

Use `useRef`, `useEffect`, `useReducedMotion`, and `motion.div`. Initialize the scene once after both refs exist, forward later `presented` values through `setPresented`, and dispose on unmount. Catch renderer initialization failure and display a CSS fallback emblem. Label the host `A touch-interactive bouquet of red and blue roses` and include visually hidden instructions.

- [ ] **Step 2: Preserve presentation animation and responsive bounds**

Animate host opacity and scale with Framer, collapsing duration for reduced motion. Give the host `width: 100%`, `aspect-ratio: 4 / 5`, `max-width: 100%`, `overflow: hidden`, `contain: layout paint size`, and `touch-action: pan-y`. Set the canvas to `display: block; width: 100%; height: 100%`.

- [ ] **Step 3: Tune the existing bouquet stage for the dimensional scene**

Keep its current responsive placement, increase the desktop width only if needed for 3D readability, remove the SVG-oriented drop shadow if it muddies transparent canvas edges, and ensure every mobile rule remains bounded by viewport-relative width.

- [ ] **Step 4: Run all automated verification**

Run: `npm test`

Expected: all Vitest tests PASS.

Run: `npm run lint`

Expected: PASS with no ESLint errors.

Run: `npm run build`

Expected: TypeScript and Vite production build PASS.

- [ ] **Step 5: Review the final diff and artifact size**

Run: `git diff --stat && git diff -- src/components/home package.json src/pages/HomePage.tsx`

Expected: only the bouquet implementation, quality test, dependency files, home-page stage tuning, and design/plan documents are part of this task; no texture or model assets are added.

### Task 4: Garden-Matched Saturation And Lighting

**Files:**
- Create: `src/components/home/bouquetPalette.ts`
- Create: `src/components/home/bouquetPalette.test.ts`
- Modify: `src/components/home/createRoseBouquetScene.ts`

**Interfaces:**
- Produces: `ROSE_PALETTE` with vivid linear-space-safe crimson and royal-blue variants.
- Consumes: the existing custom petal, stem, and leaf shaders without changing scene object count.

- [ ] **Step 1: Write a failing palette test**

Use `THREE.Color` to verify each palette color remains high-chroma after Three.js converts it to linear working space:

```ts
import { Color } from 'three'
import { describe, expect, it } from 'vitest'
import { ROSE_PALETTE } from './bouquetPalette'

describe('ROSE_PALETTE', () => {
  it('keeps every rose variant vivid in the renderer working space', () => {
    Object.values(ROSE_PALETTE).flat().forEach((hex) => {
      const color = new Color(hex)
      const channels = [color.r, color.g, color.b].sort((a, b) => a - b)
      expect(channels[2]).toBeGreaterThan(0.72)
      expect(channels[0] / channels[2]).toBeLessThan(0.12)
    })
  })
})
```

- [ ] **Step 2: Run the focused test and verify failure**

Run: `npm test -- src/components/home/bouquetPalette.test.ts`

Expected: FAIL because `bouquetPalette.ts` does not exist.

- [ ] **Step 3: Add the vivid palette and use it in deterministic rose definitions**

```ts
export const ROSE_PALETTE = {
  crimson: ['#f51c4f', '#e91646', '#ff315b', '#df1743'],
  blue: ['#217ff2', '#1772e5', '#318df7', '#1268d8'],
} as const
```

Replace dark literal rose colors with deterministic entries from these arrays. Keep the existing per-petal HSL variation small enough that it does not turn inward petals gray.

- [ ] **Step 4: Replace the single hard light with illustrated garden lighting**

In each fragment shader, use the same upper-left/front direction `normalize(vec3(-0.48, 0.78, 0.62))`. Combine a wrapped warm key, cool upward sky fill, and subtle green-gold downward bounce. In the petal shader, apply a `1.24` luminance-preserving saturation mix after lighting and use cream/cool-blue highlights rather than pure white.

- [ ] **Step 5: Use hue-preserving tone mapping**

Set `renderer.toneMapping = THREE.NeutralToneMapping` and `renderer.toneMappingExposure = 1.12`. Do not add scene lights, shadow maps, textures, or post-processing.

- [ ] **Step 6: Verify tests and real mobile rendering**

Run: `npm test && npm run lint && npm run build`

Expected: all tests PASS, lint exits cleanly, and Vite builds successfully.

At `390x600`, capture the presented bouquet in headless Chrome and confirm: red petals read as crimson rather than maroon/black, blue petals retain royal-blue midtones, inward petals remain visible, highlights follow the background's upper-left sunlight, WebGL logs no shader errors, and `scrollWidth === innerWidth`.
