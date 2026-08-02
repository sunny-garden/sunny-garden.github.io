# Animated Rose Gift Home Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current home page with a responsive garden scene where a click grows a red-and-blue rose bouquet and presents it to the female character from an off-screen giver.

**Architecture:** `HomePage.tsx` owns the page state, composition, trigger, and character movement. A focused `RoseBouquet.tsx` renders the decorative inline SVG and coordinates stem, leaf, rose, wrap, and sparkle timing from a single `presented` prop. Existing routes and dependencies remain unchanged.

**Tech Stack:** React 19, TypeScript 6, Framer Motion 12, styled-components 6, Vite 8

## Global Constraints

- Replace only the `/` home page; `/proposal` and `/quiz` remain unchanged.
- Use `/background.png` and `/female_character.png` from `public/`.
- Do not display the male character.
- Remove the password gate, cat, music, floating faces, notifications, and old home-page copy from `/`.
- Start the flower-giving sequence from one `Give her the flowers` button.
- Keep an intentionally empty, labelled text region in the upper-left for future personal copy.
- Respect `prefers-reduced-motion`, safe-area insets, keyboard focus, and a 320px minimum viewport.
- Add no dependencies and make no commits unless the user explicitly asks.

---

### Task 1: Animated SVG Rose Bouquet

**Files:**
- Create: `src/components/home/RoseBouquet.tsx`

**Interfaces:**
- Consumes: `presented: boolean`; `presented` changes from `false` to `true` once per page visit.
- Produces: `RoseBouquet({ presented }: { presented: boolean }): JSX.Element`, a decorative responsive SVG that keeps its completed state after animation.

- [ ] **Step 1: Create the component shell and rose geometry**

Use a reusable `Rose` group so every flower shares the same petal structure while accepting its position, color palette, scale, and delay:

```tsx
import { motion, useReducedMotion } from 'framer-motion'

interface RoseProps {
  x: number
  y: number
  scale: number
  delay: number
  light: string
  mid: string
  dark: string
  presented: boolean
  reduceMotion: boolean
}

const Rose = ({ x, y, scale, delay, light, mid, dark, presented, reduceMotion }: RoseProps) => {
  const duration = reduceMotion ? 0.01 : 0.7
  const resolvedDelay = reduceMotion ? 0 : delay

  return (
    <motion.g
      transform={`translate(${x} ${y}) scale(${scale})`}
      initial={false}
      animate={{ opacity: presented ? 1 : 0, scale: presented ? 1 : 0.08, rotate: presented ? 0 : -18 }}
      transition={{ delay: resolvedDelay, duration, type: 'spring', stiffness: 150, damping: 13 }}
      style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
    >
      <ellipse rx="19" ry="31" fill={dark} transform="rotate(-58)" />
      <ellipse rx="19" ry="31" fill={mid} transform="rotate(58)" />
      <ellipse rx="18" ry="29" fill={light} transform="translate(0 -8)" />
      <ellipse rx="18" ry="27" fill={mid} transform="translate(-10 7) rotate(-28)" />
      <ellipse rx="18" ry="27" fill={dark} transform="translate(10 7) rotate(28)" />
      <path d="M-13 4C-8-13 10-15 15 0C17 15 3 22-8 15C-14 11-16 8-13 4Z" fill={mid} />
      <path d="M-6 3C-2-7 9-6 10 3C9 12-2 14-7 8C-9 6-8 4-6 3Z" fill={light} />
      <circle r="4.5" fill={dark} />
    </motion.g>
  )
}
```

- [ ] **Step 2: Add stems, leaves, wrap, roses, and sparkles**

Create `RoseBouquet` with `viewBox="0 0 420 560"`, `role="img"`, and `aria-label="A blooming bouquet of red and blue roses"`. Use these exact rose placements and palettes:

```tsx
const roses = [
  { x: 128, y: 205, scale: 0.9, delay: 0.62, light: '#ff8b96', mid: '#e8223f', dark: '#9e1029' },
  { x: 202, y: 170, scale: 1.08, delay: 0.74, light: '#ff7588', mid: '#d81736', dark: '#8b1027' },
  { x: 278, y: 207, scale: 0.92, delay: 0.86, light: '#fa6b7e', mid: '#c80f32', dark: '#790b21' },
  { x: 166, y: 255, scale: 1.02, delay: 0.98, light: '#82caff', mid: '#247bd3', dark: '#164993' },
  { x: 244, y: 252, scale: 1.08, delay: 1.1, light: '#9edcff', mid: '#2c8fe8', dark: '#1755a6' },
  { x: 112, y: 279, scale: 0.72, delay: 1.2, light: '#ff96a2', mid: '#de2946', dark: '#8f142a' },
  { x: 300, y: 278, scale: 0.74, delay: 1.28, light: '#8dd4ff', mid: '#237ad1', dark: '#164b96' },
] as const
```

