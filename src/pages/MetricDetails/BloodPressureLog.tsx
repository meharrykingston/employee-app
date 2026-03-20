import { useEffect, useMemo, useState } from "react"
import { FiActivity, FiArrowLeft } from "react-icons/fi"
import { useNavigate } from "react-router-dom"
import { getLatestVital, getVitalHistory, saveVitalReading } from "../../services/vitalsApi"
import "./metric-details.css"

type ReadingRow = { sys: number; dia: number; eventAt: string }

export default function BloodPressureLog() {
  const navigate = useNavigate()
  const [bpSysInput, setBpSysInput] = useState("")
  const [bpDiaInput, setBpDiaInput] = useState("")
  const [bpSaveStatus, setBpSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [bpSaveError, setBpSaveError] = useState("")
  const [latest, setLatest] = useState<ReadingRow | null>(null)
  const [history, setHistory] = useState<ReadingRow[]>([])

  const latestLabel = useMemo(() => {
    if (!latest?.eventAt) return "No recent log"
    return new Date(latest.eventAt).toLocaleString("en-IN", { hour: "numeric", minute: "2-digit", day: "numeric", month: "short" })
  }, [latest])

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const [sys, dia] = await Promise.all([
          getLatestVital("blood_pressure_sys"),
          getLatestVital("blood_pressure_dia"),
        ])
        if (!active) return
        if (typeof sys?.value === "number" && typeof dia?.value === "number") {
          setLatest({ sys: sys.value, dia: dia.value, eventAt: sys.eventAt || dia.eventAt || new Date().toISOString() })
        }
        const [sysHistory, diaHistory] = await Promise.all([
          getVitalHistory("blood_pressure_sys", 12),
          getVitalHistory("blood_pressure_dia", 12),
        ])
        if (!active) return
        const paired: ReadingRow[] = []
        const sysPoints = sysHistory?.points ?? []
        const diaPoints = diaHistory?.points ?? []
        const maxLen = Math.max(sysPoints.length, diaPoints.length)
        for (let i = 0; i < maxLen; i += 1) {
          const sysPoint = sysPoints[i]
          const diaPoint = diaPoints[i]
          if (!sysPoint || !diaPoint) continue
          paired.push({
            sys: sysPoint.value,
            dia: diaPoint.value,
            eventAt: sysPoint.eventAt || diaPoint.eventAt || new Date().toISOString(),
          })
        }
        setHistory(paired.slice(0, 8))
      } catch {
        // keep fallback
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [])

  const saveBloodPressure = async () => {
    const sys = Number(bpSysInput)
    const dia = Number(bpDiaInput)
    if (!Number.isFinite(sys) || !Number.isFinite(dia) || sys <= 0 || dia <= 0) {
      setBpSaveError("Enter valid systolic and diastolic values.")
      setBpSaveStatus("error")
      return
    }
    setBpSaveError("")
    setBpSaveStatus("saving")
    try {
      await Promise.all([
        saveVitalReading({ metric: "blood_pressure_sys", value: sys, unit: "mmHg", source: "manual" }),
        saveVitalReading({ metric: "blood_pressure_dia", value: dia, unit: "mmHg", source: "manual" }),
      ])
      setBpSaveStatus("saved")
      const eventAt = new Date().toISOString()
      setLatest({ sys, dia, eventAt })
      setHistory((prev) => [{ sys, dia, eventAt }, ...prev].slice(0, 8))
      setBpSysInput("")
      setBpDiaInput("")
    } catch (error) {
      setBpSaveStatus("error")
      setBpSaveError(error instanceof Error ? error.message : "Unable to save blood pressure.")
    }
  }

  return (
    <main className="metric-detail-page app-page-enter">
      <header className="metric-detail-header app-fade-stagger">
        <button className="metric-back app-pressable" type="button" onClick={() => navigate(-1)} aria-label="Back">
          <FiArrowLeft />
        </button>
        <h1>Log Blood Pressure</h1>
      </header>

      <section className="metric-detail-shell app-content-slide">
        <article className="metric-hero blue app-fade-stagger">
          <span className="hero-icon"><FiActivity /></span>
          <div>
            <h2>{latest ? `${Math.round(latest.sys)}/${Math.round(latest.dia)}` : "—"} <small>mmHg</small></h2>
            <p>{latest ? `Last updated ${latestLabel}` : "Log your latest reading"}</p>
          </div>
        </article>

        <article className="metric-measure-card app-fade-stagger">
          <div>
            <h3>Enter latest reading</h3>
            <p>Use the reading from your BP device to keep tracking accurate.</p>
          </div>
          <div className="bp-input-grid">
            <label className="bp-input">
              <span>Systolic</span>
              <input
                inputMode="numeric"
                placeholder="120"
                value={bpSysInput}
                onChange={(e) => setBpSysInput(e.target.value.replace(/[^0-9]/g, ""))}
              />
            </label>
            <label className="bp-input">
              <span>Diastolic</span>
              <input
                inputMode="numeric"
                placeholder="80"
                value={bpDiaInput}
                onChange={(e) => setBpDiaInput(e.target.value.replace(/[^0-9]/g, ""))}
              />
            </label>
          </div>
          {bpSaveStatus === "error" && <p className="bp-error">{bpSaveError}</p>}
          {bpSaveStatus === "saved" && <p className="bp-success">Saved successfully.</p>}
          <button className="measure-btn app-pressable" type="button" onClick={saveBloodPressure} disabled={bpSaveStatus === "saving"}>
            {bpSaveStatus === "saving" ? "Saving..." : "Save Blood Pressure"}
          </button>
        </article>

        <article className="metric-log-card app-fade-stagger">
          <h3>Recent logs</h3>
          {history.length === 0 && <p className="metric-log-empty">No logs yet.</p>}
          {history.map((row, index) => (
            <div key={`${row.eventAt}-${index}`} className="metric-log-row">
              <div>
                <strong>{row.sys}/{row.dia} mmHg</strong>
                <span>{new Date(row.eventAt).toLocaleString("en-IN", { hour: "numeric", minute: "2-digit", day: "numeric", month: "short" })}</span>
              </div>
            </div>
          ))}
        </article>
      </section>
    </main>
  )
}
