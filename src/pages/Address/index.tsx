import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { getEmployeeCompanySession } from "../../services/authApi"
import "../Settings/settings.css"

const HOME_ADDRESS_KEY = "employee_home_address"

export default function Address() {
  const navigate = useNavigate()
  const companySession = getEmployeeCompanySession()
  const [homeAddress, setHomeAddress] = useState("")
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const raw = localStorage.getItem(HOME_ADDRESS_KEY)
    if (raw) setHomeAddress(raw)
  }, [])

  function saveHomeAddress() {
    localStorage.setItem(HOME_ADDRESS_KEY, homeAddress.trim())
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1500)
  }

  return (
    <main className="account-page app-page-enter">
      <header className="account-header app-fade-stagger">
        <button className="account-back app-pressable" onClick={() => navigate(-1)} type="button" aria-label="Back">&lt;</button>
        <h1>Address</h1>
      </header>
      <section className="account-shell app-content-slide">
        <article className="account-card app-fade-stagger">
          <h3>Home Address</h3>
          <div className="field-grid">
            <label htmlFor="homeAddress">Your personal address</label>
            <textarea
              id="homeAddress"
              rows={3}
              placeholder="Enter your home address"
              value={homeAddress}
              onChange={(event) => setHomeAddress(event.target.value)}
            />
            <button className="setting-item app-pressable" type="button" onClick={saveHomeAddress}>
              {saved ? "Saved" : "Save Home Address"}
              <small>Personal</small>
            </button>
          </div>
        </article>
        <article className="account-card app-fade-stagger">
          <h3>Office Address</h3>
          <p>{companySession?.companyName ?? "Company"} Campus, Madhapur, Hyderabad - 500084</p>
          <p className="address-note">Provided by your corporate admin</p>
        </article>
      </section>
    </main>
  )
}
