# Interactive 2D Bouquet Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the home page's Three.js bouquet with a responsive layered wrapper and nine independently draggable rose images.

**Architecture:** `RoseBouquet` remains the React boundary used by `HomePage`, but renders ordinary image layers rather than a canvas. Pure helpers define arrangement slots, screen-space clamping, opening detection, snap selection, and rotation variation; the component uses Pointer Events, pointer capture, and animation-frame-coalesced transform writes for interaction.

**Tech Stack:** React 19, TypeScript 6, styled-components, Framer Motion for the existing presentation transition, Vitest, native Pointer Events and DOM transforms.

## Global Constraints

- Preserve the existing `RoseBouquet({ presented: boolean })` interface and home-page layout.
- Use the supplied `images/bouquet.png`, `images/red-rose.png`, and `images/blue-rose.png` without changing aspect ratio or rasterizing them.
- Keep the wrapper behind all flowers, including while the wrapper is dragged.
- Keep rose positions independent from wrapper translation.
- Use Pointer Events, pointer capture, and `requestAnimationFrame` transform writes.
- Disable page scrolling only while a draggable pointer is held.
- Respect `prefers-reduced-motion`.
- Do not modify unrelated existing worktree changes.
- Do not commit unless the user explicitly requests a commit.

---

### Task 1: 2D Arrangement And Geometry Helpers

**Files:**
- Create: `src/components/home/bouquet2d.ts`
- Create: `src/components/home/bouquet2d.test.ts`

**Interfaces:**
- Produces: `ROSE_SLOTS`, `clampScreenDelta(bounds, delta, viewport)`, `isPointInBouquetOpening(point, wrapperBounds)`, `getSlotPoint(slot, wrapperBounds)`, `findClosestAvailableSlot(point, wrapperBounds, occupiedSlotIds)`, and `getRotationVariation(currentStep, roseIndex)`.
- Consumes: no application modules.

- [ ] **Step 1: Write failing helper tests**

Cover all viewport edges, the wrapper opening boundary, occupied-slot exclusion, nearest-slot selection, and deterministic alternating rotation. Use explicit examples such as:

```ts
expect(
  clampScreenDelta(
    { left: 20, top: 30, right: 120, bottom: 230 },
    { x: -50, y: 700 },
    { width: 390, height: 844 },
  ),
).toEqual({ x: -20, y: 614 })

expect(
  isPointInBouquetOpening(
    { x: 150, y: 120 },
    { left: 50, top: 50, right: 250, bottom: 350 },
  ),
).toBe(true)
```

- [ ] **Step 2: Run the focused test and verify failure**

Run: `npm test -- src/components/home/bouquet2d.test.ts`

Expected: FAIL because `bouquet2d.ts` does not exist.

- [ ] **Step 3: Implement slot data and helpers**

Define nine slots with five red and four blue roses. Each slot has a stable `id`, `color`, normalized wrapper-space `x` and `y`, responsive `widthPercent`, `rotation`, `zIndex`, and unique idle timing/amplitude values. Implement helpers with immutable inputs and no DOM globals:

```ts
export interface Point {
  x: number
  y: number
}

export interface Bounds {
  left: number
  top: number
  right: number
  bottom: number
}

export interface Viewport {
  width: number
  height: number
}

export function clampScreenDelta(bounds: Bounds, delta: Point, viewport: Viewport): Point {
  return {
    x: Math.min(viewport.width - bounds.right, Math.max(-bounds.left, delta.x)),
    y: Math.min(viewport.height - bounds.bottom, Math.max(-bounds.top, delta.y)),
  }
}
```

Treat the opening as normalized `x: 0.12..0.88`, `y: 0.05..0.48`. `findClosestAvailableSlot` returns `null` outside the opening and otherwise returns the nearest unoccupied slot by squared distance.

- [ ] **Step 4: Run the focused test and verify success**

Run: `npm test -- src/components/home/bouquet2d.test.ts`

Expected: PASS with all helper tests green.

- [ ] **Step 5: Checkpoint the uncommitted task diff**

Run: `git diff -- src/components/home/bouquet2d.ts src/components/home/bouquet2d.test.ts`

Expected: only the new helper and test files are shown; do not commit.

---

### Task 2: Pointer-Driven Layer Controller

**Files:**
- Create: `src/components/home/useDraggableBouquetLayer.ts`
- Modify: `src/components/home/bouquet2d.ts`
- Modify: `src/components/home/bouquet2d.test.ts`

