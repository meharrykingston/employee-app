import { useState } from "react"
import { useNavigate } from "react-router-dom"
import "./login.css"

export default function Login() {
  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  function handleSubmit() {
    if (!email || !password) {
      setError("Please enter email and password")
      return
    }

    setError("")
    setLoading(true)

    // mock auth
    setTimeout(() => {
      setLoading(false)
      navigate("/home") // next screen
    }, 1500)
  }

  return (
    <div className="login-screen">
      <div className="brand">
        <h1>HCLTech</h1>
        <p>Your Health Companion</p>
      </div>

      <div className="login-card animate-in">
        <h2 className="title">Welcome Back</h2>
        <p className="subtitle">
          Sign in to continue your health journey
        </p>

        <label>Email Address</label>
        <div className="input-wrapper">
          <span className="icon">✉️</span>
          <input
            type="email"
            placeholder="Enter your work email..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </div>

        <label>Password</label>
        <div className="input-wrapper">
          <span className="icon">🔒</span>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          <span
            className="eye"
            onClick={() => setShowPassword(!showPassword)}
          >
            👁
          </span>
        </div>

        {error && <p className="error-text">{error}</p>}

        <button
          className={`signin-btn ${loading ? "loading" : ""}`}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? <span className="loader"></span> : "Sign In →"}
        </button>

        <p
          className="forgot"
          onClick={() => navigate("/forgot")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              navigate("/forgot")
            }
          }}
          role="button"
          tabIndex={0}
        >
          Forgot password?
        </p>
      </div>

      <p className="terms">
        By signing in, you agree to our <span>Terms</span> and{" "}
        <span>Privacy Policy</span>
      </p>
    </div>
  )
}
