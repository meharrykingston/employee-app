import { useNavigate } from "react-router-dom"
import "./legal.css"

export default function Terms() {
  const navigate = useNavigate()

  return (
    <main className="legal-screen app-page-enter">
      <article className="legal-card app-fade-stagger">
        <h1>Terms of Service</h1>
        <div className="legal-scroll">
          <p>
            Astikan provides employee wellness, teleconsultation access, lab booking, pharmacy services, and health programs for
            your organization. By using the app, you agree to use it responsibly and in line with your company’s policies.
          </p>
          <p>
            <strong>Medical guidance</strong> is for support and convenience only. The app does not replace in-person medical
            care. If you believe you are in an emergency or at immediate risk, seek help from local emergency services and
            licensed clinicians right away.
          </p>
          <p>
            <strong>Account access</strong> is tied to your organization. Keep your login credentials private and notify your
            admin if you suspect unauthorized access. You are responsible for activity performed using your account.
          </p>
          <p>
            <strong>Appointments and services</strong> are subject to availability and verification. Teleconsultation access,
            lab bookings, and pharmacy deliveries may be rescheduled or adjusted if required for safety, compliance, or
            operational reasons.
          </p>
          <p>
            <strong>Prescriptions and orders</strong> must follow applicable regulations. Some medicines may require valid
            prescriptions. We may request additional verification before fulfilling sensitive orders.
          </p>
          <p>
            <strong>Content and recommendations</strong> may include AI-assisted suggestions. These are informational and must
            be confirmed with a qualified healthcare professional before making medical decisions.
          </p>
          <p>
            <strong>Acceptable use</strong> includes honest use of services, respectful behavior toward healthcare staff, and
            no misuse of systems. Abuse, fraud, or harassment can lead to account suspension.
          </p>
          <p>
            <strong>Changes</strong> to these terms may occur as services evolve. Continued use of the app indicates acceptance
            of the latest terms.
          </p>
        </div>
        <button className="legal-back app-pressable" onClick={() => navigate(-1)}>
          Back
        </button>
      </article>
    </main>
  )
}
