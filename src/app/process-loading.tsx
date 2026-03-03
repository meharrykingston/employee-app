import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import "./process-loading.css"

type ProcessLoadingContextType = {
  start: () => void
  stop: () => void
}

const ProcessLoadingContext = createContext<ProcessLoadingContextType | null>(null)

export function ProcessLoadingProvider({ children }: { children: ReactNode }) {
  const [pendingCount, setPendingCount] = useState(0)

  const start = useCallback(() => {
    setPendingCount((prev) => prev + 1)
  }, [])

  const stop = useCallback(() => {
    setPendingCount((prev) => Math.max(0, prev - 1))
  }, [])

  const value = useMemo(() => ({ start, stop }), [start, stop])

  return (
    <ProcessLoadingContext.Provider value={value}>
      {children}
      {pendingCount > 0 && (
        <div className="process-loading-overlay" aria-live="polite" aria-label="Processing">
          <div className="process-loading-card" role="status" aria-label="Please wait">
            <div className="process-loading-spinner" aria-hidden="true" />
          </div>
        </div>
      )}
    </ProcessLoadingContext.Provider>
  )
}

export function useProcessLoading() {
  const context = useContext(ProcessLoadingContext)
  if (!context) {
    throw new Error("useProcessLoading must be used inside ProcessLoadingProvider")
  }
  return context
}
