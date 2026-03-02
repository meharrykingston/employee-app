import type { NavigateFunction } from "react-router-dom"

export function goBackOrFallback(navigate: NavigateFunction, fallback = "/home") {
  const historyState = window.history.state as { idx?: number } | null
  const historyIdx = typeof historyState?.idx === "number" ? historyState.idx : 0

  if (historyIdx > 0 || window.history.length > 1) {
    navigate(-1)
    return
  }

  navigate(fallback, { replace: true })
}
