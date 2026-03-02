import { useNavigate } from "react-router-dom"
import "../Settings/settings.css"

export default function HealthInfo() {
  const navigate = useNavigate()

  return (
    <main className="account-page app-page-enter">
      <header className="account-header app-fade-stagger">
        <button className="account-back app-pressable" onClick={() => navigate(-1)} type="button" aria-label="Back">&lt;</button>
        <h1>Health Information</h1>
      </header>
      <section className="account-shell app-content-slide">
        <article className="account-card app-fade-stagger">
          <div className="field-grid">
            <div><label>Blood Group</label><select defaultValue="B+"><option>B+</option><option>A+</option><option>O+</option><option>AB+</option></select></div>
            <div><label>Height</label><input defaultValue="172 cm" /></div>
            <div><label>Weight</label><input defaultValue="68 kg" /></div>
            <div><label>Allergies</label><textarea rows={3} defaultValue="No known allergies" /></div>
          </div>
        </article>
      </section>
    </main>
  )
}
