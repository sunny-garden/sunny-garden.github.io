import { motion } from 'framer-motion'
import styled from 'styled-components'

const pawParticles = [
  { left: '7%', delay: 0, size: 34, duration: 11.2, rotate: -16 },
  { left: '16%', delay: 1.3, size: 24, duration: 10.4, rotate: 12 },
  { left: '27%', delay: 0.6, size: 30, duration: 11.8, rotate: -8 },
  { left: '39%', delay: 2.1, size: 22, duration: 10.8, rotate: 18 },
  { left: '52%', delay: 0.4, size: 36, duration: 12.5, rotate: -12 },
  { left: '64%', delay: 1.8, size: 25, duration: 10.2, rotate: 14 },
  { left: '74%', delay: 0.2, size: 32, duration: 12, rotate: -18 },
  { left: '83%', delay: 2.6, size: 23, duration: 10.9, rotate: 10 },
  { left: '93%', delay: 1.1, size: 31, duration: 11.4, rotate: -10 },
]

interface FloatingPawsProps {
  density?: 'calm' | 'lush'
}

const FloatingPaws = ({ density = 'calm' }: FloatingPawsProps) => {
  const visibleParticles = density === 'lush' ? pawParticles : pawParticles.slice(0, 6)

  return (
    <PawsLayer aria-hidden="true">
      {visibleParticles.map((particle, index) => (
        <Paw
          key={`${particle.left}-${particle.delay}`}
          $left={particle.left}
          $size={particle.size}
          animate={{
            y: ['8vh', '-110vh'],
            x: [0, index % 2 === 0 ? 18 : -16, 0],
            opacity: [0, 0.28, 0],
            rotate: [particle.rotate, particle.rotate + (index % 2 === 0 ? 12 : -12)],
          }}
          transition={{
            delay: particle.delay,
            duration: particle.duration,
            ease: 'easeInOut',
            repeat: Infinity,
          }}
        >
          <span className="toe toe-one" />
          <span className="toe toe-two" />
          <span className="toe toe-three" />
          <span className="pad" />
        </Paw>
      ))}
    </PawsLayer>
  )
}

const PawsLayer = styled.div`
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
`

const Paw = styled(motion.span)<{
  $left: string
  $size: number
}>`
  position: absolute;
  left: ${({ $left }) => $left};
  bottom: -12vh;
  display: block;
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  filter: drop-shadow(0 10px 18px rgba(79, 89, 101, 0.1));

  .toe,
  .pad {
    position: absolute;
    display: block;
    background: rgba(79, 89, 101, 0.36);
  }

  .toe {
    width: 21%;
    height: 24%;
    border-radius: 999px;
  }

  .toe-one {
    top: 16%;
    left: 20%;
    transform: rotate(-20deg);
  }

  .toe-two {
    top: 7%;
    left: 42%;
  }

  .toe-three {
    top: 16%;
    right: 20%;
    transform: rotate(20deg);
  }

  .pad {
    left: 24%;
    bottom: 14%;
    width: 52%;
    height: 42%;
    border-radius: 48% 48% 54% 54%;
  }
`

export default FloatingPaws