# Interactive 2D Bouquet Replacement Design

## Goal

Replace the home page's Three.js bouquet with a responsive layered composition built from the supplied transparent wrapper, red rose, and blue rose PNGs. Preserve the existing garden page, presentation sequence, central bouquet framing, and `Excellent_Torch` artwork while making each visible asset independently interactive.

## Chosen Approach

Render semantic React image layers and use a focused imperative Pointer Events controller for dragging. React owns settled positions, arrangement-slot occupancy, stacking order, and discrete tap effects. Pointer moves are coalesced through `requestAnimationFrame` and written as transforms so dragging does not cause React rendering on every event.

This is preferred over Framer Motion drag because exact pointer capture, grab offsets, page-coordinate bounds, and bouquet snap detection need explicit control. It is preferred over a fully imperative renderer because React state keeps slot assignment and interaction effects understandable and testable.

## Composition

- Retain the existing responsive `BouquetStage` position and approximate dimensions.
- Place the supplied wrapper behind nine roses: five red and four blue.
- Use deterministic arrangement slots across the wrapper's upper opening, with smaller rear flowers and larger front flowers creating a rounded, natural silhouette.
- Render each rose from the original high-resolution PNG with `object-fit: contain`; never rasterize it through canvas or alter its aspect ratio.
- Render a clipped duplicate of the lower wrapper artwork over the base wrapper to give the baked ribbon a subtle secondary sway. Keep the base image intact so no cutout or missing wrapper area appears.
- Preserve the baked `Excellent_Torch` text in the wrapper image, visually behind and just above the ribbon area.

## Coordinate Model

Each draggable item stores a viewport-space translation relative to its responsive initial anchor. Rose positions never derive from the wrapper's current translation. This means moving the wrapper leaves every flower where it is.

On resize, item bounds are recalculated and settled translations are clamped into the visible viewport. Initial bouquet slot anchors are CSS percentage positions inside the existing responsive stage, while free-drag positions remain viewport-based until the item is snapped back into a slot.

## Interaction

- Every rose and the wrapper use Pointer Events and call `setPointerCapture` on pointer down.
- Pointer-down records the pointer-to-element offset, preserving the exact grab point.
- Pointer movement starts a drag after a small movement threshold, preventing accidental tap suppression.
- During active dragging only, the controller prevents pointer default behavior and temporarily disables document overscroll. Normal page scrolling remains available otherwise.
- Movement is clamped so the visible image bounds remain inside the viewport, including safe-area edges.
- The active item receives the highest dynamic z-index, a small scale lift, and a soft drop shadow.
- Pointer-up over the wrapper's opening checks nearby unoccupied arrangement slots and eases a flower into the closest available slot.
- Pulling a snapped rose outside the opening frees its prior slot immediately; it then remains wherever released.
- A tap triggers a short rose bloom scale/brightness animation.
- A second tap within the double-tap interval applies a small deterministic rotation variation and suppresses a duplicate single-tap effect.
- Pointer cancellation commits the last bounded position without snapping.

## Animation

Each rose receives deterministic CSS custom properties for distinct idle duration, delay, vertical float, sway, rotation, and breathing scale. Nested transform layers separate settled drag translation from idle motion and bloom/held effects, avoiding transform conflicts.

The wrapper base has a restrained fabric sway. The clipped ribbon overlay uses a different duration, transform origin, and amplitude for secondary motion. `prefers-reduced-motion: reduce` disables idle and fabric animations while retaining immediate drag and low-motion tap feedback.

## Component Boundaries

- `RoseBouquet.tsx` renders the wrapper, ribbon overlay, roses, accessible instructions, and interaction state.
- `bouquet2d.ts` contains the arrangement data and pure geometry helpers; the procedural `bouquetLayout.ts` is removed with the Three.js implementation.
- A focused drag hook or controller owns pointer capture, animation-frame batching, bounds clamping, scroll suppression, and cleanup.
- `HomePage.tsx` retains its existing `presented` handoff and responsive `BouquetStage` without changing the `RoseBouquet({ presented })` component interface.

## Removal

Delete the Three.js scene, procedural model, geometry, materials, quality policy, palette, related tests, and fallback renderer after the 2D replacement is connected. Remove `three` and `@types/three` because repository search confirms they are used only by the bouquet implementation. Keep Framer Motion because the surrounding page still uses it.

## Accessibility And Failure Handling

- Keep the bouquet non-interactive and hidden from assistive technology until the existing presentation completes.
- Give each rose an accessible button-like label and keyboard focus. Enter or Space blooms the focused rose; arrow-key dragging is outside this request and is not added.
- Keep pointer targets transparent with no visible cards, borders, or containers.
- If an image fails to load, preserve layout without adding a visible fallback box.
- Cleanup releases pointer capture where possible, cancels pending animation frames and tap timers, and restores document scrolling.

## Testing And Verification

Automated tests cover pure layout and interaction helpers: viewport clamping, opening hit detection, closest available slot selection, and deterministic rotation variation. Component-level behavior is verified through production build and browser smoke checks because the current project does not include a DOM test environment.

Final verification runs Vitest, ESLint, and the TypeScript/Vite production build. Browser checks cover desktop and narrow mobile layouts, pointer grab stability, wrapper independence, free removal, snap-back, z-order, tap and double-tap behavior, reduced motion, resize clamping, image transparency, and page scrolling outside an active drag.

## Acceptance Criteria

- The Three.js bouquet and dependency are gone, and the supplied PNG assets form a complete centered bouquet at the existing visual scale.
- Nine independently draggable red and blue roses begin naturally arranged inside the wrapper.
- Wrapper, clipped ribbon, and every rose have distinct subtle motion, reduced or disabled under reduced-motion preferences.
- Mouse, touch, and stylus dragging preserves the grab point, stays within the viewport, raises the active layer, and prevents scrolling only during an active drag.
- Roses snap into available opening slots, remain independently draggable, and can be removed again.
- Tap blooms and double-tap rotates a rose.
- The wrapper moves without carrying flowers, remains behind them when idle, and preserves the `Excellent_Torch` artwork.
