# Procedural Fantasy Bouquet Replacement Design

## Goal

Replace the current procedural rose model on the home page with a complete, touch-interactive 3D bouquet based on the supplied reference. The bouquet must present a full rounded arrangement of alternating royal-blue and deep-red roses, dark green foliage, small white filler flowers, layered navy-and-cream wrapping with restrained gold decoration, and a large red-and-blue bow. It must contain no letter, card, text, or card-like placeholder.

The replacement remains entirely procedural in the repository, preserves the existing gift handoff and interaction model, and targets stable 45-60 FPS on mid-range mobile phones.

## Scope

- Replace the geometry, materials, animation, and lighting owned by `RoseBouquet` and its Three.js scene controller.
- Preserve the `RoseBouquet({ presented: boolean })` interface and the home page's existing presentation sequence.
- Preserve one-finger rotation, pinch zoom, tap-to-bloom, keyboard controls, reduced-motion behavior, and the non-WebGL fallback.
- Keep the existing garden page, character, routes, and unrelated interactions unchanged.
- Do not add an externally authored model, downloaded texture pack, Blender source file, card, or letter.

## Chosen Approach

Build the bouquet from deterministic, reusable procedural geometry in direct Three.js. Batch repeated elements with instancing or merged geometry and use lightweight custom PBR-inspired shaders for material response. Adaptive quality tiers reduce detail density and render cost without removing the defining silhouette.

Alternatives rejected:

- A hybrid sprite approach would be faster but would flatten filler flowers and foliage during side and back rotation.
- Dense unique meshes with standard dynamic PBR lighting would increase detail but exceed the mid-range mobile performance target.
- An imported GLB could provide authored detail but conflicts with the selected self-contained procedural asset strategy.

## Composition

The bouquet is a portrait-oriented, fully enclosed arrangement that remains convincing from the front, back, left, and right.

### Roses

- Arrange 13-15 primary blooms in a rounded dome with alternating royal-blue and deep-red colors.
- Use larger, more open focal roses around the central front area and smaller blooms toward the upper and side edges.
- Give each rose deterministic position, orientation, scale, opening stage, color variation, and animation phase.
- Build each rose from concentric instanced petal rings using a reusable curled-petal geometry.
- Include rear-facing and side blooms rather than constructing only a front facade.

### Foliage And Fillers

- Place dark green leaves between blooms and around the outer silhouette, including the back and sides.
- Use branching curved stems for small white filler flowers distributed through gaps and extending slightly above the rose dome.
- Build filler blossoms from a reusable five-petal geometry with a small warm center.
- Keep fillers subordinate to the roses and avoid dense transparent overdraw.

### Wrapping

- Form the wrapper from overlapping folded-paper panels arranged in several radial layers around the flower dome.
- Alternate deep navy outer panels with warm cream inner panels.
- Model the front, sides, and back so rotation never reveals an empty bouquet core.
- Give panel edges slight curls, irregular fold angles, and layered depth while preserving a clean manhwa-inspired silhouette.
- Add restrained procedural gold veins, edge accents, and flecks to navy panels without texture files or text.
- Gather lower panels into a flared wrapped base beneath the flowers.

### Bow

- Place a large bow at the gathered base using a central knot, paired red and blue satin loops, and layered trailing tails.
- Give loops and tails real curvature and thickness so they read correctly from side and back views.
- Keep the bow proportionally prominent but below the flower dome.

## Scene Architecture

`RoseBouquet.tsx` remains the React and accessibility boundary. It owns the responsive canvas host, presentation transition, fallback, instructions, and lazy scene import. The imperative scene controller continues to own rendering, resources, interaction state, observers, and cleanup.

The scene is split into focused procedural units:

- Quality policy: chooses geometry density, DPR, and frame cadence from device capabilities.
- Bouquet layout data: deterministic definitions for roses, wrapping panels, filler branches, bow pieces, and secondary animation phases.
- Geometry generators: create petals, leaves, filler blossoms, curved branches, wrapping panels, and ribbon sections.
- Scene assembly: creates instanced or merged meshes, materials, interaction mappings, camera, and render lifecycle.

Repeated elements share geometry and materials. The implementation may use separate draw calls for materially distinct red petals, blue petals, foliage, fillers, cream paper, navy paper, gold accents, and ribbon, but must batch within each material class and avoid one mesh per decorative element.

## Materials And Lighting

Materials use procedural shader inputs and vertex attributes rather than image textures.

