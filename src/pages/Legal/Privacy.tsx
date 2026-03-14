import { useNavigate } from "react-router-dom"
import "./legal.css"

export default function Privacy() {
  const navigate = useNavigate()

  return (
    <main className="legal-screen app-page-enter">
      <article className="legal-card app-fade-stagger">
        <h1>Privacy Policy</h1>
        <div className="legal-scroll">
          <p>
            Astikan collects only the data needed to deliver employee health services. This includes account details, basic
            profile information, appointment history, and service usage needed to support your care journey.
          </p>
          <p>
            <strong>Health data</strong> is processed to enable teleconsultations, lab bookings, pharmacy orders, health
            programs, and wellness analytics. We do not sell personal data to third parties.
          </p>
          <p>
            <strong>Access control</strong> is role-based. Only authorized staff and systems can access data relevant to their
            role. Your employer can access company-level analytics and aggregated reporting but should not view personal
            medical details unless required by policy and consent.
          </p>
          <p>
            <strong>AI features</strong> may analyze symptoms or prescription images to provide helpful suggestions. These
            outputs are informational and do not replace medical advice.
          </p>
          <p>
            <strong>Data retention</strong> follows your organization’s policy and legal requirements. Data can be archived or
            deleted when no longer required.
          </p>
          <p>
            <strong>Your choices</strong> include requesting access, correction, or deletion of your data through your company
            admin or support channel. Where required, we may verify your identity before fulfilling requests.
          </p>
          <p>
            <strong>Security</strong> includes encryption in transit and strict access logging. If you suspect a privacy issue,
            report it immediately to your organization admin.
          </p>
        </div>
        <button className="legal-back app-pressable" onClick={() => navigate(-1)}>
          Back
        </button>
      </article>
    </main>
  )
}
