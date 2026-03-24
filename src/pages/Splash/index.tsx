import { useEffect, useState } from "react"
import { FiActivity, FiHeart } from "react-icons/fi"
import { useNavigate } from "react-router-dom"
import "./splash.css"

export default function Splash() {
  const navigate = useNavigate()
  const [showPermissions, setShowPermissions] = useState(false)

  useEffect(() => {
    let active = true
    const checkPermissions = async () => {
      const hasPermissions = localStorage.getItem("astikan_permissions_done")
      if (hasPermissions) {
        setShowPermissions(false)
        const timer = setTimeout(() => {
          if (active) navigate("/company")
        }, 1800)
        return () => clearTimeout(timer)
      }

      let geoGranted = true
      let notifGranted = true

      if ("geolocation" in navigator) {
        try {
          if ("permissions" in navigator) {
            const status = await navigator.permissions.query({ name: "geolocation" as PermissionName })
            geoGranted = status.state === "granted"
          } else {
            geoGranted = false
          }
        } catch {
          geoGranted = false
        }
      }

      if ("Notification" in window) {
        notifGranted = Notification.permission === "granted"
      }

      if (geoGranted && notifGranted) {
        localStorage.setItem("astikan_permissions_done", "1")
        setShowPermissions(false)
        const timer = setTimeout(() => {
          if (active) navigate("/company")
        }, 1200)
        return () => clearTimeout(timer)
      }

      setShowPermissions(true)
      return undefined
    }

    void checkPermissions()
    return () => {
      active = false
    }
  }, [navigate])

  async function requestPermissions() {
    try {
      if ("geolocation" in navigator) {
        await new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              localStorage.setItem(
                "employee_geo",
                JSON.stringify({ lat: pos.coords.latitude, lon: pos.coords.longitude })
              )
              resolve(true)
            },
            () => resolve(false),
            { timeout: 6000 }
          )
        })
      }
      if ("Notification" in window) {
        await Notification.requestPermission()
      }
    } finally {
      localStorage.setItem("astikan_permissions_done", "1")
      setShowPermissions(false)
      navigate("/company")
    }
  }

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
        <div className="splash-loader" aria-hidden="true">
          <span />
        </div>
      </section>

      {showPermissions && (
        <div className="permissions-overlay">
          <div className="permissions-card">
            <h2>Allow permissions</h2>
            <p>We need location and notification access to deliver OPD pickup, lab, and ride updates.</p>
            <ul>
              <li>Location access for pickup and OPD routing</li>
              <li>Notifications for ride and consultation updates</li>
            </ul>
            <button className="permissions-btn" type="button" onClick={requestPermissions}>
              Allow & Continue
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
