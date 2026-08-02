# Mobile Letter and UI Sounds Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve the mobile letter modal fit, shrink its close button, and add subtle generated UI sounds across the home-page interactions.

**Architecture:** Keep the change local to existing React components. Reuse `playUiSound` from `src/services/soundEffects.ts` directly in home-page components; do not add audio assets or a new provider.

**Tech Stack:** React 19, TypeScript, styled-components, framer-motion, Vite, existing Web Audio tone helper.

## Global Constraints

- Do not add new audio files or dependencies.
- Keep the desktop letter behavior intact.
- Optimize the letter layout for mobile widths around 390-430px.
- Keep sounds subtle and generated via `playUiSound`.

---

### Task 1: Tune Mobile Letter Layout and Letter Sounds

**Files:**
- Modify: `src/components/home/MailLetter.tsx`

**Interfaces:**
- Consumes: `playUiSound(sound: UiSound): void` from `src/services/soundEffects.ts`
- Produces: no new exported interface

- [ ] **Step 1: Import `playUiSound`**

Add:

```ts
import { playUiSound } from '../../services/soundEffects'
```

- [ ] **Step 2: Add sound calls to letter actions**

Update callbacks:

```ts
const openEnvelope = useCallback(() => {
  playUiSound('select')
  setStage((current) => (current === 'closed' ? 'opened' : current))
}, [])

const showLetter = useCallback(() => {
  playUiSound('transition')
  setStage((current) => (current === 'opened' ? 'letter' : current))
}, [])

const closeLetter = useCallback(() => {
  playUiSound('click')
  setStage('opened')
  openerRef.current?.focus()
}, [])
```

- [ ] **Step 3: Make paper fit mobile better**

Adjust styled components in the same file:

```ts
const PaperCard = styled(motion.div)`
  position: relative;
  z-index: 1;
  width: min(90vw, 620px);
  height: min(84svh, 780px);
  overflow: hidden;
  border-radius: 14px;
  box-shadow: 0 34px 90px rgba(10, 20, 24, 0.5);

  @media (max-width: 720px) {
    width: min(100vw, 460px);
    height: min(96svh, 860px);
    border-radius: 0;
  }
`

const PaperText = styled(motion.div)`
  position: absolute;
  inset: 9% 16% 9%;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 0 clamp(2px, 1vw, 8px) 12px;
  text-align: center;
  font-family: var(--serif);
  color: #20140a;

  @media (max-width: 720px) {
    inset: 8.5% 12% 8.5%;
  }

  @media (max-width: 420px) {
    inset: 8.5% 10.5% 8.5%;
  }
`

const PaperBody = styled.div`
  p {
    margin: 0 0 1em;
    font-size: clamp(0.9rem, 3.3vw, 1.08rem);
    line-height: 1.52;
    text-align: left;
    max-width: 34em;
  }

  @media (max-width: 420px) {
    p {
      margin-bottom: 0.92em;
      font-size: clamp(0.88rem, 3.55vw, 1rem);
      line-height: 1.47;
    }
  }
`
```

- [ ] **Step 4: Shrink close button**

Update `CloseButton`:

```ts
const CloseButton = styled.button`
  position: absolute;
  z-index: 3;
  top: max(8px, env(safe-area-inset-top));
  right: max(8px, env(safe-area-inset-right));
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 50%;
  color: #ffffff;
  background: #111111;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
  font-size: 0.82rem;
  line-height: 1;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
`
```

Expected result: mobile paper text fits better and the close button is smaller.

### Task 2: Add Home Page Start and Skip Sounds

**Files:**
- Modify: `src/pages/HomePage.tsx`

**Interfaces:**
- Consumes: `playUiSound(sound: UiSound): void`
- Produces: no new exported interface

- [ ] **Step 1: Import `playUiSound`**

```ts
import { playUiSound } from '../services/soundEffects'
```

- [ ] **Step 2: Add sound calls**

At the start of `startSong`, call `playUiSound('transition')`. In the existing skip handler for the lyric phase, call `playUiSound('click')` before pausing song and starting background music.

Expected result: song start and lyric skip have subtle UI feedback.

### Task 3: Add Bouquet Drag and Tap Sounds

**Files:**
- Modify: `src/components/home/RoseBouquet.tsx`

**Interfaces:**
- Consumes: `playUiSound(sound: UiSound): void`
- Produces: no new exported interface

- [ ] **Step 1: Import `playUiSound`**

```ts
import { playUiSound } from '../../services/soundEffects'
```

- [ ] **Step 2: Add drag/drop sounds**

In `finishWrapperDrag`, `finishRoseDrag`, and the callbacks passed as `onDragStart`, play subtle tones:

```ts
const startDrag = (id: string) => {
  playUiSound('click')
  setActiveId(id)
}
```

Use `startDrag` for both wrapper and roses. At the start of `finishWrapperDrag`, call `playUiSound(detail.moved ? 'save' : 'click')`. In `finishRoseDrag`, call `playUiSound(detail.moved ? 'save' : 'click')` once before returning.

- [ ] **Step 3: Add rose tap sounds**

In `bloomRose`, after detecting `doubleTap`, call:

```ts
playUiSound(doubleTap ? 'transition' : 'select')
```

Expected result: touching, dragging, dropping, blooming, and rotating bouquet pieces have subtle generated feedback.

### Task 4: Verify

**Files:**
- No source changes expected unless verification finds a build issue.

- [ ] **Step 1: Run build**

Run:

```bash
npm run build
```

Expected: TypeScript and Vite build complete successfully.

- [ ] **Step 2: Inspect git diff**

Run:

```bash
git diff -- src/pages/HomePage.tsx src/components/home/MailLetter.tsx src/components/home/RoseBouquet.tsx
```

Expected: diff only includes approved layout and sound-effect changes.
