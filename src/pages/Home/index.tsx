import { type ReactElement, useEffect, useMemo, useRef, useState } from "react"
import {
  FiActivity,
  FiAward,
  FiBatteryCharging,
  FiBell,
  FiCreditCard,
  FiDroplet,
  FiHeart,
  FiHome,
  FiMapPin,
  FiMessageCircle,
  FiMoon,
  FiPackage,
  FiPhoneCall,
  FiShield,
  FiSmile,
  FiThermometer,
  FiTruck,
  FiUser,
  FiX,
  FiAlertTriangle,
  FiZap,
} from "react-icons/fi"
import { useLocation, useNavigate } from "react-router-dom"
import { getEmployeeAuthSession, getEmployeeCompanySession } from "../../services/authApi"
import { preloadLabCatalog } from "../../services/labApi"
import "./home.css"

type Tip = {
  title: string
  body: string
  tags: string[]
}

type QuickAccessItem = {
  title: string
  subtitle?: string
  tone: "purple" | "blue" | "indigo" | "orange" | "green" | "gold"
  badge?: string
  icon: "stress" | "lab" | "consult" | "weekend" | "pharmacy" | "badges"
}

type MetricId = "heart-rate" | "blood-pressure" | "temperature" | "weight"

const tabs = [
  { id: "Home", icon: "home" },
  { id: "Health", icon: "health" },
  { id: "AI Chat", icon: "chat" },
  { id: "Stress Relief", icon: "stress" },
  { id: "Wallet", icon: "wallet" },
] as const

const tabRoutes: Record<(typeof tabs)[number]["id"], string> = {
  Home: "/home",
  Health: "/health",
  "AI Chat": "/ai-chat",
  "Stress Relief": "/stress-relief",
  Wallet: "/wallet",
}

const quickAccess: QuickAccessItem[] = [
  { title: "Stress", subtitle: "Calm chat", tone: "purple", badge: "New", icon: "stress" },
  { title: "Lab Test", subtitle: "Fast slots", tone: "blue", icon: "lab" },
  { title: "Consult", subtitle: "AI + OPD", tone: "indigo", icon: "consult" },
  { title: "Tasks", subtitle: "Earn points", tone: "orange", icon: "weekend" },
  { title: "Pharma", subtitle: "Meds refill", tone: "green", icon: "pharmacy" },
  { title: "Badges", subtitle: "Your level", tone: "gold", badge: "#42", icon: "badges" },
]

const quickAccessRoutes: Partial<Record<QuickAccessItem["title"], string>> = {
  Stress: "/stress-relief",
  "Lab Test": "/lab-tests",
  Consult: "/ai-symptom-analyser",
  Tasks: "/weekend-tasks",
  Pharma: "/pharmacy",
  Badges: "/badges",
}

const feelings = [
  {
    id: "dizzy",
    title: "Feeling Dizzy",
    priority: "check hydration",
    tone: "light-blue",
    level: "medium",
    icon: <span className="emoji-icon sad-face" aria-hidden="true">😞</span>,
  },
  {
    id: "mental",
    title: "Mentally Disturbed",
    priority: "calm support",
    tone: "light-red",
    level: "high",
    icon: <span className="emoji-icon eye-spiral" aria-hidden="true">🌀</span>,
  },
  { id: "sleep", title: "Last Night Is...", priority: "recovery mode", tone: "light-purple", level: "low", icon: <FiMoon /> },
  { id: "tension", title: "Physical Tension", priority: "stretch break", tone: "light-orange", level: "medium", icon: <FiZap /> },
  {
    id: "fever",
    title: "Running Feve",
    priority: "care needed",
    tone: "light-rose",
    level: "high",
    icon: (
      <span className="fever-thermo" aria-hidden="true">
        <span className="fever-stem" />
        <span className="fever-bulb" />
      </span>
    ),
  },
  { id: "fatigue", title: "Chronic Fatigue", priority: "energy dip", tone: "light-gray", level: "medium", icon: <FiBatteryCharging /> },
] as const

