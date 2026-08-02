/**
 * Lightweight notification service.
 *
 * Sends a webhook notification (e.g. to Discord) whenever someone interacts
 * with the "Heyy!" button on the home page.  This lets you know in real time
 * that someone stopped by.
 *
 * ## Setup
 *
 * 1. Create a Discord webhook in your server:
 *    Server Settings → Integrations → Webhooks → New Webhook
 * 2. Copy the webhook URL and set it in `.env`:
 *    ```
 *    VITE_NOTIFICATION_WEBHOOK_URL=https://discord.com/api/webhooks/...
 *    ```
 * 3. Optionally configure a custom webhook (Slack, Teams, etc.) that accepts
 *    the same JSON payload shape.
 *
 * The service fails silently — a failed notification never blocks the UI.
 */

// ── Payload shape ────────────────────────────────────────────────────────────

interface NotificationPayload {
  /** A short title for the message. */
  title: string
  /** A longer description with details about the visit. */
  body: string
  /** ISO-8601 timestamp of when the event happened. */
  timestamp: string
  /** The page the user was on. */
  page: string
  /** Extra info (user agent, referrer, screen size, etc.). */
  metadata: Record<string, string>
}

// ── Discord embed formatter ──────────────────────────────────────────────────

interface DiscordEmbed {
  title: string
  description: string
  color: number
  fields: { name: string; value: string; inline: boolean }[]
  timestamp: string
}

const toDiscordPayload = (data: NotificationPayload) => ({
  username: 'Sunny Garden',
  avatar_url: `${import.meta.env.BASE_URL}favicon.svg`,
  embeds: [
    {
      title: data.title,
      description: data.body,
      color: 0x0f3460, // deep blue matching the site theme
      fields: Object.entries(data.metadata).map(([name, value]) => ({
        name,
        value,
        inline: true,
      })),
      timestamp: data.timestamp,
    } satisfies DiscordEmbed,
  ],
})

// ── IP lookup (optional, best-effort) ────────────────────────────────────────

let cachedIp: string | null = null

const lookupIp = async (): Promise<string | null> => {
  if (cachedIp) return cachedIp
  try {
    const res = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(4000) })
    if (!res.ok) return null
    const data = await res.json()
    cachedIp = data.ip as string
    return cachedIp
  } catch {
    return null
  }
}

// ── Main notification function ───────────────────────────────────────────────

/**
 * Fire a "someone clicked Heyy!" notification via the configured webhook.
 *
 * Reads the webhook URL from `VITE_NOTIFICATION_WEBHOOK_URL`.  If that env
 * var is not set, the call is a no-op (logged to console in dev).
 */
export const notifyVisit = async (): Promise<void> => {
  const webhookUrl = import.meta.env.VITE_NOTIFICATION_WEBHOOK_URL as string | undefined

  if (!webhookUrl) {
    if (import.meta.env.DEV) {
      console.log('[notification] No VITE_NOTIFICATION_WEBHOOK_URL set — skipped')
    }
    return
  }

  const ip = await lookupIp()

  const payload: NotificationPayload = {
    title: '👋 Someone clicked Heyy!',
    body: 'A visitor just entered Sunny Garden and pressed the Heyy! button.',
    timestamp: new Date().toISOString(),
    page: window.location.href,
    metadata: {
      'User Agent': window.navigator.userAgent.slice(0, 120),
      'Screen': `${window.screen.width}×${window.screen.height}`,
      'Language': window.navigator.language,
      'Referrer': document.referrer || '(direct)',
      'IP': ip ?? '(unavailable)',
      'Time of Day': new Date().toLocaleString(),
    },
  }

  const body = JSON.stringify(toDiscordPayload(payload))

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) {
      console.warn('[notification] Webhook returned', res.status)
    }
  } catch (err) {
    // Silently fail — never disrupt the user's experience.
    if (import.meta.env.DEV) {
      console.warn('[notification] Failed to send notification', err)
    }
  }
}
