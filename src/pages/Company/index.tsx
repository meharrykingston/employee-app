import { useEffect, useState } from "react"
import { FiBriefcase, FiShield } from "react-icons/fi"
import { Link, useNavigate } from "react-router-dom"
import { authorizeEmployeeCompany, getEmployeeAuthSession, saveEmployeeCompanySession } from "../../services/authApi"
import "./company.css"

function isValidCompanyCode(value: string) {
  return /^(?=.*[A-Z])(?=.*\d)[A-Z0-9]{12}$/.test(value)
}

export default function Company() {
  const navigate = useNavigate()

  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 12)

    setCode(value)
    setError("")
  }

  async function handleContinue() {
    if (!isValidCompanyCode(code)) {
      setError(
        "Company code must be 12 characters, alphanumeric, with letters and numbers"
      )
      return
    }

    setLoading(true)

    try {
      const session = await authorizeEmployeeCompany(code)
      saveEmployeeCompanySession(session)
      setLoading(false)
      navigate("/login")
    } catch (error) {
      setLoading(false)
      setError(error instanceof Error ? error.message : "Unable to verify company code")
    }
  }

  const isValid = isValidCompanyCode(code)

  useEffect(() => {
    const existingSession = getEmployeeAuthSession()
    if (existingSession) {
      navigate("/assessment")
    }
  }, [navigate])

  return (
    <div className="company-screen app-page-enter">
      <section className="company-shell">
        <header className="company-hero app-fade-stagger">
          <span className="company-chip">
            <FiShield aria-hidden="true" /> Secure Sign-In
          </span>
          <h1>Welcome</h1>
          <p>Enter your organization code to continue</p>
        </header>

        <div className="company-card animate-in app-fade-stagger">
          <h2 className="company-title">Enter Company Code</h2>
          <p className="company-subtitle">
            Use your assigned organization code to continue.
          </p>

          <label
            className="company-label"
            htmlFor="company-code-input"
          >
            Company Code
          </label>

          <div
            className={`company-input-wrapper ${
              error ? "error" : ""
            }`}
          >
            <span className="company-input-icon">
              <FiBriefcase aria-hidden="true" />
            </span>

            <input
              id="company-code-input"
              type="text"
              value={code}
              onChange={handleChange}
              placeholder="ENTER 12-CHARACTER CODE"
              disabled={loading}
              maxLength={12}
            />
          </div>

          <p className="company-meta">
            Format: uppercase letters + numbers only
          </p>

          {error && (
            <p className="company-error-text">{error}</p>
          )}

          <button
            className={`company-continue-btn app-pressable ${
              loading ? "loading" : ""
            }`}
            onClick={handleContinue}
            disabled={loading || !isValid}
            type="button"
          >
            {loading ? (
              <span className="loader"></span>
            ) : (
              "Continue"
            )}
          </button>
        </div>

        <p className="company-terms">
          By signing in, you agree to our{" "}
          <Link to="/terms">Terms</Link> and{" "}
          <Link to="/privacy">Privacy</Link>
        </p>
      </section>
    </div>
  )
}
