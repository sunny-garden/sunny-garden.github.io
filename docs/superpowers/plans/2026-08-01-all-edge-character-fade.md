# All Edge Character Fade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the female character image fade so it blends on all four edges, not only the bottom.

**Architecture:** Update the existing `CharacterFrame` CSS mask in `src/pages/HomePage.tsx`. Keep the current frame, image source, positioning, and mobile layout unchanged.

**Tech Stack:** React, TypeScript, styled-components, Vite.

## Global Constraints

- Do not change copy, image assets, routes, or layout positions.
- Preserve the existing bottom fade while adding matching top, left, and right fades.
- Verify with `npm run build`.

---

### Task 1: All Edge CSS Mask

**Files:**
- Modify: `src/pages/HomePage.tsx`

**Interfaces:**
- Consumes: existing `CharacterFrame` styled component.
- Produces: a CSS mask that fades all four edges.

- [ ] **Step 1: Update the mask**

Replace the current single-direction mask with intersecting linear gradients:

```css
mask-image:
  linear-gradient(to bottom, transparent 0, #000 10%, #000 87%, transparent 100%),
  linear-gradient(to right, transparent 0, #000 10%, #000 90%, transparent 100%);
mask-composite: intersect;
```

- [ ] **Step 2: Add WebKit mask support**

Add equivalent prefixed mask properties for Chromium/Safari rendering:

```css
-webkit-mask-image:
  linear-gradient(to bottom, transparent 0, #000 10%, #000 87%, transparent 100%),
  linear-gradient(to right, transparent 0, #000 10%, #000 90%, transparent 100%);
-webkit-mask-composite: source-in;
```

- [ ] **Step 3: Verify**

Run: `npm run build`

Expected: build completes successfully.
