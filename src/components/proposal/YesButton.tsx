import { motion } from 'framer-motion'
import styled from 'styled-components'
import { PawGlyph } from './CatGlyphs'

interface YesButtonProps {
  /** Number of times the NO button has run away. Grows the button. */
  boost: number
  label: string
  onAccept: () => void
}

const MAX_SCALE = 2.0
const GROWTH_PER_EVADE = 0.14

/** The inviting YES button. It swells each time NO runs away. */
const YesButton = ({ boost, label, onAccept }: YesButtonProps) => {
  const scale = Math.min(1 + boost * GROWTH_PER_EVADE, MAX_SCALE)

  return (
    <Button
      type="button"
      onClick={onAccept}
      animate={{ scale }}
      transition={{ type: 'spring', stiffness: 300, damping: 16 }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: scale * 0.94 }}
    >
      <PawGlyph size={22} />
      {label}
    </Button>
  )
}

const Button = styled(motion.button)`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 58px;
  padding: 16px 32px;
  border: 0;
  border-radius: 999px;
  color: #ffffff;
  background: linear-gradient(135deg, var(--blue-bright), var(--blue-deep));
  box-shadow: 0 18px 46px rgba(7, 60, 116, 0.32);
  font-weight: 900;
  font-size: 1.1rem;
  white-space: nowrap;
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  -webkit-user-select: none;

  @media (max-width: 420px) {
    min-height: 52px;
    padding: 14px 24px;
    font-size: 1rem;
  }

  svg {
    color: rgba(255, 255, 255, 0.92);
  }
`

export default YesButton
