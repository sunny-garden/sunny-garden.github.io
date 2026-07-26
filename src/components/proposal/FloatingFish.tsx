import { motion } from 'framer-motion'
import styled from 'styled-components'
import { FishGlyph, PawGlyph } from './CatGlyphs'

interface FloatingParticle {
  left: string
  delay: number
  size: number
  duration: number
  drift: number
  kind: 'fish' | 'paw'
}

const particles: FloatingParticle[] = [
  { left: '6%', delay: 0, size: 34, duration: 12.2, drift: 22, kind: 'fish' },
  { left: '15%', delay: 1.4, size: 24, duration: 10.6, drift: -18, kind: 'paw' },
  { left: '26%', delay: 0.6, size: 30, duration: 12.8, drift: 16, kind: 'fish' },
  { left: '38%', delay: 2.2, size: 22, duration: 11.1, drift: -20, kind: 'paw' },
  { left: '50%', delay: 0.3, size: 38, duration: 13.4, drift: 24, kind: 'fish' },
  { left: '62%', delay: 1.9, size: 25, duration: 10.8, drift: -16, kind: 'paw' },
  { left: '73%', delay: 0.2, size: 32, duration: 12.6, drift: 20, kind: 'fish' },
  { left: '83%', delay: 2.7, size: 23, duration: 11.3, drift: -14, kind: 'paw' },
  { left: '92%', delay: 1.1, size: 31, duration: 12.0, drift: 18, kind: 'fish' },
]

interface FloatingFishProps {
  density?: 'calm' | 'lush'
}

/** Ambient layer of fish and paw prints drifting gently up the screen. */
const FloatingFish = ({ density = 'calm' }: FloatingFishProps) => {
  const visible = density === 'lush' ? particles : particles.slice(0, 6)

  return (
    <Layer aria-hidden="true">
      {visible.map((particle, index) => (
        <Drifter
          key={`${particle.left}-${particle.delay}`}
          $left={particle.left}
          animate={{
            y: ['6vh', '-112vh'],
            x: [0, particle.drift, 0],
            opacity: [0, 0.32, 0],
            rotate: [index % 2 === 0 ? -10 : 10, index % 2 === 0 ? 12 : -12],
          }}
          transition={{
            delay: particle.delay,
            duration: particle.duration,
            ease: 'easeInOut',
            repeat: Infinity,
          }}
        >
          {particle.kind === 'fish' ? (
            <FishGlyph size={particle.size} />
          ) : (
            <PawGlyph size={particle.size} />
          )}
        </Drifter>
      ))}
    </Layer>
  )
}

const Layer = styled.div`
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
`

const Drifter = styled(motion.span)<{ $left: string }>`
  position: absolute;
  left: ${({ $left }) => $left};
  bottom: -14vh;
  display: block;
  color: rgba(31, 143, 229, 0.34);
  filter: drop-shadow(0 8px 16px rgba(7, 60, 116, 0.12));
`

export default FloatingFish
