import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import "../Settings/settings.css"
import { ensureEmployeeActor } from "../../services/actorsApi"
import { getLabOrders, type LabOrder } from "../../services/labApi"

type TeleBooking = {
  id: string
  sessionId: string
  doctorId: string
  doctorName: string
  specialty: string
  status?: string
  scheduledAt: string
  joinWindowStart: string
}

const TELE_BOOKINGS_KEY = "teleconsult_bookings"
const LAB_BOOKINGS_KEY = "lab_bookings"

const past = [
  { title: "Pharmacy Delivery", at: "Feb 26, 2026 - Completed" },
  { title: "General Consultation", at: "Feb 19, 2026 - Completed" },
]

export default function Bookings() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<"current" | "past">("current")
  const [labOrders, setLabOrders] = useState<LabOrder[]>([])
  const teleBookings = useMemo(() => {
    const raw = localStorage.getItem(TELE_BOOKINGS_KEY)
    if (!raw) return [] as TeleBooking[]
    try {
      return JSON.parse(raw) as TeleBooking[]
    } catch {
      return [] as TeleBooking[]
    }
  }, [])
  const labBookings = useMemo(() => {
    const raw = localStorage.getItem(LAB_BOOKINGS_KEY)
    if (!raw) return [] as Array<{
      id: string
      bookingId: string
      status: string
      testName: string
      collectionType: string
      scheduledAt: string
    }>
    try {
      return JSON.parse(raw) as Array<{
        id: string
        bookingId: string
        status: string
        testName: string
        collectionType: string
        scheduledAt: string
      }>
    } catch {
      return []
    }
  }, [])

  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const actor = await ensureEmployeeActor({ companyReference: "astikan-demo-company", companyName: "Astikan" })
        const orders = await getLabOrders(actor.employeeUserId)
        if (!active) return
        setLabOrders(orders)
        if (orders.length) {
          const mapped = orders.map((item) => ({
            id: item.id,
            bookingId: item.providerOrderReference ?? item.id,
            status: item.status,
            testName: item.testName,
            collectionType: "Home Collection",
            scheduledAt: item.slotAt ?? item.createdAt,
          }))
          localStorage.setItem(LAB_BOOKINGS_KEY, JSON.stringify(mapped))
        }
      } catch {
        // Keep local storage fallback.
      }
    })()
    return () => {
      active = false
    }
  }, [])

  const current = teleBookings.map((booking) => {
    const scheduled = new Date(booking.scheduledAt)
    return {
      id: booking.id,
      title: `Teleconsultation with ${booking.doctorName}`,
      at: scheduled.toLocaleString(),
      status: booking.status ?? "confirmed",
      scheduledAt: booking.scheduledAt,
      joinWindowStart: booking.joinWindowStart,
      sessionId: booking.sessionId,
      doctorId: booking.doctorId,
    }
  })
  const mergedLabOrders = labOrders.length
    ? labOrders.map((item) => ({
        id: item.id,
        title: `Lab Test • ${item.testName}`,
        at: new Date(item.slotAt ?? item.createdAt).toLocaleString(),
        status: item.status,
        bookingId: item.providerOrderReference ?? item.id,
        type: "lab",
      }))
    : labBookings.map((booking) => {
        const scheduled = new Date(booking.scheduledAt)
        return {
          id: booking.id,
          title: `Lab Test • ${booking.testName}`,
          at: scheduled.toLocaleString(),
          status: booking.status,
          bookingId: booking.bookingId,
          type: "lab",
        }
      })

  const currentLab = mergedLabOrders.filter((item) => !["completed", "cancelled", "reported"].includes(item.status))
  const pastLab = mergedLabOrders.filter((item) => ["completed", "cancelled", "reported"].includes(item.status))
  const items = tab === "current" ? [...currentLab, ...current] : [...pastLab, ...past]

  const formatStatus = (value?: string) => {
    if (!value) return ""
    return value.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  }

  return (
    <main className="account-page booking-page app-page-enter">
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
            const canJoin = Boolean(item.sessionId)
            const statusLabel = formatStatus(item.status)
            const statusClass = item.status ? `status-${String(item.status).toLowerCase().replace(/\\s+/g, "-")}` : ""
            return (
              <article className="notice-item booking-item" key={item.id || item.title}>
                <div className="booking-head">
                  <h4>{item.title}</h4>
                  {item.status && (
                    <span className={`booking-status ${statusClass}`}>
                      {statusLabel}
                    </span>
                  )}
                </div>
                <div className="booking-meta">
                  <span>{item.at}</span>
                  {item.type === "lab" && <span className="booking-tag">Lab</span>}
                  {item.sessionId && <span className="booking-tag">Teleconsult</span>}
                </div>
                {canJoin && item.sessionId && (
                  <div className="booking-actions">
                    <button
                      className="app-pressable booking-btn secondary"
                      type="button"
                      onClick={() =>
                        navigate(`/teleconsultation/overview/${item.id}`)
                      }
                    >
                      View Details
                    </button>
                    <button
                      className="app-pressable booking-btn primary"
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
                  </div>
                )}
                {item.type === "lab" && (
                  <div className="booking-actions single">
                    <button
                      className="app-pressable booking-btn primary"
                      type="button"
                      onClick={() => navigate(`/lab-tests/track/${item.id}`)}
                    >
                      Track Status
                    </button>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      </section>
    </main>
  )
}