Draw seven curved stems from `(210, 465)` to the flower positions using `motion.path`, `pathLength`, green gradients, rounded caps, and delays from `0.08` to `0.34` seconds. Animate ten leaf ellipses from scale `0` to `1` between `0.32` and `0.72` seconds. Render the roses using the array above.

Add a cream paper wrap as two paths around the lower stems, tied with a red ribbon. Fade it from `opacity: 0` and `y: 20` at `0.2` seconds. Add eight four-point sparkle paths around the flowers and animate their opacity/scale in a repeating stagger only after `1.45` seconds. Keep all animation delays at zero and durations at `0.01` seconds when `useReducedMotion()` returns true.

- [ ] **Step 3: Run static verification**

Run: `npm run build`

Expected: TypeScript and Vite complete successfully; the component is included by `tsconfig.app.json` even before it is imported by the page.

Run: `npm run lint`

Expected: ESLint exits successfully with no unused imports, explicit `any`, or React hook violations.

---

### Task 2: Responsive Flower-Giving Home Scene

**Files:**
- Modify: `src/pages/HomePage.tsx`

**Interfaces:**
- Consumes: `RoseBouquet({ presented: boolean })` from Task 1 and the public asset URLs `${import.meta.env.BASE_URL}background.png` and `${import.meta.env.BASE_URL}female_character.png`.
- Produces: the default `HomePage` route component with a one-shot click interaction and responsive completed composition.

- [ ] **Step 1: Replace old home-page behavior and imports**

Remove all password, audio, notification, cat, floating-face, and old text logic. Use only:

```tsx
import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import styled, { keyframes } from 'styled-components'
import RoseBouquet from '../components/home/RoseBouquet'

const HomePage = () => {
  const [presented, setPresented] = useState(false)
  const reduceMotion = useReducedMotion()
  const baseUrl = import.meta.env.BASE_URL

  return (
    <Page $background={`${baseUrl}background.png`}>
      <Atmosphere aria-hidden="true" />
      <TextSpace aria-label="Space reserved for a personal message" />

      <CharacterFrame
        initial={false}
        animate={{
          x: presented && !reduceMotion ? [0, -8, 0] : 0,
          rotate: presented && !reduceMotion ? [0, -0.7, 0] : 0,
        }}
        transition={{ delay: 2.25, duration: 1.1, ease: 'easeInOut' }}
      >
        <CharacterImage src={`${baseUrl}female_character.png`} alt="A woman receiving a bouquet in a sunny garden" />
      </CharacterFrame>

      <BouquetStage
        initial={false}
        animate={{
          x: presented ? 'clamp(22px, 6vw, 92px)' : 0,
          y: presented ? 'clamp(-34px, -4vh, -14px)' : 0,
          rotate: presented ? 6 : -7,
        }}
        transition={{ delay: reduceMotion ? 0 : 1.95, duration: reduceMotion ? 0.01 : 1.25, type: 'spring', stiffness: 74, damping: 15 }}
      >
        <RoseBouquet presented={presented} />
      </BouquetStage>

      <AnimatePresence>
        {!presented && (
          <GiveButton
            type="button"
            onClick={() => setPresented(true)}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12, scale: 0.94 }}
            whileHover={reduceMotion ? undefined : { y: -4, scale: 1.025 }}
            whileTap={reduceMotion ? undefined : { scale: 0.97 }}
          >
            <ButtonRose aria-hidden="true">✦</ButtonRose>
            Give her the flowers
          </GiveButton>
        )}
      </AnimatePresence>
    </Page>
  )
}
```

- [ ] **Step 2: Build the desktop composition**

Create styled components in the same file with these responsibilities and values:

```tsx
const drift = keyframes`
  0%, 100% { transform: translate3d(0, 0, 0); }
  50% { transform: translate3d(0, -10px, 0); }
`

const Page = styled.main<{ $background: string }>`
  position: relative;
  min-height: 100svh;
  overflow: hidden;
  isolation: isolate;
  background:
    linear-gradient(90deg, rgba(252, 247, 218, 0.2) 0%, transparent 44%),
    url(${({ $background }) => $background}) center / cover no-repeat;
