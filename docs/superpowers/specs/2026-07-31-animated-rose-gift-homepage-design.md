# Animated Rose Gift Home Page Design

## Goal

Replace the existing home page with a responsive, cinematic garden scene in which an off-screen giver presents an animated red-and-blue rose bouquet to the female character. Preserve clear space for future personal text.

## Scope

- Replace only the `/` home page experience.
- Remove the home page's password gate, dancing cat, background music, floating faces, visit notification, and existing messages.
- Keep the existing `/proposal` and `/quiz` routes unchanged.
- Use the supplied garden background and female character assets.
- Do not display the male character.

## Composition

The page fills the viewport with the garden image. The female character is framed on the right and visually blended into the wider garden scene with a soft edge treatment. The upper-left remains calm and open as a designated text area. The bouquet begins near the lower middle so it reads as entering from an off-screen giver, then finishes near the character's hands.

On narrow screens, the text area sits above the main action while the female character and bouquet remain readable without horizontal scrolling. Safe-area insets are respected.

## Interaction And Animation

A single `Give her the flowers` button starts the sequence. Once triggered:

1. Green stems draw upward from the bouquet wrap.
2. Leaves unfurl along the stems.
3. Red and blue roses bloom in a staggered pattern.
4. Small highlights and sparkles appear around the finished bouquet.
5. The bouquet glides toward the female character.
6. The character makes a subtle receiving motion and the bouquet settles in place.

The completed scene remains visible and the trigger does not replay accidentally. Motion uses transforms and opacity for smooth rendering. Visitors who prefer reduced motion receive an immediate completed composition with minimal fading rather than the full sequence.

## Implementation Approach

Build the bouquet as inline SVG and animate its grouped stems, leaves, petals, wrapping, and sparkles with Framer Motion. Keep page-specific layout and styling in the home page module using the project's existing styled-components pattern. This approach provides a detailed custom bouquet without new dependencies or canvas complexity.

The female source image contains its own background, so it will be presented as a deliberately framed portrait with masking, gradient blending, and color treatment rather than treated as a transparent cutout.

## Accessibility

- Use semantic page structure and a real button with a clear accessible label.
- Give the character image useful alternative text.
- Mark decorative bouquet SVG details and sparkles appropriately.
- Maintain visible keyboard focus and sufficient text/button contrast.
- Respect `prefers-reduced-motion`.

## Verification

- Run the production build and lint checks.
- Confirm the `/proposal` and `/quiz` routes still compile.
- Check the home page at desktop and mobile viewport widths.
- Verify the animation starts from keyboard and pointer input.
- Verify the reduced-motion layout shows the completed scene.
