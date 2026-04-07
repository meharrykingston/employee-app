import { useEffect, useMemo, useState } from "react"
import { FiArrowLeft, FiDroplet } from "react-icons/fi"
import { useNavigate } from "react-router-dom"
import { getLatestVital, getVitalHistory, saveVitalReading } from "../../services/vitalsApi"
import "./metric-details.css"

type SugarRow = { value: number; eventAt: string }

export default function SugarLog() {
  const navigate = useNavigate()
  const [sugarInput, setSugarInput] = useState("")
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [saveError, setSaveError] = useState("")
  const [latest, setLatest] = useState<SugarRow | null>(null)
  const [history, setHistory] = useState<SugarRow[]>([])

  const latestLabel = useMemo(() => {
    if (!latest?.eventAt) return "No recent log"
    return new Date(latest.eventAt).toLocaleString("en-IN", { hour: "numeric", minute: "2-digit", day: "numeric", month: "short" })
  }, [latest])

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const latestRes = await getLatestVital("blood_sugar")
        if (!active) return
        if (typeof latestRes?.value === "number") {
          setLatest({ value: latestRes.value, eventAt: latestRes.eventAt || new Date().toISOString() })
        }
        const historyRes = await getVitalHistory("blood_sugar", 12)
        if (!active) return
        const points = historyRes?.points ?? []
        const mapped = points.map((point) => ({
          value: point.value,
          eventAt: point.eventAt || new Date().toISOString(),
        }))
        setHistory(mapped.slice(0, 8))
      } catch {
        // keep fallback
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [])

  const saveSugar = async () => {
    const value = Number(sugarInput)
    if (!Number.isFinite(value) || value <= 0) {
      setSaveError("Enter a valid sugar value.")
      setSaveStatus("error")
      return
    }
    setSaveError("")
    setSaveStatus("saving")
    try {
      await saveVitalReading({ metric: "blood_sugar", value, unit: "mg/dL", source: "manual" })
      const eventAt = new Date().toISOString()
      setLatest({ value, eventAt })
      setHistory((prev) => [{ value, eventAt }, ...prev].slice(0, 8))
      setSugarInput("")
      setSaveStatus("saved")
    } catch (error) {
      setSaveStatus("error")
      setSaveError(error instanceof Error ? error.message : "Unable to save sugar.")
    }
  }

  return (
    <main className="metric-detail-page app-page-enter">
      <header className="metric-detail-header app-fade-stagger">
        <button className="metric-back app-pressable" type="button" onClick={() => navigate(-1)} aria-label="Back">
          <FiArrowLeft />
        </button>
        <h1>Log Blood Sugar</h1>
      </header>

      <section className="metric-detail-shell app-content-slide">
        <article className="metric-hero green app-fade-stagger">
          <span className="hero-icon"><FiDroplet /></span>
          <div>
            <h2>{latest ? Math.round(latest.value) : "—"} <small>mg/dL</small></h2>
            <p>{latest ? `Last updated ${latestLabel}` : "Log your latest reading"}</p>
          </div>
        </article>

        <article className="metric-measure-card app-fade-stagger">
          <div>
            <h3>Enter latest reading</h3>
            <p>Use the reading from your glucometer to keep tracking accurate.</p>
          </div>
          <div className="bp-input-grid">
            <label className="bp-input bp-input--single">
              <span>Blood Sugar</span>
              <input
                inputMode="numeric"
                placeholder="110"
                value={sugarInput}
                onChange={(e) => setSugarInput(e.target.value.replace(/[^0-9]/g, ""))}
              />
            </label>
          </div>
          {saveStatus === "error" && <p className="bp-error">{saveError}</p>}
          {saveStatus === "saved" && <p className="bp-success">Saved successfully.</p>}
          <button className="measure-btn app-pressable" type="button" onClick={saveSugar} disabled={saveStatus === "saving"}>
            {saveStatus === "saving" ? "Saving..." : "Save Blood Sugar"}
          </button>
        </article>

        <article className="metric-log-card app-fade-stagger">
          <h3>Recent logs</h3>
          {history.length === 0 && <p className="metric-log-empty">No logs yet.</p>}
          {history.map((row, index) => (
            <div key={`${row.eventAt}-${index}`} className="metric-log-row">
              <div>
                <strong>{Math.round(row.value)} mg/dL</strong>
                <span>{new Date(row.eventAt).toLocaleString("en-IN", { hour: "numeric", minute: "2-digit", day: "numeric", month: "short" })}</span>
              </div>
            </div>
          ))}
        </article>
      </section>
    </main>
  )
}
