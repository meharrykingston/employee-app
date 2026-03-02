import { useMemo, useState } from "react"
import {
  FiArrowLeft,
  FiActivity,
  FiHeart,
  FiMoon,
  FiMusic,
  FiSend,
  FiSmile,
  FiSun,
  FiWind,
  FiZap,
} from "react-icons/fi"
import { useNavigate } from "react-router-dom"
import "./stresschat.css"

type Mode = null | "breathing" | "sleep"

type ActivityItem = {
  id: string
  title: string
  subtitle: string
  tone: "blue" | "pink" | "purple" | "teal"
  icon: React.ReactElement
  action?: Mode
}

const activityItems: ActivityItem[] = [
  { id: "breathing", title: "Breathing", subtitle: "2 mins", tone: "blue", icon: <FiWind />, action: "breathing" },
  { id: "meditation", title: "Meditation", subtitle: "Calm mind", tone: "pink", icon: <FiHeart /> },
  { id: "sleep", title: "Sleep Sounds", subtitle: "Night mode", tone: "purple", icon: <FiMoon />, action: "sleep" },
  { id: "reset", title: "Mood Reset", subtitle: "Quick relax", tone: "teal", icon: <FiSmile /> },
]

const ritualCards = [
  { title: "Morning Breath", progress: 70, icon: <FiSun /> },
  { title: "Hydration Break", progress: 45, icon: <FiActivity /> },
  { title: "Evening Unwind", progress: 60, icon: <FiMoon /> },
]

export default function StressRelief() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>(null)
  const [draft, setDraft] = useState("")
  const [lastSent, setLastSent] = useState("")

  const calmScore = useMemo(() => 78, [])

  function triggerActivity(item: ActivityItem) {
    if (item.action) {
      setMode(item.action)
      return
    }
    setLastSent(`${item.title} started. Nice choice.`)
  }

  function onSend() {
    const text = draft.trim()
    if (!text) return
    setLastSent(text)
    setDraft("")
  }

  return (
    <div className="stress-page app-page-enter">
      <header className="stress-header app-fade-stagger">
        <button className="stress-back app-pressable" onClick={() => navigate(-1)} type="button" aria-label="Back">
          <FiArrowLeft />
        </button>
        <div className="stress-header-copy">
          <h1 className="stress-title">Stress Relief</h1>
          <p className="stress-subtitle">Your safe space to unwind</p>
        </div>
      </header>

      <div className="stress-content app-content-slide">
        <section className="calm-hero app-fade-stagger">
          <div className="calm-hero-copy">
            <p>Today&apos;s Calm Score</p>
            <h2>{calmScore}<span>/100</span></h2>
            <div className="mood-chips">
              <span><FiSmile /> Stable</span>
              <span><FiZap /> Light stress</span>
            </div>
          </div>
          <div className="calm-illustration" aria-hidden="true">
            <div className="orb orb-a" />
            <div className="orb orb-b" />
            <div className="wave wave-a" />
            <div className="wave wave-b" />
          </div>
        </section>

        <section className="stress-section app-fade-stagger">
          <h3 className="stress-section-title">Quick Relief Activities</h3>
          <div className="activities">
            {activityItems.map((item) => (
              <button key={item.id} className={`activity-card ${item.tone} app-pressable`} type="button" onClick={() => triggerActivity(item)}>
                <span className="activity-icon">{item.icon}</span>
                <h4>{item.title}</h4>
                <p>{item.subtitle}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="stress-section app-fade-stagger">
          <h3 className="stress-section-title">Daily Rituals</h3>
          <div className="ritual-grid">
            {ritualCards.map((ritual) => (
              <article className="ritual-card" key={ritual.title}>
                <div className="ritual-head">
                  <span>{ritual.icon}</span>
                  <strong>{ritual.title}</strong>
                </div>
                <div className="ritual-track"><span style={{ width: `${ritual.progress}%` }} /></div>
              </article>
            ))}
          </div>
        </section>

        <section className="chat-area app-fade-stagger">
          <div className="chat-bubble">
            Hello. I am your stress relief companion. Share your feelings or thoughts. I am here to listen.
            <div className="time">Live support</div>
          </div>
          {lastSent && <div className="chat-bubble user">{lastSent}</div>}
        </section>
      </div>

      <div className="stress-input">
        <button className="input-icon app-pressable" type="button" aria-label="Open soundscape" onClick={() => setMode("sleep")}>
          <FiMusic />
        </button>
        <input placeholder="Share your feelings..." value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && onSend()} />
        <button className="send-btn app-pressable" type="button" aria-label="Send" onClick={onSend}><FiSend /></button>
      </div>

      {mode === "breathing" && (
        <div className="overlay" onClick={() => setMode(null)}>
          <div className="breath-wrap">
            <div className="breath-ring ring-1" />
            <div className="breath-ring ring-2" />
            <div className="breath-circle" />
          </div>
          <p className="overlay-title">Breathing Exercise</p>
          <p className="overlay-sub">Inhale for 4s, hold for 4s, exhale for 4s</p>
        </div>
      )}

      {mode === "sleep" && (
        <div className="overlay" onClick={() => setMode(null)}>
          <p className="overlay-title">Sleep Sounds</p>
          <p className="overlay-sub">Choose a calming soundscape</p>
          <div className="sleep-tags">
            <span>Rain</span>
            <span>Ocean</span>
            <span>Forest</span>
          </div>
          <audio controls autoPlay loop>
            <source src="/sounds/rain.mp3" type="audio/mpeg" />
          </audio>
          <p style={{ marginTop: 16, color: "#6b7280" }}>Tap anywhere to close</p>
        </div>
      )}
    </div>
  )
}
