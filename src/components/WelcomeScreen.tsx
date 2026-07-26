import { motion } from 'framer-motion'
import styled from 'styled-components'
import { playUiSound } from '../services/soundEffects'
import CatFace from './CatFace'
import FloatingPaws from './FloatingPaws'

interface WelcomeScreenProps {
  onStart: () => void
}

const WelcomeScreen = ({ onStart }: WelcomeScreenProps) => {
  const handleStart = () => {
    playUiSound('transition')
    onStart()
  }

  return (
    <WelcomeStage>
      <FloatingPaws density="lush" />
      <WelcomeCard
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 120, damping: 18 }}
      >
        <CatBadge>
          <CatFace size="lg" label="Gray cat face" />
        </CatBadge>

        <Kicker>Paw Print Check-In</Kicker>
        <Title
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.55 }}
        >
          A calm little quiz in blue and white.
        </Title>
        <CatDivider aria-hidden="true">
          <span />
          <CatFace size="sm" />
          <span />
        </CatDivider>
        <Message
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32, duration: 0.55 }}
        >
          Answer each prompt with YES, NO, or Custom Answer. The whole space is soft, simple,
          and made to be easy to read at a glance.
        </Message>
        <StartButton
          type="button"
          onClick={handleStart}
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.95 }}
        >
          Start
        </StartButton>
      </WelcomeCard>
    </WelcomeStage>
  )
}

const WelcomeStage = styled.main`
  position: relative;
  display: grid;
  place-items: center;
  min-height: 100svh;
  padding: max(24px, env(safe-area-inset-top)) 18px max(24px, env(safe-area-inset-bottom));
  overflow: hidden;
`

const WelcomeCard = styled(motion.section)`
  position: relative;
  z-index: 1;
  display: grid;
  justify-items: center;
  width: min(100%, 660px);
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  padding: 54px 48px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.97), rgba(234, 246, 255, 0.84)),
    var(--surface-strong);
  box-shadow:
    var(--shadow-soft),
    inset 0 0 0 1px rgba(255, 255, 255, 0.58);
  text-align: center;
  backdrop-filter: blur(22px);

  &::before,
  &::after {
    position: absolute;
    content: '';
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.62);
    box-shadow: inset 0 0 0 1px rgba(83, 145, 199, 0.18);
  }

  &::before {
    top: 18px;
    left: 18px;
    width: 42px;
    height: 42px;
  }

  &::after {
    right: 24px;
    bottom: 22px;
    width: 28px;
    height: 28px;
  }

  @media (max-width: 560px) {
    padding: 36px 20px;
  }
`

const CatBadge = styled.div`
  display: grid;
  place-items: center;
  width: 104px;
  height: 104px;
  border: 1px solid rgba(83, 145, 199, 0.26);
  border-radius: 999px;
  margin-bottom: 18px;
  background: rgba(255, 255, 255, 0.76);
  box-shadow:
    inset 0 0 0 10px rgba(234, 246, 255, 0.74),
    0 20px 42px rgba(7, 60, 116, 0.12);
`

const Kicker = styled.p`
  margin: 0 0 12px;
  color: var(--blue-strong);
  font-size: 0.92rem;
  font-weight: 900;
  letter-spacing: 0.18em;
  text-transform: uppercase;
`

const Title = styled(motion.h1)`
  max-width: 12ch;
  margin: 0;
  color: var(--ink-strong);
  font-family: var(--serif);
  font-size: 4.8rem;
  font-weight: 760;
  line-height: 0.98;
  letter-spacing: 0;

  @media (max-width: 720px) {
    font-size: 3.7rem;
  }

  @media (max-width: 460px) {
    font-size: 2.65rem;
  }
`

const CatDivider = styled.div`
  display: grid;
  grid-template-columns: minmax(44px, 1fr) auto minmax(44px, 1fr);
  gap: 10px;
  align-items: center;
  width: min(100%, 280px);
  margin-top: 18px;

  span {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(83, 145, 199, 0.42), transparent);
  }
`

const Message = styled(motion.p)`
  max-width: 54ch;
  margin: 22px 0 30px;
  color: var(--ink-soft);
  font-size: 1.1rem;
  line-height: 1.7;
  letter-spacing: 0;

  @media (max-width: 460px) {
    font-size: 1rem;
  }
`

const StartButton = styled(motion.button)`
  min-width: 180px;
  min-height: 56px;
  border: 0;
  border-radius: 999px;
  padding: 16px 28px;
  color: white;
  background: linear-gradient(135deg, var(--blue-bright), var(--blue-deep));
  box-shadow: 0 18px 46px rgba(7, 60, 116, 0.24);
  font: inherit;
  font-weight: 900;
  font-size: 1.08rem;
  letter-spacing: 0;
  cursor: pointer;

  &:focus-visible {
    outline: 3px solid rgba(11, 104, 189, 0.42);
    outline-offset: 5px;
  }
`

export default WelcomeScreen