import { FiArrowLeft, FiClock, FiFileText, FiMapPin } from "react-icons/fi"
import { RiTestTubeLine } from "react-icons/ri"
import { useLocation, useNavigate } from "react-router-dom"
import "./labtest.css"

type LabTestItem = {
  id: string
  color: "red" | "blue" | "gray" | "green" | "outline"
  name: string
  desc: string
  tag: string
  duration: string
  fasting: string
  quick?: string
}

export default function LabBookNowStep3() {
  const navigate = useNavigate()
  const { state } = useLocation() as {
    state?: {
      selectedTest?: LabTestItem
      collectionType?: string
      address?: string
      readiness?: Record<string, "yes" | "no">
    }
  }

  const test =
    state?.selectedTest ??
    ({
      id: "cbc",
      color: "red",
      name: "Complete Blood Count (CBC)",
      desc: "Comprehensive blood analysis",
      tag: "Blood Test",
      duration: "15 mins test",
      fasting: "No fasting required",
    } as LabTestItem)

  return (
    <div className="lab-page">
      <div className="lab-header">
        <button className="lab-back" onClick={() => navigate(-1)} type="button" aria-label="Back">
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
        <div className="step active">3. Schedule</div>
        <span>-</span>
        <div className="step pending">4. Confirm</div>
      </div>

      <div className="status-block">
        <div className="status-round">
          <RiTestTubeLine />
        </div>
        <h2>5 mins away !</h2>
        <p>Your lab test is just a few distance away</p>
      </div>

      <div className="lab-test-card static-card" role="presentation">
        <div className={`lab-icon ${test.color}`} />
        <div className="lab-info">
          <h3>{test.name}</h3>
          <p>{test.desc}</p>
          <div className="lab-meta-row">
            <span className="pill">{test.tag}</span>
            <span><FiClock /> 15 mins test</span>
          </div>
          <div className="lab-meta-row muted">
            <span><FiFileText /> {test.fasting}</span>
          </div>
        </div>
      </div>

      <div className="map-box live-map">
        <iframe
          title="Pickup route map"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          src="https://maps.google.com/maps?q=12.9716,77.5946%20to%2012.9352,77.6245&z=12&output=embed"
        />
      </div>

      <div className="address-line">
        <FiMapPin /> Home Address : Harry Kingston, B- 45 , Near...
      </div>

      <div className="bottom-buttons two">
        <button
          className="btn-secondary"
          onClick={() =>
            navigate("/lab-tests/schedule", {
              state: {
                selectedTest: test,
                collectionType: state?.collectionType,
                address: state?.address,
                readiness: state?.readiness,
              },
            })
          }
          type="button"
        >
          Schedule Later
        </button>
        <button
          className="btn-primary"
          onClick={() =>
            navigate("/lab-tests/confirm", {
              state: {
                selectedTest: test,
                collectionType: state?.collectionType,
                address: state?.address,
                date: "Arriving in 5 mins",
                readiness: state?.readiness,
              },
            })
          }
          type="button"
        >
          Book Now
        </button>
      </div>
    </div>
  )
}
