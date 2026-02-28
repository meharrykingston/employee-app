import { useState } from "react"
import {
  FiArrowLeft,
  FiBriefcase,
  FiMail,
  FiShield,
} from "react-icons/fi"
import { Link, useNavigate } from "react-router-dom"
import "./forgot.css"

function isValidCompanyCode(value: string) {
  return /^(?=.*[A-Z])(?=.*\d)[A-Z0-9]{12}$/.test(value)
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export default function ForgotPassword() {
  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [companyCode, setCompanyCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  function handleCompanyCode(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const value = e.target.value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 12)

    setCompanyCode(value)
    setError("")
  }

  function handleSubmit() {
    if (!email || !companyCode) {
      setError("Please enter email and company code")
      return
    }

    if (!isValidEmail(email)) {
      setError("Please enter a valid work email")
      return
    }

    if (!isValidCompanyCode(companyCode)) {
      setError(
        "Company code must be 12 characters with letters and numbers"
      )
      return
    }

    setLoading(true)

    // Simulated API call
    setTimeout(() => {
      setLoading(false)
      navigate("/login")
    }, 1000)
  }

  const isFormValid =
    isValidEmail(email) &&
    isValidCompanyCode(companyCode)

  return (
    <div className="forgot-screen app-page-enter">
      <section className="forgot-shell">
        <header className="forgot-hero app-fade-stagger">
          <span className="forgot-chip">
            <FiShield aria-hidden="true" /> Account Recovery
          </span>
          <h1>Reset Access</h1>
          <p>Verify your company details to continue</p>
        </header>

        <div className="forgot-card animate-in app-fade-stagger">
          {/* Email */}
          <label htmlFor="forgot-email">Work Email</label>
          <div className="forgot-input-wrapper">
            <span className="forgot-icon">
              <FiMail aria-hidden="true" />
            </span>
            <input
              id="forgot-email"
              type="email"
              placeholder="Enter your work email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError("")
              }}
              disabled={loading}
            />
          </div>

          {/* Company Code */}
          <label htmlFor="forgot-company">
            Company Code
          </label>
          <div className="forgot-input-wrapper">
            <span className="forgot-icon">
              <FiBriefcase aria-hidden="true" />
            </span>
            <input
              id="forgot-company"
              type="text"
              placeholder="ENTER 12-CHARACTER CODE"
              value={companyCode}
              onChange={handleCompanyCode}
              disabled={loading}
              maxLength={12}
            />
          </div>

          {error && (
            <p className="forgot-error-text">
              {error}
            </p>
          )}

          <button
            className={`forgot-continue-btn app-pressable ${
              loading ? "loading" : ""
            }`}
            onClick={handleSubmit}
            disabled={loading || !isFormValid}
            type="button"
          >
            {loading ? (
              <span className="loader"></span>
            ) : (
              "Reset Password"
            )}
          </button>

          <button
            className="forgot-back app-pressable"
            onClick={() => navigate("/login")}
            type="button"
          >
            <FiArrowLeft aria-hidden="true" />
            Back to login
          </button>
        </div>

        <p className="forgot-terms">
          By signing in, you agree to our{" "}
          <Link to="/terms">Terms</Link> and{" "}
          <Link to="/privacy">
            Privacy Policy
          </Link>
        </p>
      </section>
    </div>
  )
}