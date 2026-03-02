import { useNavigate } from "react-router-dom"
import "../Settings/settings.css"

export default function ProfileInfo() {
  const navigate = useNavigate()

  return (
    <main className="account-page app-page-enter">
      <header className="account-header app-fade-stagger">
        <button className="account-back app-pressable" onClick={() => navigate(-1)} type="button" aria-label="Back">&lt;</button>
        <h1>Profile Information</h1>
      </header>
      <section className="account-shell app-content-slide">
        <article className="account-card app-fade-stagger">
          <div className="field-grid">
            <div><label>Full Name</label><input defaultValue="Sam Mishra" /></div>
            <div><label>Email</label><input defaultValue="sam@hcl.com" /></div>
            <div><label>Phone</label><input defaultValue="+91 98XXXXXX21" /></div>
          </div>
        </article>
      </section>
    </main>
  )
}
