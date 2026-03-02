import { useEffect, useState } from "react"
import { FiArrowLeft, FiCalendar, FiCheck, FiMapPin } from "react-icons/fi"
import { RiTestTubeLine } from "react-icons/ri"
import { useLocation, useNavigate } from "react-router-dom"
import { goBackOrFallback } from "../../utils/navigation"
import "./labtest.css"

type LabTestItem = {
  name: string
}

export default function LabConfirm() {
  const navigate = useNavigate()
  const [phase, setPhase] = useState<"comfort" | "processing" | "confirmed">("comfort")
  const [comfortLevel, setComfortLevel] = useState<"comfortable" | "nervous" | "anxious" | null>(null)
  const { state } = useLocation() as {
    state?: {
      selectedTest?: LabTestItem
      collectionType?: string
      date?: string
      time?: string
      readiness?: { eatenLastHours?: "yes" | "no" | null; feelingWell?: "yes" | "no" | null }
    }
  }

  const dateTime = state?.date ? `${state.date}${state?.time ? ` ${state.time}` : ""}` : "Arriving in 5 mins"
  const collectionType = state?.collectionType === "office" ? "Office Collection" : "Home Collection"
  const selectedTest = state?.selectedTest?.name ?? "Complete Blood Count (CBC)"

  useEffect(() => {
    if (phase !== "processing") {
      return
    }
    const timer = window.setTimeout(() => {
      setPhase("confirmed")
    }, 1600)
    return () => window.clearTimeout(timer)
  }, [phase])

  return (
    <div className="lab-page">
      <div className="lab-header">
        <button className="lab-back" onClick={() => goBackOrFallback(navigate)} type="button" aria-label="Back">
          <FiArrowLeft />
        </button>
        <div>
          <h1>Lab Test Booking</h1>
          <p>Book tests & get reports online</p>
        </div>
      </div>

      <div className="lab-steps">
        <div className="step done">1. Tests</div>
        <span>-</span>
        <div className="step done">2. Location</div>
        <span>-</span>
        <div className="step done">3. Schedule</div>
        <span>-</span>
        <div className="step active">4. Confirm</div>
      </div>

      {phase === "comfort" && (
        <div className="comfort-box">
          <h3>How do you usually feel about blood tests?</h3>
          <div className="comfort-options">
            <button
              type="button"
              className={`comfort-btn ${comfortLevel === "comfortable" ? "active" : ""}`}
              onClick={() => setComfortLevel("comfortable")}
            >
              👍 Comfortable
            </button>
            <button
              type="button"
              className={`comfort-btn ${comfortLevel === "nervous" ? "active" : ""}`}
              onClick={() => setComfortLevel("nervous")}
            >
              😐 A little nervous
            </button>
            <button
              type="button"
              className={`comfort-btn ${comfortLevel === "anxious" ? "active" : ""}`}
              onClick={() => setComfortLevel("anxious")}
            >
              😟 Very anxious
            </button>
          </div>

          {(comfortLevel === "nervous" || comfortLevel === "anxious") && (
            <div className="comfort-note">
              <p>A trained professional will guide you gently.</p>
              <button type="button" className="comfort-link" onClick={() => navigate("/stress-relief")}>
                Try a short breathing exercise
              </button>
            </div>
          )}
        </div>
      )}

      {phase === "processing" ? (
        <div className="confirm-top processing">
          <div className="processing-ring">
            <span />
          </div>
          <h2>Processing Booking...</h2>
          <p>Please wait while we confirm your lab appointment</p>
        </div>
      ) : (
        <>
          <div className="confirm-top">
            <div className="confirm-check pulse">
              <span className="confirm-check-inner">
                <FiCheck />
              </span>
            </div>
            <h2>Booking Confirmed!</h2>
            <p>Your lab test has been booked successfully</p>
          </div>

          <div className="detail-box">
            <h3>Booking Detail</h3>

            <div className="detail-item">
              <FiCalendar />
              <div>
                <span>Date & Time</span>
                <strong>{dateTime}</strong>
              </div>
            </div>

            <div className="detail-item">
              <FiMapPin />
              <div>
                <span>Collection Type</span>
                <strong>{collectionType}</strong>
              </div>
            </div>

            <div className="detail-item">
              <RiTestTubeLine />
              <div>
                <span>Tests Selected</span>
                <strong>{selectedTest}</strong>
              </div>
            </div>
          </div>

          <div className="bottom-buttons single">
            <button className="btn-primary" onClick={() => navigate("/home")} type="button">
              Return Home
            </button>
          </div>
        </>
      )}

      {phase === "comfort" && (
        <div className="bottom-buttons single">
          <button className="btn-primary" onClick={() => setPhase("processing")} type="button">
            Continue to Confirm Booking
          </button>
        </div>
      )}
    </div>
  )
}
