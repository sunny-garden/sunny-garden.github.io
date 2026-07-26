import { useCallback, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import styled from 'styled-components'
import { introLyrics } from '../data/proposalContent'
import AudioPlayer from '../components/proposal/AudioPlayer'
import Intro from '../components/proposal/Intro'
import MainPage from '../components/proposal/MainPage'
import SFXManager from '../components/proposal/SFXManager'

type Stage = 'intro' | 'main'

/**
 * Top-level proposal experience. Plays the animated intro, then reveals the
 * YES / NO interaction. Audio providers wrap the whole flow.
 */
const ProposalPage = () => {
  const [stage, setStage] = useState<Stage>('intro')

  const goToMain = useCallback(() => setStage('main'), [])

  return (
    <SFXManager>
      <Page>
        <AnimatePresence mode="wait">
          {stage === 'intro' ? (
            <Intro key="intro" lyrics={introLyrics} onFinish={goToMain} />
          ) : (
            <MainPage key="main" />
          )}
        </AnimatePresence>
        <AudioPlayer />
      </Page>
    </SFXManager>
  )
}

const Page = styled.main`
  position: relative;
  min-height: 100svh;
  overflow: hidden;
`

export default ProposalPage
