import { type ReactNode, useState } from "react"
import { useNavigate } from "react-router-dom"
import "./health.css"

type Range = "Day" | "Week" | "Month" | "Year"

type MetricProps = {
  title: string
  value: string
  suffix: string
  delta: string
  color: "red" | "blue" | "purple" | "green"
}

type SectionProps = {
  title: string
  children: ReactNode
}

type ActivityProps = {
  text: string
  time: string
  status: "completed" | "pending"
}

type IconName = "back" | "chat" | "calendar" | "heart" | "steps" | "mind" | "pill"

function Icon({ name, className }: { name: IconName; className?: string }) {
  const common = { viewBox: "0 0 24 24", "aria-hidden": true, className }

  switch (name) {
    case "back":
      return <svg {...common}><path d="M14 6 8 12l6 6" /><path d="M9 12h7" /></svg>
    case "chat":
      return <svg {...common}><path d="M4 5h16v10H8l-4 4V5z" /></svg>
    case "calendar":
      return <svg {...common}><path d="M7 3v4M17 3v4M4 9h16M5 6h14a1 1 0 0 1 1 1v12H4V7a1 1 0 0 1 1-1z" /></svg>
    case "heart":
      return <svg {...common}><path d="M12 20s-6.7-4.3-9-8c-2-3.2.2-7 3.9-7 2 0 3.5 1 4.3 2.3C12 6 13.5 5 15.5 5c3.7 0 6 3.8 3.9 7-2.3 3.7-9 8-9 8z" /></svg>
    case "steps":
      return <svg {...common}><path d="M8 5a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm8 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM6 16c2 0 2 3 4 3h2M14 5c0 2 3 2 3 4v2" /></svg>
    case "mind":
      return <svg {...common}><path d="M8 6a3 3 0 0 1 5-2 3.5 3.5 0 0 1 5 3v1a3 3 0 0 1 1 5v2a3 3 0 0 1-3 3h-1a3 3 0 0 1-6 0H8a3 3 0 0 1-3-3v-2a3 3 0 0 1 1-5V7a3 3 0 0 1 2-1z" /></svg>
    case "pill":
      return <svg {...common}><path d="M8 16a4 4 0 1 1-6-5l6-6a4 4 0 0 1 6 5l-6 6zm4-8 6 6" /></svg>
    default:
      return <svg {...common}><circle cx="12" cy="12" r="2" /></svg>
  }
}

export default function Health() {
  const navigate = useNavigate()
  const [range, setRange] = useState<Range>("Day")

  return (
    <main className="health-screen app-page-enter app-content-slide-rtl">
      <header className="health-header app-fade-stagger">
        <button className="back-btn app-pressable" onClick={() => navigate("/home")} aria-label="Back to home">
          <Icon name="back" className="h-icon" />
        </button>
        <div>
          <h1>Your Health</h1>
          <p>Your complete health overview</p>
        </div>
      </header>

      <nav className="tabs app-fade-stagger">
        {(["Day", "Week", "Month", "Year"] as const).map((tab) => (
          <button
            key={tab}
            className={`app-pressable ${range === tab ? "active" : ""}`}
            onClick={() => setRange(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>

      <section className="metrics app-fade-stagger">
        <Metric title="Overall Health Score" value="92" suffix="/100" delta="+5" color="red" />
        <Metric title="Activity Level" value="8.5" suffix="k steps" delta="+12%" color="blue" />
        <Metric title="Mental Wellness" value="87" suffix="/100" delta="+3" color="purple" />
        <Metric title="Medication Adhere" value="95" suffix="%" delta="+8%" color="green" />
      </section>

      <Section title="Recent Activities">
        <Activity text="Checkup with Dr. Riza" time="2 hours ago" status="completed" />
        <Activity text="Took morning medication" time="4 hours ago" status="completed" />
        <Activity text="Blood test results ready" time="1 day ago" status="pending" />
        <Activity text="AI analysis: Feeling dizzy" time="2 days ago" status="completed" />
      </Section>

      <Section title="Recent Achievements">
        <div className="achievements">
          <article className="achievement app-fade-stagger app-pressable">
            <Icon name="heart" className="h-icon big" />
            <strong>7-Day Streak</strong>
            <p>Medication adherence</p>
          </article>
          <article className="achievement app-fade-stagger app-pressable">
            <Icon name="steps" className="h-icon big" />
            <strong>Health Champion</strong>
            <p>Monthly goals achieved</p>
          </article>
        </div>
      </Section>

      <footer className="bottom-actions app-fade-stagger">
        <button className="chat-btn app-pressable">
          <Icon name="chat" className="h-icon" />
          AI Health Chat
        </button>
        <button className="book-btn app-pressable">
          <Icon name="calendar" className="h-icon" />
          Book Appointment
        </button>
      </footer>
    </main>
  )
}

function Metric({ title, value, suffix, delta, color }: MetricProps) {
  const icon: Record<MetricProps["color"], IconName> = {
    red: "heart",
    blue: "steps",
    purple: "mind",
    green: "pill",
  }

  return (
    <article className={`metric-card ${color} app-pressable`}>
      <div className="metric-top">
        <span className="metric-chip"><Icon name={icon[color]} className="h-icon" /></span>
        <span className="delta">{delta}</span>
      </div>
      <h2>
        {value}
        <span>{suffix}</span>
      </h2>
      <p>{title}</p>
      <div className="progress" />
    </article>
  )
}

function Section({ title, children }: SectionProps) {
  return (
    <section className="section app-fade-stagger">
      <h3>{title}</h3>
      {children}
    </section>
  )
}

function Activity({ text, time, status }: ActivityProps) {
  return (
    <article className="activity app-pressable">
      <div>
        <strong>{text}</strong>
        <p>{time}</p>
      </div>
      <span className={`badge ${status}`}>{status}</span>
    </article>
  )
}

