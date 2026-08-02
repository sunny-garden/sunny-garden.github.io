# Lyric Depth Effects Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the lyric overlay feel more cinematic with animated shimmer, depth shadows, halo backing, and particles while preserving existing timing behavior.

**Architecture:** Keep all changes inside `src/components/proposal/LyricOverlay.tsx`. Reuse the current `LyricOverlay` public props and timing modes, adding only presentational nested elements and styled-components CSS.

**Tech Stack:** React 19, TypeScript, framer-motion, styled-components.

## Global Constraints

- Do not change lyric timing, audio playback, bouquet reveal, routes, or data.
- Preserve `LyricOverlay({ lines, currentTime?, onComplete? })` for both proposal timer mode and home audio-clock mode.
- Keep animations decorative and pointer-transparent.
- Reduced-motion users must not get infinite shimmer or particles.

---

### Task 1: Lyric overlay visual depth

**Files:**
- Modify: `src/components/proposal/LyricOverlay.tsx`

**Interfaces:**
- Consumes: existing `LyricOverlayProps`.
- Produces: same component API with richer rendering and CSS.

- [ ] Add nested decorative elements inside each line: depth shadow, glow plate, main text, shimmer strip, and particles.
- [ ] Upgrade Framer Motion entry/exit to include `rotateX`, `z`, and slightly stronger scale/depth movement.
- [ ] Add CSS gradients, `text-shadow`, `filter`, perspective, pseudo layers, and reduced-motion media rules.
- [ ] Run `npm run lint`, `npm test`, and `npm run build`.
