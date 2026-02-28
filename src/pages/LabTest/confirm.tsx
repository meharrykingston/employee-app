import { FiArrowLeft, FiCalendar, FiCheck, FiMapPin } from "react-icons/fi"
import { RiTestTubeLine } from "react-icons/ri"
import { useLocation, useNavigate } from "react-router-dom"
import "./labtest.css"

type LabTestItem = {
  name: string
}

export default function LabConfirm() {
  const navigate = useNavigate()
  const { state } = useLocation() as {
    state?: { selectedTest?: LabTestItem; collectionType?: string; date?: string; time?: string }
  }

  const dateTime = state?.date ? `${state.date}${state?.time ? ` ${state.time}` : ""}` : "Arriving in 5 mins"
  const collectionType = state?.collectionType === "office" ? "Office Collection" : "Home Collection"
  const selectedTest = state?.selectedTest?.name ?? "Complete Blood Count (CBC)"

  return (
    <div className="lab-page">
      <div className="lab-header">
        <button className="lab-back" onClick={() => navigate("/home")} type="button" aria-label="Back">
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
    </div>
  )
}