const feelingPrefill: Record<(typeof feelings)[number]["id"], string> = {
  dizzy: "I am feeling dizzy since morning. Please help.",
  mental: "I am feeling mentally disturbed and anxious. Please guide me.",
  sleep: "I had poor sleep last night and feel drained today. Please help.",
  tension: "I am feeling physical tension and stress in my body. Please assist.",
  fever: "I think I have a fever and feel unwell. Please advise.",
  fatigue: "I am dealing with chronic fatigue and low energy. Please help.",
}

const tips: Tip[] = [
  { title: "Stay Hydrated", body: "Drink at least 8 glasses of water daily to maintain optimal health", tags: ["Hydration", "All Day"] },
  { title: "Mindful Breathing", body: "Take 5 deep breaths every hour to reduce stress and improve focus", tags: ["Stress", "Breathing"] },
  { title: "Quick Stretch", body: "Stand and stretch your shoulders for 2 minutes to ease muscle tension", tags: ["Mobility", "Desk Work"] },
  { title: "Healthy Snacks", body: "Choose protein-rich snacks to sustain energy through the afternoon", tags: ["Nutrition", "Workday"] },
  { title: "Sleep Routine", body: "Keep a fixed bedtime to improve recovery and next-day concentration", tags: ["Recovery", "Night"] },
]

const metrics: Array<{ id: MetricId; title: string; value: string; unit: string; status: string; age: string; tone: string; icon: ReactElement }> = [
  { id: "heart-rate", title: "Heart Rate", value: "72", unit: "bpm", status: "normal", age: "2 hours ago", tone: "red", icon: <FiHeart /> },
  { id: "blood-pressure", title: "Blood Pressure", value: "120/80", unit: "mmHg", status: "normal", age: "4 hours ago", tone: "blue", icon: <FiActivity /> },
  { id: "temperature", title: "Body Temperature", value: "98.6", unit: "F", status: "normal", age: "6 hours ago", tone: "orange", icon: <FiThermometer /> },
  { id: "weight", title: "Weight", value: "165", unit: "lbs", status: "normal", age: "1 day ago", tone: "green", icon: <FiPackage /> },
]
const HOME_SCROLL_KEY = "home:scrollTop"

function tabIcon(name: (typeof tabs)[number]["icon"]) {
  if (name === "home") return <FiHome />
  if (name === "health") return <FiActivity />
  if (name === "chat") return <FiMessageCircle />
  if (name === "stress") return <FiSmile />
  return <FiCreditCard />
}

function quickIcon(name: QuickAccessItem["icon"]) {
  if (name === "stress") return <FiSmile />
  if (name === "lab") return <FiThermometer />
  if (name === "consult") return <FiMapPin />
  if (name === "weekend") return <FiAward />
  if (name === "pharmacy") return <FiPackage />
  return <FiAward />
}

