import { useNavigate } from "react-router-dom"
import "./legal.css"

export default function Terms() {
  const navigate = useNavigate()

  return (
    <main className="legal-screen app-page-enter">
      <article className="legal-card app-fade-stagger">
        <h1>Terms of Service</h1>
        <p>
          This app is provided for employee wellness support and informational guidance.
        </p>
        <p>
          You are responsible for account security and for using the app according to your organization policy.
        </p>
        <p>
          Emergency care should always be handled by local emergency services and licensed professionals.
        </p>
        <button className="legal-back app-pressable" onClick={() => navigate(-1)}>
          Back
        </button>
      </article>
    </main>
  )
}
