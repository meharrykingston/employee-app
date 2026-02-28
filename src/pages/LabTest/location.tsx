import { FiArrowLeft, FiHome, FiMapPin } from "react-icons/fi"
import { MdOutlineBusinessCenter } from "react-icons/md"
import { useState } from "react"
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

export default function LabLocationStep2() {
  const navigate = useNavigate()
  const { state } = useLocation() as { state?: { selectedTest?: LabTestItem } }
  const selectedTest = state?.selectedTest
  const [collectionType, setCollectionType] = useState<"home" | "office">("home")

  const address =
    collectionType === "home"
      ? "Harry Kingston, B- 45, Near Central Park"
      : "Office Tower 3, Whitefield Tech Park"

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
        <div className="step active">2. Location</div>
        <span>-</span>
        <div className="step pending">3. Schedule</div>
        <span>-</span>
        <div className="step pending">4. Confirm</div>
      </div>

      <section className="location-block">
        <h2>Choose Collection Type</h2>

        <div className="collection-grid">
          <button
            className={`collection-card ${collectionType === "home" ? "active" : ""}`}
            type="button"
            onClick={() => setCollectionType("home")}
          >
            <div className="collection-icon"><FiHome /></div>
            <h3>Home Collection</h3>
            <p>Sample collected at your doorstep</p>
            <span className="mini-pill green">in 5 mins</span>
          </button>

          <button
            className={`collection-card ${collectionType === "office" ? "active" : ""}`}
            type="button"
            onClick={() => setCollectionType("office")}
          >
            <div className="collection-icon"><MdOutlineBusinessCenter /></div>
            <h3>Office Collection</h3>
            <p>Sample collected at your doorstep</p>
            <span className="mini-pill blue">in 20 mins</span>
          </button>
        </div>
      </section>

      <div className="map-box live-map">
        <iframe
          title="Collection route map"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          src={
            collectionType === "home"
              ? "https://maps.google.com/maps?q=12.9716,77.5946%20to%2012.9352,77.6245&z=12&output=embed"
              : "https://maps.google.com/maps?q=12.9716,77.5946%20to%2012.9833,77.7284&z=12&output=embed"
          }
        />
      </div>

      <div className="address-line">
        <FiMapPin /> {collectionType === "home" ? "Home Address :" : "Office Address :"} {address}
      </div>

      <div className="bottom-buttons single">
        <button
          className="btn-primary"
          onClick={() =>
            navigate("/lab-tests/book-now", {
              state: {
                selectedTest,
                collectionType,
                address,
              },
            })
          }
          type="button"
        >
          Continue
        </button>
      </div>
    </div>
  )
}
