# Mobile Three.js Rose Bouquet Design

## Goal

Replace the current flat SVG flower on the home page with a compact, touch-interactive 3D banquet bouquet of dense red and blue roses. Preserve the existing gift presentation flow and the `RoseBouquet({ presented })` interface while making the new scene suitable for narrow mobile screens and embedding over the garden background.

## Chosen Approach

Use Three.js directly inside the existing React component and use Framer Motion for the component's presentation transition. This avoids React Three Fiber's additional runtime and object graph while giving complete control over scene lifetime, draw calls, adaptive rendering, and touch behavior.

Alternatives considered:

- React Three Fiber would provide declarative scene composition but adds dependencies and per-object overhead that are unnecessary for this small, deliberately batched scene.
- A shader-only ray-marched or billboard bouquet would minimize geometry but would look flatter, make individual rose picking less natural, and require more fragment work on mobile GPUs.
- Direct Three.js instancing provides the best balance of dimensional petals, low draw-call count, accurate tapping, and explicit cleanup.

## Scene Architecture

The React wrapper owns a responsive canvas host, accessible instructions, and a non-WebGL fallback. A focused scene controller created by the wrapper owns the renderer, camera, geometry, materials, observers, pointer state, and animation loop.

The bouquet targets four primary draw calls:

1. One `InstancedMesh` for every rose petal, using one reusable low-poly curled-petal geometry.
2. One merged stem mesh containing all gently curved stems.
3. One `InstancedMesh` for leaves using one reusable low-poly leaf geometry.
4. One point-sprite layer for tap glows centered on each bloom.

Petals carry per-instance color, animation phase, rose identity, and bloom response values. Red and blue roses share the same shader and geometry. Rose layouts are deterministic and compact, with variations in bloom position, scale, orientation, stage, petal count, and color tone.

## Shading And Motion

The petal shader uses procedural UV-space ridges for subtle veins, per-instance color variation, diffuse lighting, restrained view-angle Fresnel highlights, and mild edge translucency. It uses no textures. Geometry is two-sided and low-poly with a curled profile that becomes more open toward outer petal rings.

### Garden Lighting Revision

The bouquet uses a lightweight illustrated-lighting model aligned with the garden image rather than generic studio lighting. A warm key comes from the upper left, a soft blue sky fill prevents inward-facing petals from becoming black, and a restrained green-gold ground bounce ties the stems and lower petals to the sunlit lawn. Half-Lambert wrapping keeps low-poly facets dimensional without harsh black wedges.

Petal colors use vivid crimson and royal blue bases, then receive hue-preserving saturation after lighting. Highlights are warm cream rather than pure white so they match the background's painted sunlight. Neutral tone mapping replaces the more desaturating filmic curve. This revision adds no scene lights, texture samples, shadows, post-processing passes, or draw calls.

Stem and leaf vertex shaders apply small time-based bends weighted toward their free ends. Petals receive a much smaller breathing displacement. Reduced-motion mode renders a stable bouquet and only updates in direct response to interaction.

Tapping a rose raises its per-instance bloom value, slightly opening and brightening its petals while fading in a soft point glow. The response decays smoothly without allocating new scene objects.

## Interaction

- A one-finger horizontal drag rotates the bouquet around its vertical axis with damped inertia.
- Vertical movement remains available to page scrolling; rotation begins only after horizontal intent is clear.
- A two-finger gesture changes camera distance within a narrow safe range.
- A tap raycasts against the petal instances and triggers the corresponding rose response.
- Pointer interactions work for touch, pen, and mouse without hover-only behavior.
- The canvas exposes concise screen-reader instructions and keeps the existing bouquet image label.

## Mobile Performance

- Pixel ratio is capped and lowered when device memory, CPU count, viewport size, or renderer capability indicates a constrained device.
- Lower-quality mode reduces rose count, petal rings, geometry subdivisions, foliage count, and frame cadence.
- The canvas uses alpha compositing and no texture assets, shadows, post-processing, or multisampled render targets.
- `IntersectionObserver`, page visibility, the `presented` state, and reduced-motion preference control the render loop.
- Resize work uses `ResizeObserver` and updates only renderer dimensions and camera projection.
- Unmount removes observers and listeners, cancels animation frames, releases pointer captures, and disposes all geometries, materials, and renderer resources.

## Layout And Fallback

The scene fills its parent without changing the existing bouquet stage footprint. Its camera frames a portrait-oriented arrangement and recalculates aspect-safe bounds from the host size. CSS uses `overflow: hidden`, transparent compositing, and a strict aspect ratio so it cannot widen the page.

If WebGL creation fails, the component displays a lightweight decorative red-and-blue rose emblem and retains an accessible label rather than leaving a blank region.

## Verification

- Type-check and build the production bundle.
- Run ESLint on the changed source.
- Confirm no texture or model assets are introduced.
- Confirm the scene retains the `presented` animation contract used by `HomePage`.
- Check narrow and short viewport CSS rules for overflow.
- Verify reduced motion, page visibility, off-screen pausing, touch rotation, pinch bounds, tap response, and scene disposal through code review and browser smoke testing where available.
