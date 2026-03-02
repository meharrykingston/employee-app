import { useNavigate } from "react-router-dom"
import "../Settings/settings.css"

export default function Address() {
  const navigate = useNavigate()

  return (
    <main className="account-page app-page-enter">
      <header className="account-header app-fade-stagger">
        <button className="account-back app-pressable" onClick={() => navigate(-1)} type="button" aria-label="Back">&lt;</button>
        <h1>Address</h1>
      </header>
      <section className="account-shell app-content-slide">
        <article className="account-card app-fade-stagger">
          <h3>Home Address</h3>
          <p>Harry Kingston, B-45, Near Station Road, Hyderabad - 500081</p>
        </article>
        <article className="account-card app-fade-stagger">
          <h3>Office Address</h3>
          <p>HCLTech Campus, Madhapur, Hyderabad - 500084</p>
        </article>
      </section>
    </main>
  )
}
