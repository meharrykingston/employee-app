import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
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

  function handleContinue() {
    if (!isValidCompanyCode(code)) {
      setError("Company code must be 12 characters, alphanumeric, with letters and numbers")
      return
    }

    setLoading(true)

    setTimeout(() => {
      setLoading(false)
      navigate("/login")
    }, 900)
  }

  return (
    <div className="company-screen app-page-enter">

      <div className="company-card animate-in app-fade-stagger">
        <h2 className="company-title">Welcome</h2>
        <p className="company-subtitle">Enter your company code to continue</p>

        <label className="company-label" htmlFor="company-code-input">
          Company Code <span className="company-hint">(12 alphanumeric characters)</span>
        </label>

        <div className={`company-input-wrapper ${error ? "error" : ""}`}>
          <input
            id="company-code-input"
            type="text"
            value={code}
            onChange={handleChange}
            placeholder="ENTER COMPANY CODE"
            disabled={loading}
            maxLength={12}
          />
        </div>

        {error && <p className="company-error-text">{error}</p>}

        <button
          className={`company-continue-btn app-pressable ${loading ? "loading" : ""}`}
          onClick={handleContinue}
          disabled={loading}
          type="button"
        >
          {loading ? <span className="loader"></span> : "Continue"}
        </button>
      </div>

      <p className="company-terms">
        By signing in, you agree to our <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy</Link>
      </p>
    </div>
  )
}
