import { useEffect, useMemo, useState } from "react"
import { FiArrowLeft, FiCheckCircle, FiClock, FiMapPin, FiMessageCircle, FiPackage, FiPhone, FiTruck } from "react-icons/fi"
import { useNavigate } from "react-router-dom"
import "./medicine-tracking.css"

const milestones = ["Order confirmed", "Packed", "Rider picked", "On the way", "Delivered"]

export default function MedicineTracking() {
  const navigate = useNavigate()
  const [progress, setProgress] = useState(62)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setProgress((prev) => (prev >= 92 ? 92 : prev + 1))
    }, 1200)
    return () => window.clearInterval(timer)
  }, [])

  const activeStep = useMemo(() => {
    if (progress < 20) return 0
    if (progress < 40) return 1
    if (progress < 60) return 2
    if (progress < 90) return 3
    return 4
  }, [progress])

  const eta = Math.max(2, Math.round((100 - progress) / 7))

  return (
    <main className="track-page app-page-enter">
      <header className="track-header app-fade-stagger">
        <button className="track-back app-pressable" type="button" aria-label="Back" onClick={() => navigate(-1)}>
          <FiArrowLeft />
        </button>
        <div>
          <h1>Track Order</h1>
          <p>Order #MED-20421</p>
        </div>
      </header>

      <section className="track-shell app-content-slide">
        <article className="track-eta-card app-fade-stagger">
          <div className="eta-left">
            <h2>Arriving in {eta} mins</h2>
            <p>Your medicines are on the way</p>
            <div className="eta-tags">
              <span><FiClock /> Live</span>
              <span><FiTruck /> Rider near your area</span>
            </div>
          </div>
          <div className="eta-icon"><FiPackage /></div>
        </article>

        <article className="track-map app-fade-stagger">
          <iframe
            title="Medicine delivery route"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src="https://maps.google.com/maps?q=12.9716,77.5946%20to%2012.9352,77.6245&z=12&output=embed"
          />
          <div className="map-badge store"><FiMapPin /> Pharmacy</div>
          <div className="map-badge home"><FiMapPin /> Home</div>
          <div className="rider-dot" style={{ left: `calc(${progress}% - 14px)` }}>
            <FiTruck />
          </div>
        </article>

        <article className="track-rider app-fade-stagger">
          <div className="rider-avatar">RK</div>
          <div className="rider-copy">
            <h3>Ravi Kumar</h3>
            <p>Delivery Partner • Bike</p>
          </div>
          <div className="rider-actions">
            <button className="app-pressable" type="button"><FiPhone /></button>
            <button className="app-pressable" type="button"><FiMessageCircle /></button>
          </div>
        </article>

        <section className="track-timeline app-fade-stagger">
          {milestones.map((item, index) => {
            const done = index <= activeStep
            return (
              <article key={item} className={`timeline-item ${done ? "done" : ""}`}>
                <span className="timeline-icon">{done ? <FiCheckCircle /> : <FiClock />}</span>
                <div>
                  <h4>{item}</h4>
                  <p>{done ? "Completed" : "Pending"}</p>
                </div>
              </article>
            )
          })}
        </section>
      </section>
    </main>
  )
}
