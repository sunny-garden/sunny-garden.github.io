import { useCallback, useState } from 'react'
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion'
import styled from 'styled-components'
import { noButtonLabels, proposalCopy } from '../../data/proposalContent'
import Celebration from './Celebration'
import FloatingFish from './FloatingFish'
import Megatron from './Megatron'
import NoButton from './NoButton'
import { useSfx } from './sfxContext'
import YesButton from './YesButton'

/** The proposal interaction: a YES that grows and a NO that runs away. */
const MainPage = () => {
  const { playSfx } = useSfx()
  const [evades, setEvades] = useState(0)
  const [accepted, setAccepted] = useState(false)
  const shakeControls = useAnimationControls()

  const handleEvade = useCallback(() => {
    playSfx('no')
    setEvades((count) => count + 1)
    void shakeControls.start({
      x: [0, -10, 9, -7, 6, -3, 0],
      transition: { duration: 0.45 },
    })
  }, [playSfx, shakeControls])

  const handleAccept = useCallback(() => {
    playSfx('yes')
    setAccepted(true)
  }, [playSfx])

  const handleReplay = useCallback(() => {
    setAccepted(false)
    setEvades(0)
  }, [])

  return (
    <Root
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <FloatingFish density="lush" />

      <AnimatePresence mode="wait">
        {accepted ? (
          <Celebration key="celebration" onReplay={handleReplay} />
        ) : (
          <Scene key="ask">
            <Card
              initial={{ opacity: 0, rotateY: 82, y: 18 }}
              animate={{ opacity: 1, rotateY: 0, y: 0 }}
              transition={{ type: 'spring', stiffness: 70, damping: 14 }}
            >
              <motion.div animate={shakeControls}>
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3.8, ease: 'easeInOut', repeat: Infinity }}
                >
                  <Megatron mood="plead" glow size={132} />
                </motion.div>
                <Kicker>{proposalCopy.kicker}</Kicker>
                <Title>{proposalCopy.title}</Title>
                <Subtitle>{proposalCopy.subtitle}</Subtitle>
                <Actions>
                  <YesButton boost={evades} label={proposalCopy.yesLabel} onAccept={handleAccept} />
                  <NoButton labels={noButtonLabels} onEvade={handleEvade} />
                </Actions>
              </motion.div>
            </Card>
          </Scene>
        )}
      </AnimatePresence>
    </Root>
  )
}

const Root = styled(motion.div)`
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  overflow: hidden;
`

const Scene = styled.div`
  position: relative;
  z-index: 1;
  display: grid;
  place-items: center;
  width: 100%;
  padding: 24px;
  perspective: 1200px;
`

const Card = styled(motion.section)`
  position: relative;
  display: grid;
  justify-items: center;
  gap: 10px;
  width: min(100%, 580px);
  border: 1px solid var(--surface-border);
  border-radius: 24px;
  padding: 46px 38px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.97), rgba(234, 246, 255, 0.86)),
    var(--surface-strong);
  box-shadow: var(--shadow-soft);
  text-align: center;
  backdrop-filter: blur(20px);
  transform-style: preserve-3d;

  > div {
    display: grid;
    justify-items: center;
    gap: 10px;
    width: 100%;
  }
`

const Kicker = styled.p`
  margin: 8px 0 0;
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
  font-size: clamp(2.4rem, 7vw, 3.8rem);
  font-weight: 720;
  line-height: 1.02;
`

const Subtitle = styled.p`
  max-width: 38ch;
  margin: 4px 0 14px;
  color: var(--ink-soft);
  font-size: 1.08rem;
  line-height: 1.6;
`

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  justify-content: center;
  align-items: center;
  min-height: 60px;
`

export default MainPage