`

const Atmosphere = styled.div`
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background:
    radial-gradient(circle at 72% 20%, rgba(255, 244, 180, 0.4), transparent 28%),
    linear-gradient(to top, rgba(20, 83, 47, 0.16), transparent 42%);
`

const TextSpace = styled.section`
  position: absolute;
  z-index: 3;
  top: max(8vh, calc(env(safe-area-inset-top) + 32px));
  left: max(5vw, calc(env(safe-area-inset-left) + 24px));
  width: min(38vw, 520px);
  min-height: clamp(128px, 24vh, 250px);
`

const CharacterFrame = styled(motion.figure)`
  position: absolute;
  z-index: 2;
  right: clamp(-50px, 1vw, 22px);
  bottom: -3vh;
  width: clamp(310px, 36vw, 570px);
  height: min(88vh, 880px);
  margin: 0;
  overflow: hidden;
  border: 1px solid rgba(255, 248, 218, 0.38);
  border-radius: 48% 48% 14% 14% / 18% 18% 8% 8%;
  box-shadow: 0 28px 80px rgba(39, 78, 43, 0.3), inset 0 0 70px rgba(255, 244, 190, 0.2);
  mask-image: linear-gradient(to bottom, #000 0 87%, transparent 100%);
  transform-origin: bottom center;
`

const CharacterImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 19%;
  filter: saturate(0.94) contrast(1.02) brightness(1.03);
`

const BouquetStage = styled(motion.div)`
  position: absolute;
  z-index: 4;
  left: 45%;
  bottom: -2vh;
  width: clamp(260px, 29vw, 440px);
  transform-origin: 50% 100%;
  filter: drop-shadow(0 22px 24px rgba(36, 72, 42, 0.28));
`
```

Place `GiveButton` at `left: clamp(24px, 13vw, 190px)` and `bottom: max(7vh, calc(env(safe-area-inset-bottom) + 24px))`. Style it as a cream pill with dark forest text, a 1px cream border, `min-height: 58px`, strong focus-visible outline, and a warm shadow. Give `ButtonRose` a red circular background with cream text.

- [ ] **Step 3: Add mobile and reduced-motion behavior**

At `max-width: 720px`, use `background-position: 46% center`; size the empty text region to `calc(100% - 40px)` and `min-height: 118px`; place the character at `right: -84px`, `bottom: 0`, `width: min(72vw, 390px)`, and `height: min(70vh, 650px)`; place the bouquet at `left: 2vw`, `bottom: 2vh`, and `width: min(62vw, 330px)`; center the button horizontally near the safe-area bottom. At `max-height: 620px`, reduce the character and bouquet widths by roughly 15 percent so the button remains visible.

Add a local `@media (prefers-reduced-motion: reduce)` rule that removes `drift`, smooth transitions, and decorative ambient movement. The completed bouquet remains visible through `RoseBouquet`'s reduced-motion handling.

- [ ] **Step 4: Verify the page and unaffected routes**

Run: `npm run build`

Expected: `tsc -b` and `vite build` exit successfully and generate `dist/`.

Run: `npm run lint`

Expected: ESLint exits successfully with no errors.

Run: `npm run dev -- --host 127.0.0.1`

Expected manual checks:

- `/` shows the garden, empty text area, female character, bouquet stage, and one trigger button.
- Activating the button by pointer or keyboard grows red and blue roses, moves the bouquet toward the character, and removes the trigger.
- At 320px, 720px, and desktop widths, no horizontal scrolling occurs and the character, bouquet, and trigger remain readable.
- With reduced motion enabled, activation immediately shows the completed handoff with no long movement.
- `/proposal` and `/quiz` continue to render their existing experiences.

---

### Task 3: Final Repository Verification

**Files:**
- Verify only; do not modify generated `dist/` files manually.

**Interfaces:**
- Consumes: completed Task 1 and Task 2 implementation.
- Produces: evidence that the complete site passes repository checks.

- [ ] **Step 1: Run all available automated checks from a clean command invocation**

Run: `npm run lint && npm run build`

Expected: both commands exit with status 0. The build emits no TypeScript errors, unresolved assets, or Vite errors.

- [ ] **Step 2: Inspect the final diff without changing unrelated work**

Run: `git diff -- src/pages/HomePage.tsx src/components/home/RoseBouquet.tsx docs/superpowers/specs/2026-07-31-animated-rose-gift-homepage-design.md docs/superpowers/plans/2026-07-31-animated-rose-gift-homepage.md`

Expected: the diff contains only the approved home-page replacement, bouquet component, design spec, and implementation plan. Existing unrelated worktree changes remain untouched.