export default function Home() {
  const navigate = useNavigate()
  const location = useLocation()
  const [selectedFeelings, setSelectedFeelings] = useState<string[]>([])
  const [tipIndex, setTipIndex] = useState(0)
  const [isTabDocked, setIsTabDocked] = useState(false)
  const [displayScore, setDisplayScore] = useState(0)
  const [lastAction, setLastAction] = useState("Ready")
  const [tipInteracting, setTipInteracting] = useState(false)
  const [showSos, setShowSos] = useState(false)
  const [showEmergencyContacts, setShowEmergencyContacts] = useState(true)

  const tipTouchStartX = useRef<number | null>(null)
  const pageRef = useRef<HTMLElement | null>(null)
  const scoreTarget = 90

  useEffect(() => {
    if (tipInteracting) return
    const ticker = window.setInterval(() => {
      setTipIndex((prev) => (prev + 1) % tips.length)
    }, 4300)
    return () => window.clearInterval(ticker)
  }, [tipInteracting])

  useEffect(() => {
    let frame = 0
    const startedAt = performance.now()
    const duration = 1300

    const animate = (timestamp: number) => {
      const progress = Math.min(1, (timestamp - startedAt) / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayScore(Math.round(scoreTarget * eased))
      if (progress < 1) {
        frame = requestAnimationFrame(animate)
      }
    }

    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [scoreTarget])

  useEffect(() => {
    const saved = window.sessionStorage.getItem(HOME_SCROLL_KEY)
    if (!saved || !pageRef.current) return
    const y = Number(saved)
    if (Number.isNaN(y)) return
    const raf = window.requestAnimationFrame(() => {
      pageRef.current?.scrollTo({ top: y, behavior: "auto" })
    })
    return () => window.cancelAnimationFrame(raf)
  }, [])

  const activeTab: (typeof tabs)[number]["id"] = useMemo(() => {
    if (location.pathname.startsWith("/health")) return "Health"
    if (location.pathname.startsWith("/ai-chat")) return "AI Chat"
    if (location.pathname.startsWith("/stress-relief")) return "Stress Relief"
    if (location.pathname.startsWith("/wallet")) return "Wallet"
    return "Home"
  }, [location.pathname])

  function handleScroll(e: React.UIEvent<HTMLElement>) {
    const top = e.currentTarget.scrollTop
    window.sessionStorage.setItem(HOME_SCROLL_KEY, String(top))
    const nextDocked = top > 40
    setIsTabDocked((prev) => (prev === nextDocked ? prev : nextDocked))
  }

  function handleTabClick(tab: (typeof tabs)[number]["id"]) {
    navigate(tabRoutes[tab])
  }

  async function openQuickAccess(title: QuickAccessItem["title"]) {
    const route = quickAccessRoutes[title]
    if (route) {
      if (title === "Lab Test") {
        try {
          await Promise.race([
            preloadLabCatalog("", 10, 0),
            new Promise((resolve) => window.setTimeout(resolve, 1200)),
          ])
        } catch {
          // Lab page has its own loader/error fallback.
        }
      }
      navigate(route)
      return
    }
    setLastAction(`${title} coming soon`)
  }

  function toggleFeeling(id: string) {
    if (id in feelingPrefill) {
      const key = id as (typeof feelings)[number]["id"]
      navigate("/ai-chat", { state: { prefill: feelingPrefill[key] } })
      return
    }
    setSelectedFeelings((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  function onTipDragStart(clientX: number) {
    setTipInteracting(true)
    tipTouchStartX.current = clientX
  }

  function onTipDragEnd(clientX: number) {
    if (tipTouchStartX.current === null) return
    const delta = clientX - tipTouchStartX.current
    tipTouchStartX.current = null
    if (delta > 45) setTipIndex((prev) => (prev - 1 + tips.length) % tips.length)
    if (delta < -45) setTipIndex((prev) => (prev + 1) % tips.length)
    window.setTimeout(() => setTipInteracting(false), 900)
  }

  const companySession = getEmployeeCompanySession()

  useEffect(() => {
    const session = getEmployeeAuthSession()
    if (!session) {
      navigate("/login")
    }
  }, [navigate])

  return (
    <main className="home-page app-page-enter" onScroll={handleScroll} ref={pageRef}>
      <section className="home-shell">
        <header className="topbar app-fade-stagger">
          <div className="brand">
            <div className="brand-icon"><FiHeart /></div>
            <div className="brand-copy">
              <h1>{companySession?.companyName ?? "Astikan"}</h1>
            </div>
          </div>

          <button className="sos-btn app-pressable" type="button" onClick={() => setShowSos(true)}>
            <FiShield />
            <span>SOS</span>
          </button>

          <div className="header-actions">
            <button className="icon-btn notify-btn app-pressable" aria-label="notifications" type="button" onClick={() => navigate("/notifications")}>
              <FiBell />
              <span className="notify-count">3</span>
            </button>
            <button className="icon-btn profile-btn app-pressable" aria-label="profile" type="button" onClick={() => navigate("/profile-info")}>
              <FiUser />
            </button>
          </div>
        </header>

        <nav className={`tabbar app-fade-stagger ${isTabDocked ? "docked" : ""}`}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab app-pressable ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => handleTabClick(tab.id)}
              type="button"
            >
              <span className="tab-icon">{tabIcon(tab.icon)}</span>
              <span>{tab.id}</span>
            </button>
          ))}
        </nav>

        <section className="medicine-hero app-fade-stagger">
          <article className="medicine-hero-card">
            <div className="medicine-hero-copy">
              <h2><strong>Your medicines</strong> are on the way</h2>
              <p>Delivered in 5 MINS!</p>
              <button className="medicine-hero-cta app-pressable" type="button" onClick={() => navigate("/pharmacy/tracking")}>
                Track delivery
              </button>
            </div>

            <div className="medicine-hero-illustration" aria-hidden="true">
              <div className="route-line route-a" />
              <div className="route-line route-b" />
              <span className="hero-pin hero-shop"><FiMapPin /></span>
              <span className="hero-pin hero-mid"><FiMapPin /></span>
              <span className="hero-rider"><FiTruck /></span>
              <span className="hero-pack"><FiPackage /></span>
            </div>
          </article>
        </section>

        <section className="section app-fade-stagger">
          <h3 className="section-title quick-title quick-access-title">Quick Access</h3>
          <div className="quick-grid">
            {quickAccess.map((item) => (
              <button
                key={item.title}
                className={`quick-card app-pressable ${item.tone}`}
                onClick={() => openQuickAccess(item.title)}
                type="button"
              >
                <div className="quick-top">
                  <span className={`quick-icon ${item.icon === "stress" || item.icon === "lab" ? "bouncy" : ""}`}>{quickIcon(item.icon)}</span>
                  {item.badge && <span className="badge">{item.badge}</span>}
                </div>
                <h4>{item.title}</h4>
                {item.subtitle && <p>{item.subtitle}</p>}
              </button>
            ))}
          </div>
        </section>

        <section className="section app-fade-stagger">
          <h3 className="section-title">How are you feeling today?</h3>
          <div className="feeling-grid">
            {feelings.map((item) => (
              <button
                key={item.id}
                className={`feeling-card app-pressable ${item.tone} ${selectedFeelings.includes(item.id) ? "selected" : ""}`}
                onClick={() => toggleFeeling(item.id)}
                type="button"
              >
                <span className="feeling-icon">{item.icon}</span>
                <h4>{item.title}</h4>
                <span className={`priority ${item.level}`}>{item.priority}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="section app-fade-stagger">
          <h3 className="section-title daily-tips-title">Daily Health Tips</h3>
          <article
            className="tip-swiper"
            onMouseEnter={() => setTipInteracting(true)}
            onMouseLeave={() => setTipInteracting(false)}
            onTouchStart={(e) => onTipDragStart(e.changedTouches[0]?.clientX ?? 0)}
            onTouchEnd={(e) => onTipDragEnd(e.changedTouches[0]?.clientX ?? 0)}
          >
            <div
              className={`tip-track ${tipInteracting ? "dragging" : ""}`}
              style={{
                width: `${tips.length * 100}%`,
                transform: `translate3d(-${tipIndex * (100 / tips.length)}%, 0, 0)`,
              }}
            >
              {tips.map((tip, index) => (
                <section className="tip-card" key={tip.title} style={{ width: `${100 / tips.length}%` }}>
                  <div className="tip-header">
                    <div className="tip-title-icon">
                      <span className="tip-big-icon"><FiDroplet /></span>
                      <div>
                        <h4>{tip.title}</h4>
                        <div className="tip-tags">
                          {tip.tags.map((tag) => (
                            <span key={tag}>{tag}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className="tip-step">{index + 1} of {tips.length}</span>
                  </div>
                  <p>{tip.body}</p>
                </section>
              ))}
            </div>
            <div className="slider-dots">
              {tips.map((tip, index) => (
                <button
                  key={tip.title}
                  className={`dot app-pressable ${tipIndex === index ? "active" : ""}`}
                  onClick={() => setTipIndex(index)}
                  aria-label={`tip ${index + 1}`}
                  type="button"
                />
              ))}
            </div>
          </article>
        </section>

        <section className="section app-fade-stagger">
          <h3 className="section-title">Health Metrics</h3>
          <div className="metric-grid">
            {metrics.map((item) => (
              <button
                key={item.title}
                className={`metric-card app-pressable ${item.tone}`}
                onClick={() => navigate(`/metric/${item.id}`)}
                type="button"
              >
                <div className="metric-top">
                  <span className={`metric-icon ${item.tone === "red" ? "pulse-heart" : "pulse-gentle"}`}>{item.icon}</span>
                  <div className="metric-badge-pack">
                    <span className="status">{item.status}</span>
                  </div>
                </div>
                <p className="metric-value">
                  {item.value} <span>{item.unit}</span>
                </p>
                <h4>{item.title}</h4>
                <p className="metric-age">{item.age}</p>
                <div className="metric-bars" aria-hidden="true">
                  {Array.from({ length: 7 }).map((_, index) => (
                    <span key={`${item.title}-${index}`} style={{ animationDelay: `${index * 90}ms` }} />
                  ))}
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="score-card app-fade-stagger">
          <div className="score-copy">
            <div className="score-head-row">
              <h3>Health Score</h3>
              <span className="score-pill">Excellent</span>
            </div>
            <p className="score">{displayScore}<span>/100</span></p>
            <div className="score-progress" aria-hidden="true">
              <span style={{ width: `${displayScore}%` }} />
            </div>
            <p className="score-caption">Excellent health indicators. Keep up the good work!</p>
            <div className="score-tags">
              <span>Sleep +12%</span>
              <span>Hydration on track</span>
            </div>
            <small>{lastAction}</small>
          </div>
          <div className="score-icon"><FiHeart /></div>
        </section>
      </section>

      {showSos && (
        <div className="sos-overlay" onClick={() => setShowSos(false)}>
          <section className="sos-modal app-page-enter" onClick={(e) => e.stopPropagation()}>
            <header className="sos-head">
              <div className="sos-head-left">
                <span className="sos-head-icon"><FiShield /></span>
                <div>
                  <h3>Emergency</h3>
                  <p>Get immediate help</p>
                </div>
              </div>
              <button className="sos-close app-pressable" type="button" onClick={() => setShowSos(false)} aria-label="Close">
                <FiX />
              </button>
            </header>

            <div className="sos-body">
              <div className="sos-call-core">
                <span className="sos-call-icon"><FiPhoneCall /></span>
                <h4>Calling Emergency Services</h4>
                <p>Stay on the line and speak clearly</p>
                <div className="sos-connected">
                  <span />
                  <span />
                  <span />
                  <b>Connected</b>
                </div>
              </div>

              <div className="sos-contacts-head">
                <h5>Emergency Contact</h5>
                <button className="app-pressable" type="button" onClick={() => setShowEmergencyContacts((prev) => !prev)}>
                  {showEmergencyContacts ? "Hide" : "Show"}
                </button>
              </div>

              {showEmergencyContacts && (
                <div className="sos-contact-list">
                  <article className="sos-contact-card">
                    <span className="sos-contact-icon red"><FiShield /></span>
                    <div className="sos-contact-copy">
                      <h6>Emergency Services</h6>
                      <p>Police, Fire, Medical</p>
                    </div>
                    <div className="sos-contact-right">
                      <strong>911</strong>
                      <a href="tel:911" className="sos-call-btn app-pressable">Call</a>
                    </div>
                  </article>

                  <article className="sos-contact-card">
                    <span className="sos-contact-icon purple"><FiUser /></span>
                    <div className="sos-contact-copy">
                      <h6>Dr. Riza Yuhi</h6>
                      <p>Your Primary Doctor</p>
                    </div>
                    <div className="sos-contact-right">
                      <strong>(555) 123-4567</strong>
                      <a href="tel:+15551234567" className="sos-call-btn app-pressable">Call</a>
                    </div>
                  </article>

                  <article className="sos-contact-card">
                    <span className="sos-contact-icon orange"><FiAlertTriangle /></span>
                    <div className="sos-contact-copy">
                      <h6>Poison Control</h6>
                      <p>24/7 Poison Help</p>
                    </div>
                    <div className="sos-contact-right">
                      <strong>1-800-222-1222</strong>
                      <a href="tel:+18002221222" className="sos-call-btn app-pressable">Call</a>
                    </div>
                  </article>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
