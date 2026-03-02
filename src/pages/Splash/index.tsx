import { useEffect } from "react"
import { FiActivity, FiHeart } from "react-icons/fi"
import { useNavigate } from "react-router-dom"
import "./splash.css"

export default function Splash() {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/company")
    }, 2300)

    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div className="splash-container app-page-enter">
      <div className="splash-glow" aria-hidden="true" />
      <section className="splash-card app-fade-stagger">
        <div className="splash-mark">
          <FiHeart aria-hidden="true" />
          <FiActivity aria-hidden="true" />
        </div>
        <h1>Employee Health</h1>
        <p>Secure health platform</p>
        <small>Please validate company code to continue</small>
        <div className="splash-loader" aria-hidden="true">
          <span />
        </div>
      </section>
    </div>
  )
}
