import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import "../Settings/settings.css"
import { ensureEmployeeActor } from "../../services/actorsApi"
import { addNotification } from "../../services/notificationCenter"
import { getLabOrders, type LabOrder } from "../../services/labApi"

type ReportTab = "Lab Reports" | "Consultation Reports" | "Manuals"

type ReportItem = {
  title: string
  subtitle: string
  date: string
  type: string
  status?: "New" | "Updated"
  actionLabel?: string
  action?: () => void
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
  const [labOrders, setLabOrders] = useState<LabOrder[]>([])

  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const actor = await ensureEmployeeActor({ companyReference: "astikan-demo-company", companyName: "Astikan" })
        const orders = await getLabOrders(actor.employeeUserId)
        if (active) setLabOrders(orders)
        if (active) {
          orders
            .filter((order) => order.status.toLowerCase().includes("report"))
            .forEach((order) => {
              const key = `lab_report_notified:${order.id}`
              if (localStorage.getItem(key)) return
              localStorage.setItem(key, "1")
              void addNotification({
                title: "Lab report ready",
                body: `${order.testName} report is now available.`,
                channel: "health",
                cta: { label: "View Report", route: `/lab-tests/report/${order.id}` },
              })
            })
        }
      } catch {
        // fallback to static list
      }
    })()
    return () => {
      active = false
    }
  }, [])

  const list = useMemo(() => {
    if (tab === "Lab Reports") {
      const dynamic = labOrders
        .filter((order) => order.status.toLowerCase().includes("report"))
        .map((order) => ({
          title: order.testName,
          subtitle: "Lab report ready",
          date: new Date(order.createdAt).toLocaleDateString(),
          type: "PDF",
          status: "New" as const,
          actionLabel: "View Report",
          action: () => navigate(`/lab-tests/report/${order.id}`),
        }))
      return dynamic.length ? dynamic : labReports
    }
    if (tab === "Consultation Reports") return consultReports
    return manuals
  }, [tab, labOrders, navigate])

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
              {item.actionLabel && (
                <button className="app-pressable" type="button" onClick={item.action}>
                  {item.actionLabel}
                </button>
              )}
            </article>
          ))}
        </section>
      </section>
    </main>
  )
}
