# Letter Location API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy a write-only Cloudflare Worker endpoint that stores validated letter-location submissions in D1 and connect the existing React client while retaining local fallback.

**Architecture:** A standalone Worker under `worker/` handles routing, strict-origin CORS, request validation, and parameterized D1 inserts. The existing location service persists every payload locally first, then POSTs to the URL in `VITE_LETTER_LOCATION_API_URL`, falling back to its mock result when no URL is configured.

**Tech Stack:** TypeScript, Cloudflare Workers, D1, Wrangler, React 19, Vite, Vitest.

## Global Constraints

- Production CORS allows only `https://sunny-garden.github.io`.
- The API exposes no public read route.
- Request bodies are limited to 8 KiB.
- Raw IP addresses and request headers are not stored.
- API failures never prevent the paper from opening.
- No API key or Cloudflare credential is included in frontend code.

---

### Task 1: Worker API and D1 Schema

**Files:**
- Create: `worker/src/index.ts`
- Create: `worker/src/index.test.ts`
- Create: `worker/migrations/0001_create_letter_locations.sql`
- Create: `wrangler.jsonc`
- Modify: `package.json`

**Interfaces:**
- Consumes: `POST /api/letter-location` JSON and `Env.LOCATIONS: D1Database`, `Env.ALLOWED_ORIGIN: string`.
- Produces: `201 { ok: true, id: string }`, CORS preflight, and sanitized JSON errors.

- [ ] **Step 1: Write failing Worker routing and validation tests**

Create tests that call `worker.fetch(request, env)`, use a fake D1 binding that records the SQL bind values, and assert: allowed preflight returns `204`; wrong origin returns `403`; malformed or inconsistent payload returns `400`; valid granted payload returns `201` and executes one parameterized insert; unknown paths return `404`; D1 failures return a generic `500`.

- [ ] **Step 2: Run Worker tests and verify RED**

Run: `npm test -- worker/src/index.test.ts`

Expected: FAIL because `worker/src/index.ts` does not exist.

- [ ] **Step 3: Implement the Worker**

Implement a default export with `fetch(request, env)`. Restrict the route to `/api/letter-location`, compare the `Origin` header to `env.ALLOWED_ORIGIN`, handle `OPTIONS`, reject methods other than `POST`, reject content lengths over `8192`, parse and validate the exact payload fields, insert with:

```sql
INSERT INTO letter_locations (
  id, client_timestamp, server_timestamp, status,
  latitude, longitude, accuracy, error_message, user_agent
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
```

Generate IDs with `crypto.randomUUID()` and server timestamps with `new Date().toISOString()`. Attach CORS headers to every response for an allowed origin and never return SQL error details.

- [ ] **Step 4: Add the D1 migration**

```sql
CREATE TABLE letter_locations (
  id TEXT PRIMARY KEY,
  client_timestamp TEXT NOT NULL,
  server_timestamp TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('granted', 'denied', 'unavailable', 'error')),
  latitude REAL,
  longitude REAL,
  accuracy REAL,
  error_message TEXT,
  user_agent TEXT NOT NULL
);
CREATE INDEX idx_letter_locations_server_timestamp
  ON letter_locations(server_timestamp);
```

- [ ] **Step 5: Add Wrangler configuration and scripts**

Configure `main` as `worker/src/index.ts`, `compatibility_date` as the current date, `ALLOWED_ORIGIN` as `https://sunny-garden.github.io`, and a D1 binding named `LOCATIONS`. Add `worker:dev`, `worker:test`, `worker:types`, and `worker:deploy` scripts and install Wrangler as a dev dependency.

- [ ] **Step 6: Run Worker tests and verify GREEN**

Run: `npm test -- worker/src/index.test.ts`

Expected: all Worker tests pass.

### Task 2: React Remote Submission

**Files:**
- Modify: `src/services/locationCapture.ts`
- Modify: `src/services/locationCapture.test.ts`
- Modify: `src/vite-env.d.ts`

**Interfaces:**
- Consumes: optional `import.meta.env.VITE_LETTER_LOCATION_API_URL`.
- Produces: `{ status: 'remote-success' | 'remote-error' | 'mock-success', endpoint: string }` while always retaining the local payload.

- [ ] **Step 1: Write failing frontend submission tests**

Add tests that stub `fetch` and assert configured submission uses `POST`, JSON content type, and the locally stored payload; a successful `201` returns `remote-success`; a rejected fetch returns `remote-error`; and the existing no-URL path remains `mock-success`.

- [ ] **Step 2: Run the frontend test and verify RED**

Run: `npm test -- src/services/locationCapture.test.ts`

Expected: FAIL because configured remote submission is not implemented.

- [ ] **Step 3: Implement local-first remote submission**

Persist `LetterLocationPayload` before any network call. If the env URL is absent, return the existing mock result. Otherwise POST the payload; return `remote-success` only for an OK response and return `remote-error` for HTTP or network failures without throwing.

- [ ] **Step 4: Add the Vite environment type**

Add `readonly VITE_LETTER_LOCATION_API_URL?: string` to `ImportMetaEnv`.

- [ ] **Step 5: Run frontend and letter tests**

Run: `npm test -- src/services/locationCapture.test.ts src/components/home/MailLetter.test.ts`

Expected: all tests pass and the letter still awaits capture without being blocked by API failure.

### Task 3: Provision and Deploy

**Files:**
- Modify: `wrangler.jsonc` with the provisioned D1 database ID.
- Create or modify: `.env.production` only if it is already an accepted tracked configuration pattern; otherwise provide the deployed URL through the build environment.

**Interfaces:**
- Consumes: authenticated Wrangler session.
- Produces: deployed Worker URL and migrated D1 database.

- [ ] **Step 1: Confirm authentication**

Run: `npx wrangler whoami`

Expected: authenticated Cloudflare account and account ID.

- [ ] **Step 2: Create D1 and update configuration**

Run: `npx wrangler d1 create sunny-garden-letter-locations`

Copy the returned database ID into the `LOCATIONS` binding in `wrangler.jsonc`.

- [ ] **Step 3: Apply the remote migration**

Run: `npx wrangler d1 migrations apply sunny-garden-letter-locations --remote`

Expected: migration `0001_create_letter_locations.sql` succeeds.

- [ ] **Step 4: Deploy the Worker**

Run: `npm run worker:deploy`

Expected: Wrangler returns a deployed HTTPS Worker URL.

- [ ] **Step 5: Configure the frontend URL**

Set `VITE_LETTER_LOCATION_API_URL` to the deployed URL plus `/api/letter-location` in the production build/deployment environment. Do not put Cloudflare credentials in that value.

- [ ] **Step 6: Verify the live API**

Send an allowed-origin test POST with a non-coordinate `denied` payload and verify `201`. Send a disallowed-origin request and verify `403`. Query D1 privately with Wrangler to confirm one row was inserted.

### Task 4: Full Verification

**Files:**
- No source changes unless verification identifies a defect.

**Interfaces:**
- Consumes: complete Worker and frontend implementation.
- Produces: release evidence.

- [ ] **Step 1: Run all automated checks**

Run: `npm test && npm run lint && npm run build`

Expected: tests, lint, TypeScript, and Vite build pass.

- [ ] **Step 2: Inspect changes**

Run: `git diff --check && git status --short`

Expected: no whitespace errors and only intended source, configuration, migration, test, lockfile, spec, and plan changes.
