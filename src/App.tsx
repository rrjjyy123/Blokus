import { useCallback, useEffect, useReducer, useState } from 'react'
import { GameScreen } from './components/GameScreen'
import { SetupScreen } from './components/SetupScreen'
import { EMPTY_STATE, gameReducer } from './state/gameReducer'
import { clearGame, loadGame, saveGame } from './state/persistence'
import type { GameConfig, GameState } from './game/types'

type AppAction = Parameters<typeof gameReducer>[1] | { type: 'RESUME'; state: GameState }

function rootReducer(state: GameState, action: AppAction): GameState {
  if (action.type === 'RESUME') return action.state
  return gameReducer(state, action)
}

export default function App() {
  const [state, dispatch] = useReducer(rootReducer, EMPTY_STATE)
  const [saved, setSaved] = useState<GameState | null>(() => loadGame())

  // 진행 상황 자동 저장
  useEffect(() => {
    if (state.phase === 'playing') saveGame(state)
    if (state.phase === 'over') clearGame()
  }, [state])

  const startGame = useCallback((config: GameConfig) => {
    clearGame()
    setSaved(null)
    dispatch({ type: 'NEW_GAME', config })
  }, [])

  const resumeGame = useCallback(() => {
    if (saved) dispatch({ type: 'RESUME', state: saved })
  }, [saved])

  const backToSetup = useCallback(() => {
    clearGame()
    setSaved(null)
    dispatch({ type: 'RESUME', state: EMPTY_STATE })
  }, [])

  if (state.phase === 'setup') {
    return (
      <div className="app">
        <SetupScreen onStart={startGame} onResume={resumeGame} hasSavedGame={saved !== null} />
      </div>
    )
  }

  return (
    <div className="app">
      <GameScreen state={state} dispatch={dispatch} onNewSetup={backToSetup} />
    </div>
  )
}
