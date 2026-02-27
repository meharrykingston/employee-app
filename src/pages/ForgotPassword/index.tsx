import { useState } from "react"
import { useNavigate } from "react-router-dom"
import "./forgot.css"

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

    // mock reset request
    setTimeout(() => {
      setLoading(false)
      navigate("/login")
    }, 1500)
  }

  return (
    <div className="forgot-screen">
      <div className="brand">
        <h1>HCLTech</h1>
        <p>Your Health Companion</p>
      </div>

      <div className="forgot-card animate-in">
        <h2 className="title">Forgot Password?</h2>
        <p className="subtitle">
          Reset your password from here
        </p>

        <label>Email Address</label>
        <div className="input-wrapper">
          <span className="icon">✉️</span>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </div>

        <label>
          Company Code <span className="hint">(Eg – ASTI2009025)</span>
        </label>
        <div className="input-wrapper">
          <span className="icon">🏢</span>
          <input
            type="text"
            placeholder="ENTER YOUR COMPANY CODE"
            value={companyCode}
            onChange={handleCompanyCode}
            disabled={loading}
          />
        </div>

        {error && <p className="error-text">{error}</p>}

        <button
          className={`continue-btn ${loading ? "loading" : ""}`}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? <span className="loader"></span> : "Continue →"}
        </button>

        <p className="back" onClick={() => navigate("/login")}>
          back to login?
        </p>
      </div>

      <p className="terms">
        By signing in, you agree to our <span>Terms of Service</span> and{" "}
        <span>Privacy Policy</span>
      </p>
    </div>
  )
}
