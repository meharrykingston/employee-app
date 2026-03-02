import { FiCheckCircle, FiClock, FiHome, FiPackage } from "react-icons/fi"
import { useLocation, useNavigate } from "react-router-dom"
import "./pharmacy-success.css"

type SuccessState = {
  orderedItems?: number
}

export default function PharmacySuccess() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as SuccessState | undefined
  const orderedItems = state?.orderedItems ?? 0

  return (
    <main className="pharmacy-success-page app-page-enter">
      <section className="pharmacy-success-shell app-content-slide">
        <div className="pharmacy-success-badge app-fade-stagger">
          <FiCheckCircle />
        </div>

        <h1 className="app-fade-stagger">Order Confirmed</h1>
        <p className="app-fade-stagger">
          Your pharmacy booking is successful. {orderedItems > 0 ? `${orderedItems} item(s) are now being prepared.` : "Items are now being prepared."}
        </p>

        <article className="pharmacy-success-card app-fade-stagger">
          <div>
            <FiPackage />
            <span>Verified packing in progress</span>
          </div>
          <div>
            <FiClock />
            <span>Real-time tracking will start shortly</span>
          </div>
        </article>

        <div className="pharmacy-success-actions app-fade-stagger">
          <button type="button" className="success-primary app-pressable" onClick={() => navigate("/pharmacy/tracking")}>
            Track Order
          </button>
          <button type="button" className="success-secondary app-pressable" onClick={() => navigate("/pharmacy")}>
            Continue Shopping
          </button>
          <button type="button" className="success-secondary app-pressable" onClick={() => navigate("/home")}>
            <FiHome /> Go Home
          </button>
        </div>
      </section>
    </main>
  )
}

