interface GlyphProps {
  className?: string
  size?: number
}

/** A small four-toe paw print used for floating particles and confetti. */
export const PawGlyph = ({ className, size = 28 }: GlyphProps) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    aria-hidden="true"
  >
    <ellipse cx="16" cy="21" rx="8.6" ry="7.1" fill="currentColor" />
    <circle cx="8.4" cy="12.4" r="3.1" fill="currentColor" />
    <circle cx="13.8" cy="8.4" r="3.1" fill="currentColor" />
    <circle cx="20.2" cy="8.4" r="3.1" fill="currentColor" />
    <circle cx="25.2" cy="12.6" r="3.1" fill="currentColor" />
  </svg>
)

/** A simple fish silhouette — a cat's favourite floating treat. */
export const FishGlyph = ({ className, size = 28 }: GlyphProps) => (
  <svg
    className={className}
    width={size}
    height={(size * 24) / 36}
    viewBox="0 0 36 24"
    fill="none"
    aria-hidden="true"
  >
    <ellipse cx="14" cy="12" rx="12" ry="7.6" fill="currentColor" />
    <path d="M24 12 34 5v14L24 12Z" fill="currentColor" />
    <circle cx="7.5" cy="10" r="1.6" fill="#ffffff" />
  </svg>
)
