import { useMemo, useState } from "react"
import {
  FiActivity,
  FiArrowLeft,
  FiBatteryCharging,
  FiClock,
  FiCreditCard,
  FiDroplet,
  FiHeart,
  FiHome,
  FiMapPin,
  FiMessageCircle,
  FiMoon,
  FiSmile,
  FiZap,
} from "react-icons/fi"
import { useLocation, useNavigate } from "react-router-dom"
import { goBackOrFallback } from "../../utils/navigation"
import "./health.css"

type Range = "Day" | "Week" | "Month" | "Year"
type HealthTab = "Home" | "Health" | "AI Chat" | "Stress Relief" | "Wallet"

const tabs: Array<{ id: HealthTab; icon: "home" | "health" | "chat" | "stress" | "wallet" }> = [
  { id: "Home", icon: "home" },
  { id: "Health", icon: "health" },
  { id: "AI Chat", icon: "chat" },
  { id: "Stress Relief", icon: "stress" },
  { id: "Wallet", icon: "wallet" },
]

const tabRoutes: Record<HealthTab, string> = {
  Home: "/home",
  Health: "/health",
  "AI Chat": "/ai-chat",
  "Stress Relief": "/stress-relief",
  Wallet: "/wallet",
}

const metrics = [
  { title: "Health Score", value: "92", suffix: "/100", trend: "+5", tone: "red", icon: <FiHeart /> },
  { title: "Daily Activity", value: "8.5", suffix: "k steps", trend: "+12%", tone: "blue", icon: <FiActivity /> },
  { title: "Stress Balance", value: "87", suffix: "/100", trend: "+3", tone: "purple", icon: <FiSmile /> },
  { title: "Recovery", value: "95", suffix: "%", trend: "+8%", tone: "green", icon: <FiBatteryCharging /> },
]

const activities = [
  { title: "Checkup with Dr. Riza", time: "2 hours ago", status: "completed" },
  { title: "Hydration goal reached", time: "4 hours ago", status: "completed" },
  { title: "Lab report sync pending", time: "1 day ago", status: "pending" },
  { title: "Sleep quality improved", time: "2 days ago", status: "completed" },
]

function tabIcon(icon: (typeof tabs)[number]["icon"]) {
  if (icon === "home") return <FiHome />
  if (icon === "health") return <FiActivity />
  if (icon === "chat") return <FiMessageCircle />
  if (icon === "stress") return <FiSmile />
  return <FiCreditCard />
}

export default function Health() {
  const navigate = useNavigate()
  const location = useLocation()
  const [range, setRange] = useState<Range>("Day")
  const [isMenuDocked, setIsMenuDocked] = useState(false)

  const activeTab: HealthTab = useMemo(() => {
    if (location.pathname.startsWith("/home")) return "Home"
    if (location.pathname.startsWith("/ai-chat")) return "AI Chat"
    if (location.pathname.startsWith("/stress-relief")) return "Stress Relief"
    if (location.pathname.startsWith("/wallet")) return "Wallet"
    return "Health"
  }, [location.pathname])

  function onPageScroll(e: React.UIEvent<HTMLElement>) {
    const nextDocked = e.currentTarget.scrollTop > 40
    setIsMenuDocked((prev) => (prev === nextDocked ? prev : nextDocked))
  }

  return (
    <main className="health-screen app-page-enter" onScroll={onPageScroll}>
      <header className="health-header app-fade-stagger">
        <button className="health-back app-pressable" onClick={() => goBackOrFallback(navigate)} type="button" aria-label="Back">
          <FiArrowLeft />
        </button>
        <div>
          <h1>HEALTH</h1>
          <p>Your complete health overview</p>
        </div>
      </header>

      <nav className={`health-menu app-fade-stagger ${isMenuDocked ? "docked" : ""}`}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`health-menu-item app-pressable ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => navigate(tabRoutes[tab.id])}
            type="button"
          >
            <span className="health-menu-icon">{tabIcon(tab.icon)}</span>
            <span>{tab.id}</span>
          </button>
        ))}
      </nav>

      <section className="health-content app-content-slide">
        <section className="range-tabs app-fade-stagger">
          {(["Day", "Week", "Month", "Year"] as const).map((tab) => (
            <button key={tab} className={`app-pressable ${range === tab ? "active" : ""}`} onClick={() => setRange(tab)} type="button">
              {tab}
            </button>
          ))}
        </section>

        <section className="health-metrics app-fade-stagger">
          {metrics.map((item) => (
            <article key={item.title} className={`health-metric-card ${item.tone} app-pressable`}>
              <div className="health-metric-top">
                <span className="metric-icon">{item.icon}</span>
                <span className="metric-trend">{item.trend}</span>
              </div>
              <h2>
                {item.value}
                <span>{item.suffix}</span>
              </h2>
              <p>{item.title}</p>
              <div className="metric-spark" aria-hidden="true">
                {Array.from({ length: 7 }).map((_, index) => (
                  <span key={`${item.title}-${index}`} style={{ animationDelay: `${index * 80}ms` }} />
                ))}
              </div>
            </article>
          ))}
        </section>

        <section className="health-section app-fade-stagger">
          <h3>Recent Activities</h3>
          <div className="activity-list">
            {activities.map((item) => (
              <article className="activity-card app-pressable" key={`${item.title}-${item.time}`}>
                <div className="activity-copy">
                  <strong>{item.title}</strong>
                  <p><FiClock /> {item.time}</p>
                </div>
                <span className={`status-pill ${item.status}`}>{item.status}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="health-section app-fade-stagger">
          <h3>Advanced Widgets</h3>
          <div className="widget-grid">
            <article className="widget-card app-pressable">
              <div className="widget-head">
                <span><FiDroplet /></span>
                <strong>Hydration</strong>
              </div>
              <p>2.1L / 3.0L today</p>
              <div className="widget-progress"><span /></div>
            </article>
            <article className="widget-card app-pressable">
              <div className="widget-head">
                <span><FiMoon /></span>
                <strong>Sleep</strong>
              </div>
              <p>7h 25m quality sleep</p>
              <div className="widget-bars" aria-hidden="true">
                {Array.from({ length: 6 }).map((_, index) => (
                  <span key={`sleep-${index}`} style={{ animationDelay: `${index * 120}ms` }} />
                ))}
              </div>
            </article>
            <article className="widget-card app-pressable">
              <div className="widget-head">
                <span><FiZap /></span>
                <strong>Energy Curve</strong>
              </div>
              <p>Stable through afternoon</p>
              <div className="widget-progress energy"><span /></div>
            </article>
            <article className="widget-card app-pressable">
              <div className="widget-head">
                <span><FiMapPin /></span>
                <strong>Mobility</strong>
              </div>
              <p>5.8km movement logged</p>
              <div className="widget-progress move"><span /></div>
            </article>
          </div>
        </section>
      </section>
    </main>
  )
}
