import { useMemo, useState } from "react"
import { FiArrowLeft, FiCheckCircle, FiHome, FiMapPin } from "react-icons/fi"
import { MdOutlineBusinessCenter } from "react-icons/md"
import { useLocation, useNavigate } from "react-router-dom"
import "./pickup.css"

type PickupDoctor = {
  id: string
  name: string
  specialty: string
  distance: string
  eta: string
  avatar: string
}

export default function OpdPickup() {
  const navigate = useNavigate()
  const { state } = useLocation() as {
    state?: {
      doctor?: PickupDoctor
      analysisQuery?: string
      selectedSymptoms?: string[]
    }
  }
  const doctor = state?.doctor
  const [pickupType, setPickupType] = useState<"home" | "office">("home")
  const [showScheduled, setShowScheduled] = useState(false)

  const address = useMemo(
    () =>
      pickupType === "home"
        ? "Harry Kingston, B-45, Near Central Park"
        : "Office Tower 3, Whitefield Tech Park",
    [pickupType],
  )

  function scheduleLater() {
    setShowScheduled(true)
    window.setTimeout(() => setShowScheduled(false), 1800)
  }

  function bookNow() {
    if (!doctor) return
    navigate("/teleconsultation", {
      state: {
        selectedDoctorId: doctor.id,
        startRide: true,
      },
    })
  }

  return (
    <main className="opd-pickup-page app-page-enter">
      <header className="opd-pickup-header app-fade-stagger">
        <button className="pickup-back app-pressable" type="button" aria-label="Back" onClick={() => navigate(-1)}>
          <FiArrowLeft />
        </button>
        <div>
          <h1>OPD Pickup</h1>
          <p>Select pickup type before ride booking</p>
        </div>
      </header>

      <section className="opd-pickup-content app-content-slide">
        {doctor && (
          <article className="selected-doctor app-fade-stagger">
            <img src={doctor.avatar} alt={doctor.name} />
            <div>
              <h2>{doctor.name}</h2>
              <p>{doctor.specialty}</p>
              <span>{doctor.distance} • ETA {doctor.eta}</span>
            </div>
          </article>
        )}

        <section className="pickup-block app-fade-stagger">
          <h3>Choose Pickup Type</h3>
          <div className="pickup-grid">
            <button
              className={`pickup-card app-pressable ${pickupType === "home" ? "active" : ""}`}
              type="button"
              onClick={() => setPickupType("home")}
            >
              <span className="pickup-icon"><FiHome /></span>
              <h4>Home Pickup</h4>
              <p>Driver picks you from home</p>
              <b className="pickup-pill green">in 8 mins</b>
            </button>

            <button
              className={`pickup-card app-pressable ${pickupType === "office" ? "active" : ""}`}
              type="button"
              onClick={() => setPickupType("office")}
            >
              <span className="pickup-icon"><MdOutlineBusinessCenter /></span>
              <h4>Office Pickup</h4>
              <p>Driver picks you from office</p>
              <b className="pickup-pill blue">in 15 mins</b>
            </button>
          </div>
        </section>

        <article className="pickup-map app-fade-stagger">
          <iframe
            title="OPD pickup route"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={
              pickupType === "home"
                ? "https://maps.google.com/maps?q=12.9716,77.5946%20to%2012.9352,77.6245&z=12&output=embed"
                : "https://maps.google.com/maps?q=12.9716,77.5946%20to%2012.9833,77.7284&z=12&output=embed"
            }
          />
        </article>

        <p className="pickup-address app-fade-stagger">
          <FiMapPin /> {pickupType === "home" ? "Home Address:" : "Office Address:"} {address}
        </p>
      </section>

      <footer className="pickup-footer app-fade-stagger">
        <button className="pickup-secondary app-pressable" type="button" onClick={scheduleLater}>
          Schedule Later
        </button>
        <button className="pickup-primary app-pressable" type="button" onClick={bookNow}>
          Book Now
        </button>
      </footer>

      {showScheduled && (
        <div className="pickup-toast app-page-enter" role="status">
          <FiCheckCircle /> Pickup scheduled for later.
        </div>
      )}
    </main>
  )
}
