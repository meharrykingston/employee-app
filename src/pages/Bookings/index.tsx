import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import "../Settings/settings.css"

type TeleBooking = {
  id: string
  sessionId: string
  doctorId: string
  doctorName: string
  specialty: string
  scheduledAt: string
  joinWindowStart: string
}

const TELE_BOOKINGS_KEY = "teleconsult_bookings"

const past = [
  { title: "Pharmacy Delivery", at: "Feb 26, 2026 - Completed" },
  { title: "General Consultation", at: "Feb 19, 2026 - Completed" },
]

export default function Bookings() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<"current" | "past">("current")
  const teleBookings = useMemo(() => {
    const raw = localStorage.getItem(TELE_BOOKINGS_KEY)
    if (!raw) return [] as TeleBooking[]
    try {
      return JSON.parse(raw) as TeleBooking[]
    } catch {
      return [] as TeleBooking[]
    }
  }, [])

  const now = Date.now()
  const current = teleBookings.map((booking) => {
    const scheduled = new Date(booking.scheduledAt)
    return {
      id: booking.id,
      title: `Teleconsultation with ${booking.doctorName}`,
      at: scheduled.toLocaleString(),
      scheduledAt: booking.scheduledAt,
      joinWindowStart: booking.joinWindowStart,
      sessionId: booking.sessionId,
      doctorId: booking.doctorId,
    }
  })
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
          {items.map((item: any) => {
            const canJoin = item.joinWindowStart ? now >= Date.parse(item.joinWindowStart) : false
            return (
              <article className="notice-item" key={item.id || item.title}>
                <h4>{item.title}</h4>
                <small>{item.at}</small>
                {!canJoin && item.joinWindowStart && (
                  <span className="notice-meta">Join opens 1 minute before the slot.</span>
                )}
                {canJoin && item.sessionId && (
                  <button
                    className="app-pressable"
                    type="button"
                    onClick={() =>
                      navigate("/teleconsultation", {
                        state: {
                          startVideo: true,
                          selectedDoctorId: item.doctorId,
                          teleconsultSessionId: item.sessionId,
                          scheduledAt: item.scheduledAt,
                        },
                      })
                    }
                  >
                    Join Call
                  </button>
                )}
              </article>
            )
          })}
        </div>
      </section>
    </main>
  )
}