**Interfaces:**
- Consumes: `Point`, `Bounds`, and `clampScreenDelta` from `bouquet2d.ts`.
- Produces: `useDraggableBouquetLayer(options)`, returning `ref` plus `onPointerDown`, `onPointerMove`, `onPointerUp`, and `onPointerCancel` handlers.
- Callback contract: `onDragStart(id)`, `onDragEnd({ id, translation, clientPoint, bounds, cancelled, moved })`, and `onTap(id, clientPoint)`.

- [ ] **Step 1: Extend tests for screen-to-local vector conversion**

Add a pure `screenVectorToLocal(delta, matrix)` helper test for identity and a 90-degree rotation matrix. This protects drag direction under the existing rotated Framer Motion bouquet stage.

- [ ] **Step 2: Run the focused tests and verify the new test fails**

Run: `npm test -- src/components/home/bouquet2d.test.ts`

Expected: FAIL because `screenVectorToLocal` is not exported.

- [ ] **Step 3: Implement the minimal conversion helper**

Use the inverse determinant of the supplied `{ a, b, c, d }` 2D matrix and return the original vector when the matrix is singular. Keep this helper independent of `DOMMatrix` so Vitest can run in Node.

- [ ] **Step 4: Implement `useDraggableBouquetLayer`**

The hook must:

- Keep live pointer state and pending transform data in refs.
- Record the current settled translation, pointer coordinates, element bounds, and parent transform matrix on pointer down.
- Call `setPointerCapture`, raise the item through `onDragStart`, and save then set `document.body.style.overflow = 'hidden'` and `document.documentElement.style.overscrollBehavior = 'none'`.
- Clamp screen-space movement with `clampScreenDelta`, convert it to local stage coordinates, and schedule one transform CSS-variable write per animation frame.
- Treat movement under 7 CSS pixels as a tap.
- On pointer up or cancellation, flush the last transform, release pointer capture, restore the exact previous body/document styles, and call the appropriate callback.
- On unmount, cancel pending animation frames, release capture where available, and restore scrolling.

Use typed React pointer handlers and set `--drag-x` / `--drag-y` on the layer element rather than assigning a complete transform string.

- [ ] **Step 5: Run helper tests, lint, and TypeScript build**

Run: `npm test -- src/components/home/bouquet2d.test.ts && npm run lint && npm run build`

Expected: helper tests PASS, ESLint exits 0, and the production build completes.

- [ ] **Step 6: Checkpoint the uncommitted task diff**

Run: `git diff -- src/components/home/bouquet2d.ts src/components/home/bouquet2d.test.ts src/components/home/useDraggableBouquetLayer.ts`

Expected: helper additions and the hook only; do not commit.

---

### Task 3: Layered Interactive Bouquet Component

**Files:**
- Replace: `src/components/home/RoseBouquet.tsx`
- Modify only if required by build integration: `src/pages/HomePage.tsx`

**Interfaces:**
- Consumes: `ROSE_SLOTS`, snap helpers, rotation helper, and `useDraggableBouquetLayer`.
- Preserves: default `RoseBouquet({ presented }: { presented: boolean })` export.

- [ ] **Step 1: Import the supplied PNGs through Vite**

Use static imports so production builds fingerprint and emit the root-level supplied assets:

```ts
import bouquetUrl from '../../../images/bouquet.png'
import blueRoseUrl from '../../../images/blue-rose.png'
import redRoseUrl from '../../../images/red-rose.png'
```

- [ ] **Step 2: Render independent wrapper and rose layers**

Replace the canvas, lazy Three.js import, WebGL failure state, and CSS fallback. Render:

- One draggable wrapper layer with the base wrapper image.
- One clipped duplicate image inside the wrapper layer covering the lower ribbon region and using a separate sway animation.
- Nine sibling draggable rose layers mapped from `ROSE_SLOTS`, never nested inside the wrapper layer.
- Accessible rose labels and visually hidden instructions describing drag, tap, and double-tap behavior.

Use `overflow: visible` and remove paint containment so flowers remain visible and interactive after leaving the original stage bounds. Keep parent pointer events disabled and enable them only on draggable layers after `presented` is true.

- [ ] **Step 3: Add settled state, stacking, and wrapper independence**

Store each rose's `{ translation, slotId, rotationStep, bloomKey }` and the wrapper translation separately. Wrapper drag completion updates only wrapper state. Rose drag start releases its occupied slot; wrapper remains at z-index 10 or 20 while every rose remains at z-index 30 or higher. A held rose uses z-index 100.

