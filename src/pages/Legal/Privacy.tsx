import { useNavigate } from "react-router-dom"
import "./legal.css"

export default function Privacy() {
  const navigate = useNavigate()

  return (
    <main className="legal-screen app-page-enter">
      <article className="legal-card app-fade-stagger">
        <h1>Privacy Policy</h1>
        <p>
          We process health-related information only for service delivery, security, and product improvement.
        </p>
        <p>
          Data access is limited by role and organizational authorization. Retention and deletion follow company policy.
        </p>
        <p>
          Contact your organization administrator for data requests, correction, or deletion inquiries.
        </p>
        <button className="legal-back app-pressable" onClick={() => navigate(-1)}>
          Back
        </button>
      </article>
    </main>
  )
}
