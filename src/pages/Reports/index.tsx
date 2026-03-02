import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import "../Settings/settings.css"

type ReportTab = "Lab Reports" | "Consultation Reports" | "Manuals"

type ReportItem = {
  title: string
  subtitle: string
  date: string
  type: string
  status?: "New" | "Updated"
}

const labReports: ReportItem[] = [
  { title: "CBC Test Report", subtitle: "Complete Blood Count", date: "Mar 01, 2026", type: "PDF", status: "New" },
  { title: "Lipid Profile", subtitle: "Cholesterol and triglycerides", date: "Feb 24, 2026", type: "PDF" },
  { title: "Vitamin D Test", subtitle: "Deficiency screening", date: "Feb 12, 2026", type: "PDF" },
]

const consultReports: ReportItem[] = [
  { title: "Dr. Riza Consultation Summary", subtitle: "Internal Medicine", date: "Feb 28, 2026", type: "Summary", status: "Updated" },
  { title: "Cardiology Teleconsult Notes", subtitle: "Dr. Sarah Chen", date: "Feb 19, 2026", type: "Notes" },
]

const manuals: ReportItem[] = [
  { title: "Medication Intake Guide", subtitle: "General dosage and timing", date: "Updated Feb 2026", type: "Guide" },
  { title: "Stress Relief Manual", subtitle: "Breathing + grounding methods", date: "Updated Jan 2026", type: "Guide" },
  { title: "Post-Lab Care Instructions", subtitle: "Hydration and recovery", date: "Updated Jan 2026", type: "Guide" },
]

export default function Reports() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<ReportTab>("Lab Reports")

  const list = useMemo(() => {
    if (tab === "Lab Reports") return labReports
    if (tab === "Consultation Reports") return consultReports
    return manuals
  }, [tab])

  return (
    <main className="account-page app-page-enter">
      <header className="account-header app-fade-stagger">
        <button className="account-back app-pressable" onClick={() => navigate(-1)} type="button" aria-label="Back">&lt;</button>
        <h1>Reports</h1>
      </header>

      <section className="account-shell app-content-slide">
        <article className="account-card app-fade-stagger">
          <h3>View and download reports</h3>
          <p>Access lab reports, consultation summaries, and care manuals in one place.</p>
        </article>

        <div className="tab-row app-fade-stagger">
          {(["Lab Reports", "Consultation Reports", "Manuals"] as const).map((item) => (
            <button key={item} className={`tab-btn app-pressable ${tab === item ? "active" : ""}`} type="button" onClick={() => setTab(item)}>
              {item}
            </button>
          ))}
        </div>

        <section className="notice-list app-fade-stagger">
          {list.map((item) => (
            <article key={`${item.title}-${item.date}`} className="notice-item">
              <h4>{item.title}</h4>
              <p>{item.subtitle}</p>
              <small>{item.date} • {item.type}{item.status ? ` • ${item.status}` : ""}</small>
            </article>
          ))}
        </section>
      </section>
    </main>
  )
}
