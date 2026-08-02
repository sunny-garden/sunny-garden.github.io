import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { proposalCopy } from '../../data/proposalContent'
import { FishGlyph, PawGlyph } from './CatGlyphs'
import GardenCat from './GardenCat'

interface CelebrationProps {
  onReplay: () => void
}

interface ConfettiPiece {
  id: number
  x: number
  rotate: number
  delay: number
  duration: number
  size: number
  kind: 'fish' | 'paw'
}

const buildConfetti = (): ConfettiPiece[] =>
  Array.from({ length: 26 }, (_, index) => ({
    id: index,
    x: (Math.random() - 0.5) * 2 * 46,
    rotate: (Math.random() - 0.5) * 360,
    delay: Math.random() * 0.5,
    duration: 2.4 + Math.random() * 1.6,
    size: 18 + Math.random() * 18,
    kind: index % 2 === 0 ? 'fish' : 'paw',
  }))

/** Joyful YES screen: confetti, a beaming mecha-cat and a path onward. */
const Celebration = ({ onReplay }: CelebrationProps) => {
  const confetti = useMemo(() => buildConfetti(), [])

  return (
    <Root
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Confetti aria-hidden="true">
        {confetti.map((piece) => (
          <Piece
            key={piece.id}
            $left={`${50 + piece.x}%`}
            initial={{ y: '38vh', opacity: 0, rotate: 0 }}
            animate={{ y: '-60vh', opacity: [0, 1, 1, 0], rotate: piece.rotate }}
            transition={{
              duration: piece.duration,
              delay: piece.delay,
              ease: 'easeOut',
              repeat: Infinity,
              repeatDelay: 0.4,
            }}
          >
            {piece.kind === 'fish' ? (
              <FishGlyph size={piece.size} />
            ) : (
              <PawGlyph size={piece.size} />
            )}
          </Piece>
        ))}
      </Confetti>

      <Card
        initial={{ opacity: 0, y: 26, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 140, damping: 16 }}
      >
        <motion.div
          animate={{ y: [0, -10, 0], rotate: [-2, 2, -2] }}
          transition={{ duration: 3.6, ease: 'easeInOut', repeat: Infinity }}
        >
          <GardenCat mood="happy" glow size={148} />
        </motion.div>
        <Kicker>{proposalCopy.celebrationKicker}</Kicker>
        <Title>{proposalCopy.celebrationTitle}</Title>
        <Message>{proposalCopy.celebrationMessage}</Message>
        <Actions>
          <ReplayButton type="button" onClick={onReplay} whileHover={{ y: -3 }} whileTap={{ scale: 0.95 }}>
            Ask me again
          </ReplayButton>
          <QuizLink to="/quiz">Take the little quiz</QuizLink>
        </Actions>
      </Card>
    </Root>
  )
}

const Root = styled(motion.div)`
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 24px;
`

const Confetti = styled.div`
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
`

const Piece = styled(motion.span)<{ $left: string }>`
  position: absolute;
  left: ${({ $left }) => $left};
  top: 0;
  color: rgba(31, 143, 229, 0.7);
`

const Card = styled(motion.section)`
  position: relative;
  z-index: 1;
  display: grid;
  justify-items: center;
  gap: 12px;
  width: min(100%, 560px);
  border: 1px solid var(--surface-border);
  border-radius: 24px;
  padding: 44px 36px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.97), rgba(234, 246, 255, 0.86)),
    var(--surface-strong);
  box-shadow: var(--shadow-soft);
  text-align: center;
  backdrop-filter: blur(20px);

  @media (max-width: 420px) {
    padding: 30px 18px;
    border-radius: 20px;
    gap: 10px;
  }
`

const Kicker = styled.p`
  margin: 6px 0 0;
  color: var(--blue-strong);
  font-size: 0.86rem;
  font-weight: 900;
  letter-spacing: 0.22em;
  text-transform: uppercase;
`

const Title = styled.h1`
  margin: 0;
  color: var(--ink-strong);
  font-family: var(--serif);
  font-size: clamp(1.8rem, 6vw, 3.4rem);
  font-weight: 720;
  line-height: 1.04;

  @media (max-width: 420px) {
    font-size: clamp(1.5rem, 8vw, 2.4rem);
  }
`

const Message = styled.p`
  max-width: 42ch;
  margin: 4px 0 8px;
  color: var(--ink-soft);
  font-size: 1.06rem;
  line-height: 1.65;
`

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
`

const ReplayButton = styled(motion.button)`
  min-height: 52px;
  padding: 14px 28px;
  border: 0;
  border-radius: 999px;
  color: #ffffff;
  background: linear-gradient(135deg, var(--blue-bright), var(--blue-deep));
  box-shadow: 0 16px 38px rgba(7, 60, 116, 0.28);
  font-weight: 900;
  font-size: 1rem;
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  -webkit-user-select: none;

  @media (max-width: 420px) {
    min-height: 48px;
    padding: 12px 22px;
    font-size: 0.92rem;
  }
`

const QuizLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  min-height: 52px;
  padding: 14px 26px;
  border: 1px solid var(--surface-border);
  border-radius: 999px;
  color: var(--blue-deep);
  background: rgba(255, 255, 255, 0.86);
  font-weight: 800;
  font-size: 1rem;
  text-decoration: none;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  -webkit-user-select: none;

  @media (max-width: 420px) {
    min-height: 48px;
    padding: 12px 22px;
    font-size: 0.92rem;
  }
`

export default Celebration
