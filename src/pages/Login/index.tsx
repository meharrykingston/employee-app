import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { FiEye, FiEyeOff, FiLock, FiMail } from "react-icons/fi"
import "./login.css"

const blockedDomains = new Set(["gmail.com", "yahoo.com", "yahoo.co.in", "yahoo.in"])

function validateEmail(rawEmail: string) {
  const email = rawEmail.trim().toLowerCase()

  if (!/^[^\s@]+@([a-z0-9-]+\.)+[a-z]{2,}$/i.test(email)) {
    return "Enter a valid company email address"
  }

  const domain = email.split("@")[1]
  if (!domain || blockedDomains.has(domain)) {
    return "Use your company domain email, not Gmail or Yahoo"
  }

  return ""
}

function validatePassword(password: string) {
  if (password.length < 8) {
    return "Password must be at least 8 characters"
  }

  if (!/[A-Z]/.test(password)) {
    return "Password must include an uppercase letter"
  }

  if (!/[a-z]/.test(password)) {
    return "Password must include a lowercase letter"
  }

  if (!/\d/.test(password)) {
    return "Password must include a number"
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return "Password must include a special character"
  }

  return ""
}

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

    const emailError = validateEmail(email)
    if (emailError) {
      setError(emailError)
      return
    }

    const passwordError = validatePassword(password)
    if (passwordError) {
      setError(passwordError)
      return
    }

    setError("")
    setLoading(true)

    setTimeout(() => {
      setLoading(false)
      navigate("/home")
    }, 1000)
  }

  return (
    <div className="login-screen app-page-enter">
      <header className="login-brand-banner app-fade-stagger">
        <h1>HCLTech</h1>
        <p>Your Health Companion</p>
      </header>

      <div className="login-card animate-in app-fade-stagger">
        <h2 className="login-title">Welcome Back</h2>
        <p className="login-subtitle">Sign in to continue your health journey</p>

        <label htmlFor="login-email">Email Address</label>
        <div className="login-input-wrapper">
          <span className="login-icon"><FiMail className="ui-icon" aria-hidden="true" /></span>
          <input
            id="login-email"
            type="email"
            placeholder="Enter your work email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </div>

        <label htmlFor="login-password">Password</label>
        <div className="login-input-wrapper">
          <span className="login-icon"><FiLock className="ui-icon" aria-hidden="true" /></span>
          <input
            id="login-password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          <button className="login-eye app-pressable" onClick={() => setShowPassword(!showPassword)} aria-label="toggle password" type="button">
            {showPassword ? <FiEyeOff className="ui-icon" aria-hidden="true" /> : <FiEye className="ui-icon" aria-hidden="true" />}
          </button>
        </div>

        {error && <p className="login-error-text">{error}</p>}

        <button
          className={`login-signin-btn app-pressable ${loading ? "loading" : ""}`}
          onClick={handleSubmit}
          disabled={loading}
          type="button"
        >
          {loading ? <span className="loader"></span> : "Sign In"}
        </button>

        <button className="login-forgot app-pressable" onClick={() => navigate("/forgot")} type="button">
          Forgot password?
        </button>
      </div>

      <p className="login-terms">
        By signing in, you agree to our <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy Policy</Link>
      </p>
    </div>
  )
}