- [ ] **Step 4: Implement snap, removal, tap, and double-tap**

On rose release:

- Read the current wrapper bounds.
- Call `findClosestAvailableSlot` with the release pointer and occupied slot IDs.
- If no slot is returned, retain the bounded free translation and `slotId: null`.
- If a slot is returned, compute the screen delta from the rose image's head anchor (`x: 0.5`, `y: 0.24`) to `getSlotPoint`, convert it into local coordinates, and commit the corrected translation with that slot ID.

Track the most recent tap per rose. Every tap increments `bloomKey`; a second tap within 320ms and 24 CSS pixels also applies `getRotationVariation`.

- [ ] **Step 5: Add transform-only visual states and responsive styling**

Use nested styled layers so transforms do not conflict:

- Outer draggable layer: translation and snap easing.
- Held layer: `scale(1.045)` and soft `drop-shadow`.
- Idle layer: unique float/sway/breathe properties from each slot.
- Rose image layer: base/double-tap rotation and brief bloom animation.

Keep every image at `height: auto`, `object-fit: contain`, and draggable disabled at the native image level. Preserve the existing `aspect-ratio: 4 / 5` host and stage sizing. Disable idle, wrapper, ribbon, and bloom keyframes in reduced-motion mode while retaining direct manipulation.

- [ ] **Step 6: Verify the component integration**

Run: `npm test -- src/components/home/bouquet2d.test.ts && npm run lint && npm run build`

Expected: all commands exit 0 and the build emits the three PNGs as fingerprinted assets.

- [ ] **Step 7: Perform browser smoke checks**

Run: `npm run dev -- --host 127.0.0.1`

Check desktop and a 390x844 mobile viewport for initial composition, existing `Uhm` handoff, exact no-jump dragging, wrapper independence, viewport bounds, rose removal and snap-back, click bloom, double-tap rotation, z-order, scrolling restoration, and reduced-motion behavior.

- [ ] **Step 8: Checkpoint the uncommitted task diff**

Run: `git diff -- src/components/home/RoseBouquet.tsx src/pages/HomePage.tsx`

Expected: the 2D component replacement and no unrelated page redesign; do not commit.

---

### Task 4: Remove Three.js Bouquet Code And Dependencies

**Files:**
- Delete: `src/components/home/createRoseBouquetScene.ts`
- Delete: `src/components/home/createBouquetModel.ts`
- Delete: `src/components/home/createBouquetModel.test.ts`
- Delete: `src/components/home/bouquetGeometry.ts`
- Delete: `src/components/home/bouquetGeometry.test.ts`
- Delete: `src/components/home/bouquetLayout.ts`
- Delete: `src/components/home/bouquetLayout.test.ts`
- Delete: `src/components/home/bouquetMaterials.ts`
- Delete: `src/components/home/bouquetMaterials.test.ts`
- Delete: `src/components/home/bouquetPalette.ts`
- Delete: `src/components/home/bouquetPalette.test.ts`
- Delete: `src/components/home/bouquetQuality.ts`
- Delete: `src/components/home/bouquetQuality.test.ts`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: completed 2D `RoseBouquet` implementation.
- Produces: application with no source import or package dependency on Three.js.

- [ ] **Step 1: Confirm Three.js has no remaining non-bouquet consumer**

Search `src` for `from 'three'`, `from "three"`, `three/`, `createRoseBouquetScene`, and the procedural bouquet module names.

Expected: matches exist only in the files listed for deletion.

- [ ] **Step 2: Delete the obsolete renderer and procedural modules**

Remove all listed files. Do not delete the new `bouquet2d.ts`, its tests, the supplied PNGs, or Framer Motion.

- [ ] **Step 3: Remove unused packages through npm**

Run: `npm uninstall three @types/three`

Expected: `package.json` and `package-lock.json` no longer contain either package as a direct dependency.

- [ ] **Step 4: Run complete verification**

Run: `npm test && npm run lint && npm run build`

Expected: Vitest passes the new 2D helper suite, ESLint exits 0, TypeScript succeeds, and Vite produces a production bundle without a Three.js chunk.

- [ ] **Step 5: Inspect final scope**

Run: `git status --short` and `git diff --stat`

Expected: the intended 2D files, supplied assets, dependency changes, obsolete 3D deletions, and pre-existing unrelated user changes remain visible. Do not stage or commit anything.
