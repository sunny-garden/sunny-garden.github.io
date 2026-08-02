# Letter Location API Design

## Goal

Replace the client-side mock location endpoint with a deployed Cloudflare
Worker that validates and stores letter-location submissions in D1 while the
React application retains its local-storage fallback.

## Architecture

The repository will contain a standalone Worker under `worker/` and continue
to deploy the Vite application to GitHub Pages. The browser will request
geolocation, save the resulting payload locally, and then POST it to the
Worker URL configured by `VITE_LETTER_LOCATION_API_URL`.

The Worker will expose `POST /api/letter-location` and `OPTIONS
/api/letter-location`. It will reject all other paths and methods. The API is
write-only: it will not expose a public route for reading stored locations.

## Request Contract

The JSON request body contains:

- `timestamp`: ISO-8601 timestamp created by the browser.
- `status`: `granted`, `denied`, `unavailable`, or `error`.
- `userAgent`: browser user-agent string, capped at 512 characters.
- `latitude`, `longitude`, and `accuracy`: required finite numbers only when
  `status` is `granted`.
- `errorMessage`: optional failure detail capped at 512 characters.

The Worker will reject malformed JSON, unknown fields, invalid coordinates,
bodies larger than 8 KiB, and inconsistent status/coordinate combinations
with a generic `400` response. It will generate the record ID and server
timestamp; client-provided values will not be used as database identifiers.

## Storage

D1 will use a `letter_locations` table with a generated text ID, client and
server timestamps, status, nullable coordinates and accuracy, nullable error
message, and user agent. Raw IP addresses and request headers will not be
stored.

A checked-in SQL migration will create the table and an index on the server
timestamp. Records can be inspected privately through authenticated Wrangler
commands or the Cloudflare dashboard.

## CORS And Security

Production requests will allow only `https://sunny-garden.github.io` through
`Access-Control-Allow-Origin`. A configurable `ALLOWED_ORIGIN` Worker variable
will permit a localhost origin during local development. CORS is not treated
as authentication; this approach intentionally accepts that direct non-browser
clients can submit data. Input limits, a narrow route surface, and Cloudflare
platform protections reduce accidental abuse without adding Turnstile.

No API key or Cloudflare credential will be placed in frontend code. Error
responses will not reveal SQL details or stack traces.

## Client Behavior

The existing location service will always save the payload to local storage
before attempting the network request. When the API URL is configured, it will
POST JSON and report remote success or failure. When it is absent, it will
retain the current mock-only behavior. Network and API failures will never
prevent the paper from opening.

## Error Handling

The Worker will return JSON with:

- `201` and `{ "ok": true, "id": "..." }` after insertion.
- `204` for an accepted CORS preflight.
- `400` for invalid JSON or payloads.
- `403` for a browser origin not on the allowlist.
- `404` for unknown paths.
- `405` for unsupported methods on the location path.
- `500` with a generic message for storage failures.

The frontend will preserve the locally saved payload and return a structured
error result when remote submission fails.

## Testing And Deployment

Worker tests will cover CORS, routing, validation, successful D1 insertion,
and sanitized storage errors. Frontend tests will cover local persistence,
remote submission, absent configuration, and network failure.

Wrangler configuration will define the Worker entry point, compatibility date,
D1 binding, and allowed origin. Deployment consists of creating the D1
database, applying migrations remotely, deploying the Worker, setting the
Worker URL in the Vite production environment, rebuilding the site, and
verifying a live submission without exposing stored coordinates publicly.
