import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import "./forgot.css"

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="ui-icon">
      <path d="M3 6h18v12H3V6zm1 1 8 6 8-6" />
    </svg>
  )
}

function BuildingIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="ui-icon">
      <path d="M4 20V6l8-3 8 3v14H4zm4-9h2m4 0h2m-6 4h2m4 0h2" />
    </svg>
  )
}

export default function ForgotPassword() {
  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [companyCode, setCompanyCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  function handleCompanyCode(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
    setCompanyCode(value)
    setError("")
  }

  function handleSubmit() {
    if (!email || !companyCode) {
      setError("Please enter email and company code")
      return
    }

    setLoading(true)

    setTimeout(() => {
      setLoading(false)
      navigate("/login")
    }, 1500)
  }

  return (
    <div className="forgot-screen app-page-enter">
      <div className="brand app-fade-stagger">
        <h1>HCLTech</h1>
        <p>Your Health Companion</p>
      </div>

      <div className="forgot-card animate-in app-fade-stagger">
        <h2 className="title">Forgot Password?</h2>
        <p className="subtitle">Reset your password from here</p>

        <label htmlFor="forgot-email">Email Address</label>
        <div className="input-wrapper">
          <span className="icon"><MailIcon /></span>
          <input
            id="forgot-email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </div>

        <label htmlFor="forgot-company">
          Company Code <span className="hint">(Eg - ASTI2009025)</span>
        </label>
        <div className="input-wrapper">
          <span className="icon"><BuildingIcon /></span>
          <input
            id="forgot-company"
            type="text"
            placeholder="ENTER YOUR COMPANY CODE"
            value={companyCode}
            onChange={handleCompanyCode}
            disabled={loading}
          />
        </div>

        {error && <p className="error-text">{error}</p>}

        <button
          className={`continue-btn app-pressable ${loading ? "loading" : ""}`}
          onClick={handleSubmit}
          disabled={loading}
          type="button"
        >
          {loading ? <span className="loader"></span> : "Continue ->"}
        </button>

        <button className="back app-pressable" onClick={() => navigate("/login")} type="button">
          back to login?
        </button>
      </div>

      <p className="terms">
        By signing in, you agree to our <Link to="/terms">Terms of Service</Link> and <Link to="/privacy">Privacy Policy</Link>
      </p>
    </div>
  )
}
