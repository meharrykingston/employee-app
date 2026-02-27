import { useMemo, useRef, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import "./home.css"

type Tip = {
  title: string
  body: string
  tags: string[]
}

type QuickAccessItem = {
  title: string
  subtitle: string
  tone: "purple" | "blue" | "indigo" | "orange" | "green" | "gold"
  badge?: string
  icon: IconName
}

type IconName =
  | "heart"
  | "brain"
  | "test"
  | "pin"
  | "trophy"
  | "pill"
  | "award"
  | "moon"
  | "bolt"
  | "thermo"
  | "pulse"
  | "scale"
  | "menu"
  | "bell"
  | "user"
  | "call"
  | "video"
  | "chat"
  | "wallet"
  | "spark"
  | "home"

const tabs = [
  { id: "Home", icon: "home" },
  { id: "Health", icon: "heart" },
  { id: "AI Chat", icon: "chat" },
  { id: "Stress Relief", icon: "spark" },
  { id: "Wallet", icon: "wallet" },
] as const

const quickAccess: QuickAccessItem[] = [
  { title: "Stress Relief", subtitle: "Chat for emotional support", tone: "purple", badge: "New", icon: "brain" },
  { title: "Lab Tests", subtitle: "Free Slots", tone: "blue", icon: "test" },
  { title: "OPD / Tele...", subtitle: "Unlimited Co...", tone: "indigo", icon: "pin" },
  { title: "Weekend Tasks", subtitle: "Earn coins", tone: "orange", icon: "trophy" },
  { title: "Pharmacy", subtitle: "Order medicines", tone: "green", icon: "pill" },
  { title: "Badges", subtitle: "View your ranking", tone: "gold", badge: "#42", icon: "award" },
]

const feelings = [
  { id: "dizzy", title: "Feeling Dizzy", priority: "medium priority", tone: "light-blue", icon: "brain", level: "medium" },
  { id: "mental", title: "Mentally Disturbed", priority: "high priority", tone: "light-red", icon: "heart", level: "high" },
  { id: "sleep", title: "Last Night Is...", priority: "low priority", tone: "light-purple", icon: "moon", level: "low" },
  { id: "tension", title: "Physical Tension", priority: "medium priority", tone: "light-orange", icon: "bolt", level: "medium" },
  { id: "fever", title: "Running Feve", priority: "high priority", tone: "light-rose", icon: "thermo", level: "high" },
  { id: "fatigue", title: "Chronic Fatigue", priority: "medium priority", tone: "light-gray", icon: "pulse", level: "medium" },
] as const

const tips: Tip[] = [
  {
    title: "Stay Hydrated",
    body: "Drink at least 8 glasses of water daily to maintain optimal health",
    tags: ["Hydration", "All Day"],
  },
  {
    title: "Mindful Breathing",
    body: "Take 5 deep breaths every hour to reduce stress and improve focus",
    tags: ["Stress", "Breathing"],
  },
  {
    title: "Quick Stretch",
    body: "Stand and stretch your shoulders for 2 minutes to ease muscle tension",
    tags: ["Mobility", "Desk Work"],
  },
  {
    title: "Healthy Snacks",
    body: "Choose protein-rich snacks to sustain energy through the afternoon",
    tags: ["Nutrition", "Workday"],
  },
  {
    title: "Sleep Routine",
    body: "Keep a fixed bedtime to improve recovery and next-day concentration",
    tags: ["Recovery", "Night"],
  },
]

const metrics = [
  { title: "Heart Rate", value: "72", unit: "bpm", status: "normal", age: "2 hours ago", tone: "red", icon: "heart" },
  { title: "Blood Pressure", value: "120/80", unit: "mmHg", status: "normal", age: "4 hours ago", tone: "blue", icon: "pulse" },
  { title: "Body Temperatu", value: "98.6", unit: "F", status: "normal", age: "6 hours ago", tone: "orange", icon: "thermo" },
  { title: "Weight", value: "165", unit: "lbs", status: "normal", age: "1 day ago", tone: "green", icon: "scale" },
] as const

function AppIcon({ name, className }: { name: IconName; className?: string }) {
  const common = { viewBox: "0 0 24 24", "aria-hidden": true }

  switch (name) {
    case "heart":
      return (
        <svg {...common} className={className}><path d="M12 20s-6.7-4.3-9-8c-2-3.2.2-7 3.9-7 2 0 3.5 1 4.3 2.3C12 6 13.5 5 15.5 5c3.7 0 6 3.8 3.9 7-2.3 3.7-9 8-9 8z" /></svg>
      )
    case "brain":
      return (
        <svg {...common} className={className}><path d="M8 6a3 3 0 0 1 5-2 3.5 3.5 0 0 1 5 3v1a3 3 0 0 1 1 5v2a3 3 0 0 1-3 3h-1a3 3 0 0 1-6 0H8a3 3 0 0 1-3-3v-2a3 3 0 0 1 1-5V7a3 3 0 0 1 2-1z" /></svg>
      )
    case "test":
      return <svg {...common} className={className}><path d="M9 3h6M10 3v5l-4 8a3 3 0 0 0 2.7 4h6.6A3 3 0 0 0 18 16l-4-8V3" /></svg>
    case "pin":
      return <svg {...common} className={className}><path d="M12 21s7-7 7-12a7 7 0 1 0-14 0c0 5 7 12 7 12zm0-9.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" /></svg>
    case "trophy":
      return <svg {...common} className={className}><path d="M8 4h8v2a4 4 0 0 1-8 0V4zm-3 1h3v1a5 5 0 0 1-3 4V5zm14 0h-3v1a5 5 0 0 0 3 4V5zM12 12v4m-3 4h6" /></svg>
    case "pill":
      return <svg {...common} className={className}><path d="M8 16a4 4 0 1 1-6-5l6-6a4 4 0 0 1 6 5l-6 6zm4-8 6 6m-4-8 4-4a4 4 0 1 1 6 6l-4 4" /></svg>
    case "award":
      return <svg {...common} className={className}><path d="M12 3a5 5 0 0 1 5 5c0 2.8-2.2 5-5 5s-5-2.2-5-5a5 5 0 0 1 5-5zm-2 10 2 8 2-8" /></svg>
    case "moon":
      return <svg {...common} className={className}><path d="M15 3a8 8 0 1 0 6 13 7 7 0 1 1-6-13z" /></svg>
    case "bolt":
      return <svg {...common} className={className}><path d="M13 2 5 13h5l-1 9 8-11h-5l1-9z" /></svg>
    case "thermo":
      return <svg {...common} className={className}><path d="M10 6a2 2 0 1 1 4 0v7.2a4 4 0 1 1-4 0V6z" /></svg>
    case "pulse":
      return <svg {...common} className={className}><path d="M2 12h4l2-4 3 8 2-4h9" /></svg>
    case "scale":
      return <svg {...common} className={className}><path d="M12 4v16m-6-2h12M6 8h12m-10 0-3 6h6l-3-6zm8 0-3 6h6l-3-6" /></svg>
    case "menu":
      return <svg {...common} className={className}><path d="M4 7h16M4 12h16M4 17h16" /></svg>
    case "bell":
      return <svg {...common} className={className}><path d="M15 17H5l1.5-2v-3a4.5 4.5 0 0 1 9 0v3L17 17h-2zm-3 4a2 2 0 0 1-2-2h4a2 2 0 0 1-2 2z" /></svg>
    case "user":
      return <svg {...common} className={className}><path d="M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 8a7 7 0 0 1 14 0" /></svg>
    case "call":
      return <svg {...common} className={className}><path d="M6 3h4l1 4-2 2a13 13 0 0 0 6 6l2-2 4 1v4a2 2 0 0 1-2 2A15 15 0 0 1 4 5a2 2 0 0 1 2-2z" /></svg>
    case "video":
      return <svg {...common} className={className}><path d="M4 7h11a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4V7zm13 4 3-2v6l-3-2v-2z" /></svg>
    case "chat":
      return <svg {...common} className={className}><path d="M4 5h16v10H8l-4 4V5z" /></svg>
    case "wallet":
      return <svg {...common} className={className}><path d="M3 7h18v10H3V7zm12 5h3m-12-8h12v3H6z" /></svg>
    case "spark":
      return <svg {...common} className={className}><path d="M13 2 6 13h5l-1 9 7-11h-5l1-9z" /></svg>
    case "home":
      return <svg {...common} className={className}><path d="M4 11 12 4l8 7v9h-6v-6h-4v6H4v-9z" /></svg>
    default:
      return <svg {...common} className={className}><circle cx="12" cy="12" r="2" /></svg>
  }
}

export default function Home() {
  const navigate = useNavigate()
  const location = useLocation()
  const [showNav, setShowNav] = useState(false)
  const [selectedFeelings, setSelectedFeelings] = useState<string[]>([])
  const [tipIndex, setTipIndex] = useState(0)
  const [message, setMessage] = useState("")
  const [lastAction, setLastAction] = useState("Ready")
  const [showAttachMenu, setShowAttachMenu] = useState(false)
  const [fileAccept, setFileAccept] = useState("image/*,.pdf")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const tipTouchStartX = useRef<number | null>(null)

  const currentTip = tips[tipIndex]
  const score = useMemo(() => 92 + Math.min(selectedFeelings.length, 6), [selectedFeelings.length])
  const activeTab = location.pathname === "/health" ? "Health" : "Home"

  function handleTabClick(tab: (typeof tabs)[number]["id"]) {
    if (tab === "Home") {
      navigate("/home")
      return
    }
    if (tab === "Health") {
      navigate("/health")
      return
    }
    setLastAction(`${tab} coming soon`)
  }

  function toggleFeeling(id: string) {
    setSelectedFeelings((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  function nextTip() {
    setTipIndex((prev) => (prev + 1) % tips.length)
  }

  function prevTip() {
    setTipIndex((prev) => (prev - 1 + tips.length) % tips.length)
  }

  function sendMessage() {
    if (!message.trim()) {
      setLastAction("Type something to send")
      return
    }
    setLastAction(`Sent: ${message.trim()}`)
    setMessage("")
  }

  function chooseAttachment(kind: "image" | "pdf") {
    const accept = kind === "image" ? "image/*" : ".pdf,application/pdf"
    setFileAccept(accept)
    setShowAttachMenu(false)
    fileInputRef.current?.click()
  }

  function onAttachmentSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) {
      return
    }
    const picked = Array.from(files).map((file) => file.name).join(", ")
    setLastAction(`Attached: ${picked}`)
    e.target.value = ""
  }

  function onTipTouchStart(e: React.TouchEvent<HTMLElement>) {
    tipTouchStartX.current = e.changedTouches[0]?.clientX ?? null
  }

  function onTipTouchEnd(e: React.TouchEvent<HTMLElement>) {
    if (tipTouchStartX.current === null) {
      return
    }
    const endX = e.changedTouches[0]?.clientX ?? tipTouchStartX.current
    const delta = endX - tipTouchStartX.current
    tipTouchStartX.current = null

    if (delta > 45) {
      prevTip()
    } else if (delta < -45) {
      nextTip()
    }
  }

  return (
    <main className="home-page app-page-enter">
      <section className="home-shell app-content-slide">
        <header className="topbar app-fade-stagger">
          <div className="brand">
            <div className="brand-icon">
              <AppIcon name="heart" className="ico" />
            </div>
            <div className="brand-copy">
              <h1>HCLTech</h1>
              <p>Health Companion</p>
            </div>
          </div>
          <button className="icon-btn app-pressable" aria-label="notifications"><AppIcon name="bell" className="ico" /></button>
          <button className={`hamburger app-pressable ${showNav ? "open" : ""}`} aria-label="menu" onClick={() => setShowNav(true)}>
            <span />
            <span />
            <span />
          </button>
        </header>

        <nav className="tabbar app-fade-stagger">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab app-pressable ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => handleTabClick(tab.id)}
            >
              <AppIcon name={tab.icon} className="tab-ico" />
              <span>{tab.id}</span>
            </button>
          ))}
        </nav>

        <section className="doctor-card app-fade-stagger">
          <div className="avatar">DR</div>
          <div className="doctor-copy">
            <h2>Dr. Riza Yuji</h2>
            <p>Internal Medicine</p>
            <div className="doctor-meta">
              <span className="online-dot" />
              <span>4.9</span>
              <span className="pill">Available now</span>
            </div>
          </div>
          <div className="doctor-actions">
            <button className="app-pressable" aria-label="call"><AppIcon name="call" className="ico" /></button>
            <button className="app-pressable" aria-label="video"><AppIcon name="video" className="ico" /></button>
          </div>
        </section>

        <section className="section app-fade-stagger">
          <h3 className="section-title">Quick Access</h3>
          <div className="quick-grid">
            {quickAccess.map((item) => (
              <button
                key={item.title}
                className={`quick-card app-pressable ${item.tone}`}
                onClick={() => setLastAction(`${item.title} opened`)}
              >
                {item.badge && <span className="badge">{item.badge}</span>}
                <span className="quick-icon">
                  <AppIcon name={item.icon} className="ico" />
                </span>
                <h4>{item.title}</h4>
                <p>{item.subtitle}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="section app-fade-stagger">
          <h3 className="section-title">How are you feeling today?</h3>
          <p className="section-sub">Select your symptoms for AI analysis</p>
          <div className="feeling-grid">
            {feelings.map((item) => (
              <button
                key={item.id}
                className={`feeling-card app-pressable ${item.tone} ${selectedFeelings.includes(item.id) ? "selected" : ""}`}
                onClick={() => toggleFeeling(item.id)}
              >
                <span className="feeling-icon">
                  <AppIcon name={item.icon} className="ico" />
                </span>
                <h4>{item.title}</h4>
                <span className={`priority ${item.level}`}>{item.priority}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="section app-fade-stagger">
          <h3 className="section-title">Daily Health Tips</h3>
          <article className="tip-card" onTouchStart={onTipTouchStart} onTouchEnd={onTipTouchEnd}>
            <button className="tip-arrow left app-pressable" onClick={prevTip} aria-label="previous tip">&lt;</button>
            <button className="tip-arrow right app-pressable" onClick={nextTip} aria-label="next tip">&gt;</button>
            <div className="tip-header">
              <div className="tip-title-icon">
                <span className="tip-big-icon">
                  <AppIcon name="pin" className="ico" />
                </span>
                <div>
                  <h4>{currentTip.title}</h4>
                  <div className="tip-tags">
                    {currentTip.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
              <span className="tip-step">
                {tipIndex + 1} of {tips.length}
              </span>
            </div>
            <p>{currentTip.body}</p>
            <div className="slider-dots">
              {tips.map((_, index) => (
                <button
                  key={index}
                  className={`dot app-pressable ${tipIndex === index ? "active" : ""}`}
                  onClick={() => setTipIndex(index)}
                  aria-label={`tip ${index + 1}`}
                />
              ))}
            </div>
          </article>
        </section>

        <section className="section app-fade-stagger">
          <h3 className="section-title">Health Metrics</h3>
          <p className="section-sub">Track your vital signs and health data</p>
          <div className="metric-grid">
            {metrics.map((item) => (
              <button
                key={item.title}
                className={`metric-card app-pressable ${item.tone}`}
                onClick={() => setLastAction(`${item.title} details viewed`)}
              >
                <div className="metric-top">
                  <span className="metric-icon">
                    <AppIcon name={item.icon} className="ico" />
                  </span>
                  <span className="status">{item.status}</span>
                </div>
                <p className="metric-value">
                  {item.value} <span>{item.unit}</span>
                </p>
                <h4>{item.title}</h4>
                <p className="metric-age">{item.age}</p>
                <div className="metric-bars">
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="score-card app-fade-stagger">
          <div>
            <h3>Health Score</h3>
            <p className="score">{score}/100</p>
            <p>Excellent health indicators. Keep up the good work!</p>
            <small>{lastAction}</small>
          </div>
          <div className="score-icon">
            <AppIcon name="heart" className="ico" />
          </div>
        </section>
      </section>

      <footer className="composer app-fade-stagger">
        <button
          className="round-btn app-pressable"
          aria-label="attach files"
          onClick={() => setShowAttachMenu(true)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M16.5 6.5v9a4.5 4.5 0 1 1-9 0v-10a3 3 0 1 1 6 0v9a1.5 1.5 0 1 1-3 0V7.5" />
          </svg>
        </button>

        <input
          type="text"
          placeholder="write something..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              sendMessage()
            }
          }}
        />

        <button className="send-btn app-pressable" aria-label="send message" onClick={sendMessage}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 11.5L21 3l-8.5 18-2.3-6.7L3 11.5z" />
          </svg>
        </button>
      </footer>

      <input
        ref={fileInputRef}
        className="hidden-file-input"
        type="file"
        accept={fileAccept}
        onChange={onAttachmentSelected}
      />

      {showAttachMenu && (
        <div className="attach-overlay" onClick={() => setShowAttachMenu(false)}>
          <div className="attach-sheet app-page-enter" onClick={(e) => e.stopPropagation()}>
            <h4>Add attachment</h4>
            <button className="app-pressable" onClick={() => chooseAttachment("image")}>Image</button>
            <button className="app-pressable" onClick={() => chooseAttachment("pdf")}>PDF</button>
            <button className="cancel app-pressable" onClick={() => setShowAttachMenu(false)}>Cancel</button>
          </div>
        </div>
      )}

      {showNav && (
        <div className="drawer-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowNav(false)
          }
        }}>
          <aside className="drawer app-page-enter" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-head">
              <div>
                <h4>Quick Menu</h4>
                <p>Navigate your app</p>
              </div>
              <button className="icon-btn app-pressable" onClick={() => setShowNav(false)} aria-label="close menu">
                x
              </button>
            </div>
            <button className="drawer-link app-pressable" onClick={() => { setShowNav(false); navigate("/home") }}>Home</button>
            <button className="drawer-link app-pressable" onClick={() => { setShowNav(false); navigate("/health") }}>Health</button>
            <button className="drawer-link app-pressable" onClick={() => { setShowNav(false); setLastAction("AI Chat coming soon") }}>AI Chat</button>
            <button className="drawer-link app-pressable" onClick={() => { setShowNav(false); setLastAction("Profile coming soon") }}>Profile</button>
          </aside>
        </div>
      )}
    </main>
  )
}
