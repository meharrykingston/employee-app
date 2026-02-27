import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import "./splash.css"

export default function Splash() {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/company")
    }, 2500)

    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div className="splash-container">
      <div className="pulse-wrapper">
        <div className="pulse-ring"></div>
        <div className="pulse-ring delay"></div>
        <div className="logo-circle">
          <span className="logo-text">A</span>
        </div>
      </div>

      <p className="splash-text">Caring for you at work</p>
    </div>
  )
}