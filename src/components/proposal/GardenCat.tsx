import { useId } from 'react'
import type { CatMood } from '../../types/proposal'

interface GardenCatProps {
  className?: string
  /** Pixel size of the square illustration. */
  size?: number
  /** Facial expression of the mecha-cat. */
  mood?: CatMood
  /** Adds a soft drop-glow behind the character. */
  glow?: boolean
}

/**
 * An original, royalty-free "mecha-cat" illustration: a stylized robotic cat
 * head with metallic plating, glowing visor eyes and pointed ears. It is an
 * homage to clanking giant-robot energy, drawn from scratch — no copyrighted
 * character assets are used.
 */
const GardenCat = ({ className, size = 160, mood = 'neutral', glow = false }: GardenCatProps) => {
  const rawId = useId()
  const uid = rawId.replace(/:/g, '')
  const metal = `${uid}-metal`
  const plate = `${uid}-plate`
  const visor = `${uid}-visor`
  const eye = `${uid}-eye`
  const glowFilter = `${uid}-glow`
  const dropFilter = `${uid}-drop`

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 220 220"
      fill="none"
      role="img"
      aria-label="A garden cat with glowing eyes"
    >
      <defs>
        <linearGradient id={metal} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e4e9f0" />
          <stop offset="0.5" stopColor="#8b95a4" />
          <stop offset="1" stopColor="#525c6b" />
        </linearGradient>
        <linearGradient id={plate} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c2cbd6" />
          <stop offset="1" stopColor="#6c7686" />
        </linearGradient>
        <linearGradient id={visor} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0a2742" />
          <stop offset="1" stopColor="#06121f" />
        </linearGradient>
        <radialGradient id={eye} cx="0.5" cy="0.45" r="0.65">
          <stop offset="0" stopColor="#d7f0ff" />
          <stop offset="0.5" stopColor="#34a6f5" />
          <stop offset="1" stopColor="#0b68bd" />
        </radialGradient>
        <filter id={glowFilter} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="2.4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={dropFilter} x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="10" stdDeviation="11" floodColor="#0b3c74" floodOpacity="0.4" />
        </filter>
      </defs>

      <g filter={glow ? `url(#${dropFilter})` : undefined}>
        {/* Antennae */}
        <line x1="70" y1="28" x2="64" y2="9" stroke="#6c7686" strokeWidth="3" strokeLinecap="round" />
        <circle cx="63" cy="7" r="3.4" fill={`url(#${eye})`} filter={`url(#${glowFilter})`} />
        <line x1="150" y1="28" x2="156" y2="9" stroke="#6c7686" strokeWidth="3" strokeLinecap="round" />
        <circle cx="157" cy="7" r="3.4" fill={`url(#${eye})`} filter={`url(#${glowFilter})`} />

        {/* Ears */}
        <path d="M52 72 L96 80 L70 26 Z" fill={`url(#${metal})`} stroke="#3f4856" strokeWidth="2" strokeLinejoin="round" />
        <path d="M168 72 L124 80 L150 26 Z" fill={`url(#${metal})`} stroke="#3f4856" strokeWidth="2" strokeLinejoin="round" />
        <path d="M64 66 L86 70 L73 42 Z" fill={`url(#${eye})`} opacity="0.85" />
        <path d="M156 66 L134 70 L147 42 Z" fill={`url(#${eye})`} opacity="0.85" />

        {/* Head shell */}
        <path
          d="M70 66 L150 66 L172 96 L166 150 L132 178 L88 178 L54 150 L48 96 Z"
          fill={`url(#${metal})`}
          stroke="#3f4856"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Forehead crest */}
        <path d="M96 68 L124 68 L110 92 Z" fill="#414b59" />
        <circle cx="110" cy="78" r="4.4" fill={`url(#${eye})`} filter={`url(#${glowFilter})`} />

        {/* Side cheek panels */}
        <path d="M54 104 L62 100 L62 140 L56 146 Z" fill="#5c6675" opacity="0.7" />
        <path d="M166 104 L158 100 L158 140 L164 146 Z" fill="#5c6675" opacity="0.7" />

        {/* Visor band */}
        <rect x="66" y="96" width="88" height="27" rx="13" fill={`url(#${visor})`} stroke="#1b3a57" strokeWidth="1.5" />

        {/* Eyes by mood */}
        {mood === 'neutral' && (
          <g filter={`url(#${glowFilter})`}>
            <rect x="78" y="104" width="24" height="9" rx="4" transform="rotate(-6 90 108)" fill={`url(#${eye})`} />
            <rect x="118" y="104" width="24" height="9" rx="4" transform="rotate(6 130 108)" fill={`url(#${eye})`} />
          </g>
        )}
        {mood === 'plead' && (
          <g filter={`url(#${glowFilter})`}>
            <ellipse cx="92" cy="109" rx="12" ry="13" fill={`url(#${eye})`} />
            <ellipse cx="128" cy="109" rx="12" ry="13" fill={`url(#${eye})`} />
            <circle cx="88" cy="104" r="3.2" fill="#ffffff" />
            <circle cx="124" cy="104" r="3.2" fill="#ffffff" />
          </g>
        )}
        {mood === 'happy' && (
          <g filter={`url(#${glowFilter})`}>
            <path d="M80 114 Q92 100 104 114" stroke={`url(#${eye})`} strokeWidth="6" fill="none" strokeLinecap="round" />
            <path d="M116 114 Q128 100 140 114" stroke={`url(#${eye})`} strokeWidth="6" fill="none" strokeLinecap="round" />
          </g>
        )}

        {/* Muzzle plate */}
        <path d="M86 128 L134 128 L128 158 L92 158 Z" fill={`url(#${plate})`} stroke="#3f4856" strokeWidth="1.5" strokeLinejoin="round" />

        {/* Nose */}
        <path d="M104 134 L116 134 L110 142 Z" fill="#2a3340" />

        {/* Mouth by mood */}
        {mood === 'neutral' && <rect x="98" y="148" width="24" height="4" rx="2" fill="#2a3340" />}
        {mood === 'plead' && (
          <path d="M98 153 Q110 147 122 153" stroke="#2a3340" strokeWidth="3" fill="none" strokeLinecap="round" />
        )}
        {mood === 'happy' && <path d="M96 146 Q110 161 124 146 Z" fill="#2a3340" />}

        {/* Whisker ports + whiskers */}
        <circle cx="90" cy="146" r="2.2" fill="#39424f" />
        <circle cx="130" cy="146" r="2.2" fill="#39424f" />
        <path d="M88 145 L60 140 M88 149 L60 152" stroke="#9aa3b0" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M132 145 L160 140 M132 149 L160 152" stroke="#9aa3b0" strokeWidth="1.6" strokeLinecap="round" />

        {/* Rivets */}
        <circle cx="74" cy="74" r="2.6" fill="#39424f" />
        <circle cx="146" cy="74" r="2.6" fill="#39424f" />
        <circle cx="62" cy="150" r="2.6" fill="#39424f" />
        <circle cx="158" cy="150" r="2.6" fill="#39424f" />
      </g>
    </svg>
  )
}

export default GardenCat
