import { createContext, useContext } from 'react'
import type { SfxContextValue } from '../../types/proposal'

export const SfxContext = createContext<SfxContextValue | null>(null)

/** Access the SFX player. Returns a safe no-op if used outside the provider. */
export const useSfx = (): SfxContextValue => {
  const context = useContext(SfxContext)
  return context ?? { playSfx: () => undefined }
}
