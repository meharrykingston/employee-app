import { useState } from "react"
import { useNavigate } from "react-router-dom"
import "../Settings/settings.css"

const current = [
  { title: "Teleconsultation with Dr. Riza", at: "Today, 06:30 PM" },
  { title: "Lab Test - CBC", at: "Tomorrow, 08:00 AM" },
]

const past = [
  { title: "Pharmacy Delivery", at: "Feb 26, 2026 - Completed" },
  { title: "General Consultation", at: "Feb 19, 2026 - Completed" },
]

export default function Bookings() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<"current" | "past">("current")
  const items = tab === "current" ? current : past

  return (
    <main className="account-page app-page-enter">
      <header className="account-header app-fade-stagger">
        <button className="account-back app-pressable" onClick={() => navigate(-1)} type="button" aria-label="Back">&lt;</button>
        <h1>Bookings</h1>
      </header>
      <section className="account-shell app-content-slide">
        <div className="tab-row app-fade-stagger">
          <button className={`tab-btn app-pressable ${tab === "current" ? "active" : ""}`} onClick={() => setTab("current")} type="button">Current Bookings</button>
          <button className={`tab-btn app-pressable ${tab === "past" ? "active" : ""}`} onClick={() => setTab("past")} type="button">Past Bookings</button>
        </div>

        <div className="notice-list app-fade-stagger">
          {items.map((item) => (
            <article className="notice-item" key={item.title}>
              <h4>{item.title}</h4>
              <small>{item.at}</small>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
