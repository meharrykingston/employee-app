import { useState } from "react"
import { useNavigate } from "react-router-dom"
import "./company.css"

export default function Company() {
  const navigate = useNavigate()

  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "") // alphanumeric only

    setCode(value)
    setError("")
  }

  function handleContinue() {
    if (!code || code.length < 4) {
      setError("Please enter a valid company code")
      return
    }

    setLoading(true)

    // simulate backend validation
    setTimeout(() => {
      setLoading(false)
      navigate("/login") // NEXT SCREEN (you can change later)
    }, 1500)
  }

  return (
    <div className="company-screen">
      <div className="company-card animate-in">
        <h1 className="title">
          Hey <span className="wave">👋</span>
        </h1>

        <p className="subtitle">
          Sign in to continue your health journey
        </p>

        <label className="label">
          Company Code <span className="hint">(Eg – ASTI2009025)</span>
        </label>

        <div className={`input-wrapper ${error ? "error" : ""}`}>
          <input
            type="text"
            value={code}
            onChange={handleChange}
            placeholder="ENTER COMPANY CODE"
            disabled={loading}
          />
        </div>

        {error && <p className="error-text">{error}</p>}

        <button
          className={`continue-btn ${loading ? "loading" : ""}`}
          onClick={handleContinue}
          disabled={loading}
        >
          {loading ? <span className="loader"></span> : "Continue →"}
        </button>
      </div>

      <p className="terms">
        By signing in, you agree to our <span>Terms</span> & <span>Privacy</span>
      </p>
    </div>
  )
}