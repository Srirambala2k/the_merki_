import { createContext, useContext } from 'react'
import type { SceneId } from '../content'

/** What the buttons and links in the copy can do. Provided once by `App`. */
export interface Actions {
  /** Scroll to a scene, finished composing. */
  goTo: (scene: SceneId) => void
  openContact: () => void
  openWork: () => void
}

const noop: Actions = { goTo: () => {}, openContact: () => {}, openWork: () => {} }

export const ActionsContext = createContext<Actions>(noop)
export const useActions = () => useContext(ActionsContext)