- Rose petals: soft roughness, subtle rim translucency, shallow vein variation, saturated midtones, and restrained Fresnel highlights.
- Leaves: dark green diffuse response, brighter central vein, mild gloss, and warm garden bounce.
- Filler flowers: cream-white petals with warm centers that remain visible without bloom-like glare.
- Navy paper: matte fibrous variation with subtle metallic gold lines and flecks.
- Cream paper: warm diffuse material with soft fold shading and no pure-white clipping.
- Ribbon: smoother satin response with directional highlights and darker fold valleys.

The illustrated lighting model combines a warm upper-left key, cool sky fill, and green-gold garden bounce to integrate the dark fantasy palette with the sunny background. Bloom responses add a brief localized glow and sparse sparkle points without full-screen post-processing, shadow maps, or expensive dynamic lights.

## Animation And Interaction

The home page's existing Framer Motion handoff remains unchanged at the component boundary. Inside the Three.js scene:

- The completed bouquet has subtle settled breathing rather than continuous large movement.
- Petals move minimally, leaves and filler branches sway at their free ends, wrapper edges flex slightly, and bow tails receive restrained secondary motion.
- One-finger horizontal drag rotates the complete bouquet with damped inertia.
- Vertical touch intent remains available to the page.
- Two-finger pinch changes camera distance within framing-safe bounds.
- Tapping a rose raycasts to its petal instances and briefly opens, brightens, and glows that bloom.
- Keyboard rotation, zoom, and bloom controls remain available while the bouquet is presented.
- Reduced-motion mode renders a stable completed composition and updates only for resize, presentation, and direct interaction.

The full bouquet, including wrapping, bow, foliage, and rear details, rotates as one group. Secondary animation amplitudes stay small enough that the arrangement feels crafted rather than elastic.

## Mobile Quality Policy

Use three deterministic quality tiers:

- High: capable devices receive all 15 roses, highest petal subdivisions, full filler and foliage density, and the highest capped DPR.
- Medium: the target tier retains 13 primary roses, complete wrapping and bow, moderate petal subdivisions, and enough filler and foliage to preserve the reference silhouette at 45-60 FPS.
- Low: constrained phones lower rose and secondary-detail density, subdivisions, DPR, sparkle count, and frame cadence while retaining red and blue roses, cream and navy wrapping, rear coverage, and the bow.

Tier selection considers viewport width, physical DPR, device memory when available, and hardware concurrency when available. Unknown capability fields default to the medium-safe path rather than assuming flagship hardware.

Rendering pauses before presentation, while off-screen, and while the document is hidden. Low-tier rendering may use a capped frame interval. Resize work is driven by `ResizeObserver`, and the transparent renderer remains bounded to the host's portrait aspect ratio to prevent mobile overflow.

## Accessibility And Failure Handling

- Keep a keyboard-focusable interactive group only after presentation.
- Update the accessible label and instructions to describe the wrapped red-and-blue bouquet and supported gestures.
- Preserve the live presentation status in `HomePage`.
- If scene creation or dynamic import fails, display a decorative CSS fallback containing red and blue flowers, wrapping colors, and a bow rather than a blank canvas.
- If a lower-cost feature is unavailable, fall back to the lower quality tier instead of failing the whole page.
- Scene disposal cancels animation, disconnects observers, releases pointer captures, removes listeners, disposes all geometries and materials, and releases the WebGL context.

## Testing And Verification

Automated tests cover:

- Three-tier quality selection and DPR/frame-rate caps.
- Camera zoom clamping.
- Deterministic layout counts, color alternation, full depth distribution, and absence of card geometry.
- Geometry attributes, bounds, normals, and UVs for petals, filler blossoms, wrapping panels, and ribbon pieces.
- Material palette invariants for royal blue, deep red, navy, cream, green, white, and gold.

Final verification runs the complete Vitest suite, ESLint, TypeScript production build, and bundle inspection. Browser smoke checks use narrow and short mobile viewports to confirm no horizontal overflow, complete framing, touch rotation, pinch bounds, tap response, reduced motion, pause/resume lifecycle behavior, and no WebGL shader errors. Performance verification targets 45-60 FPS on a representative mid-range profile while the presented bouquet idles and rotates.

## Acceptance Criteria

- The current bouquet is fully replaced by a complete procedural arrangement matching the reference's proportions and color structure.
- The bouquet visibly contains alternating royal-blue and deep-red roses, dark green leaves, white fillers, layered navy-and-cream wrapping with subtle gold decoration, and a large red-and-blue bow.
- No letter, card, text, or card-shaped placeholder appears from any viewing angle.
- Front, back, and side rotation reveal intentional geometry rather than empty space or a flat facade.
- Handoff, drag, pinch, tap-to-bloom, keyboard controls, reduced motion, and fallback behavior remain functional.
- The medium quality tier targets stable 45-60 FPS on mid-range mobile hardware and does not cause viewport overflow.
