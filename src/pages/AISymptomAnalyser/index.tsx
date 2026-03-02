import { useEffect, useMemo, useState } from "react"
import {
  FiActivity,
  FiAlertTriangle,
  FiArrowLeft,
  FiClock,
  FiHeart,
  FiMessageCircle,
  FiNavigation,
  FiSearch,
} from "react-icons/fi"
import { useNavigate } from "react-router-dom"
import { goBackOrFallback } from "../../utils/navigation"
import "./ai-symptom-analyser.css"

type Specialty = "Internal Medicine" | "Cardiology" | "Dermatology" | "Pulmonology"

const symptomOptions = [
  "Fever",
  "Headache",
  "Dizziness",
  "Nausea",
  "Chest Pain",
  "Breathing Issue",
  "Cough",
  "Fatigue",
  "Skin Rash",
]

const historyOptions = ["Diabetes", "Hypertension", "Asthma", "Heart Condition", "Thyroid", "None"]

function inferSpecialty(symptoms: string[]): Specialty {
  const text = symptoms.join(" ").toLowerCase()
  if (text.includes("chest") || text.includes("heart")) return "Cardiology"
  if (text.includes("skin") || text.includes("rash")) return "Dermatology"
  if (text.includes("breathing") || text.includes("cough") || text.includes("asthma")) return "Pulmonology"
  return "Internal Medicine"
}

export default function AISymptomAnalyser() {
  const navigate = useNavigate()
  const [query, setQuery] = useState("")
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([])
  const [severity, setSeverity] = useState(58)
  const [duration, setDuration] = useState("Since today")
  const [history, setHistory] = useState<string[]>([])
  const [notes, setNotes] = useState("")
  const [isAutoRouting, setIsAutoRouting] = useState(false)

  const filteredSymptoms = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return symptomOptions
    return symptomOptions.filter((item) => item.toLowerCase().includes(q))
  }, [query])

  const specialty = useMemo(() => inferSpecialty(selectedSymptoms), [selectedSymptoms])
  const triageLevel = severity >= 75 ? "High" : severity >= 45 ? "Moderate" : "Low"
  const recommendedMode = severity >= 70 ? "OPD Visit" : "Teleconsultation"

  function toggleSymptom(name: string) {
    setSelectedSymptoms((prev) => (prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]))
  }

  function toggleHistory(name: string) {
    setHistory((prev) => {
      if (name === "None") return prev.includes("None") ? [] : ["None"]
      const base = prev.filter((item) => item !== "None")
      return base.includes(name) ? base.filter((item) => item !== name) : [...base, name]
    })
  }

  function routeToDoctors() {
    navigate("/teleconsultation", {
      state: {
        fromAiAnalyser: true,
        preselectedSpecialty: specialty,
        selectedSymptoms,
        analysisQuery: `${selectedSymptoms.join(", ")} ${notes}`.trim(),
        recommendedMode: recommendedMode === "OPD Visit" ? "opd" : "tele",
        triageLevel,
      },
    })
  }

  useEffect(() => {
    if (selectedSymptoms.length === 0) {
      setIsAutoRouting(false)
      return
    }
    setIsAutoRouting(true)
    const timer = window.setTimeout(() => {
      routeToDoctors()
    }, 950)
    return () => window.clearTimeout(timer)
  }, [selectedSymptoms, severity, duration, history, notes, specialty, triageLevel, recommendedMode])

  return (
    <main className="symptom-analyser-page app-page-enter">
      <header className="symptom-analyser-header app-fade-stagger">
        <button className="analyser-back app-pressable" onClick={() => goBackOrFallback(navigate)} type="button" aria-label="Back">
          <FiArrowLeft />
        </button>
        <div>
          <h1>AI Symptom Analyser</h1>
          <p>Advanced triage before OPD consultation</p>
        </div>
      </header>

      <section className="symptom-analyser-content app-content-slide">
        <section className="analyser-search app-fade-stagger">
          <FiSearch />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search symptoms, e.g. chest pain"
          />
        </section>

        <section className="analyser-panel app-fade-stagger">
          <h2>Symptoms</h2>
          <div className="chip-grid">
            {filteredSymptoms.map((item) => (
              <button
                key={item}
                className={`analyser-chip app-pressable ${selectedSymptoms.includes(item) ? "active" : ""}`}
                onClick={() => toggleSymptom(item)}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        <section className="analyser-panel app-fade-stagger">
          <h2>Duration</h2>
          <div className="duration-row">
            {["Since today", "2-3 days", "1 week+", "Recurring"].map((item) => (
              <button
                key={item}
                type="button"
                className={`duration-btn app-pressable ${duration === item ? "active" : ""}`}
                onClick={() => setDuration(item)}
              >
                <FiClock />
                {item}
              </button>
            ))}
          </div>
        </section>

        <section className="analyser-panel app-fade-stagger">
          <h2>Severity</h2>
          <div className="severity-wrap">
            <input
              type="range"
              min={0}
              max={100}
              value={severity}
              onChange={(e) => setSeverity(Number(e.target.value))}
            />
            <div className="severity-meta">
              <span>{severity}/100</span>
              <b className={triageLevel.toLowerCase()}>{triageLevel} priority</b>
            </div>
          </div>
        </section>

        <section className="analyser-panel app-fade-stagger">
          <h2>Medical History</h2>
          <div className="history-grid">
            {historyOptions.map((item) => (
              <button
                key={item}
                type="button"
                className={`history-chip app-pressable ${history.includes(item) ? "active" : ""}`}
                onClick={() => toggleHistory(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        <section className="analyser-panel app-fade-stagger">
          <h2>Additional Notes</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Describe triggers, pain level, recent medication, or anything important"
          />
        </section>

        <section className="analyser-summary app-fade-stagger">
          <article>
            <span><FiActivity /></span>
            <div>
              <h3>Best match specialty</h3>
              <p>{specialty}</p>
            </div>
          </article>
          <article>
            <span><FiAlertTriangle /></span>
            <div>
              <h3>Triage level</h3>
              <p>{triageLevel}</p>
            </div>
          </article>
          <article>
            <span><FiNavigation /></span>
            <div>
              <h3>Recommended visit</h3>
              <p>{recommendedMode}</p>
            </div>
          </article>
        </section>
      </section>

      <footer className="symptom-analyser-footer app-fade-stagger">
        <button className="analyser-secondary app-pressable" type="button" onClick={() => navigate("/ai-chat")}>
          <FiMessageCircle />
          Ask AI Chat First
        </button>
        <p className="auto-route-text">
          {isAutoRouting ? "Matching best doctor category and opening options..." : "Select symptoms to auto-match doctor category"}
        </p>
      </footer>

      <span className="analyser-watermark" aria-hidden="true">
        <FiHeart />
      </span>
    </main>
  )
}
