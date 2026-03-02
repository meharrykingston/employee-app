import { useState, type ReactElement } from "react"
import { FiActivity, FiArrowLeft, FiHeart, FiPackage, FiThermometer } from "react-icons/fi"
import { useNavigate, useParams } from "react-router-dom"
import "./metric-details.css"

type WindowKey = "7D" | "14D" | "30D"

type MetricConfig = {
  title: string
  current: string
  unit: string
  subtitle: string
  insight: string
  icon: ReactElement
  tone: "red" | "blue" | "orange" | "green"
  windows: Record<WindowKey, number[]>
  tips: string[]
}

const details: Record<string, MetricConfig> = {
  "heart-rate": {
    title: "Heart Rate",
    current: "72",
    unit: "bpm",
    subtitle: "Within healthy resting range",
    insight: "Stable rhythm with no irregular spikes in recent trend.",
    icon: <FiHeart />,
    tone: "red",
    windows: {
      "7D": [74, 72, 75, 71, 73, 72, 70],
      "14D": [76, 74, 73, 72, 75, 71, 73, 72, 70, 72, 74, 71, 72, 72],
      "30D": [77, 76, 75, 74, 75, 74, 73, 72, 73, 72, 71, 72, 74, 73, 72, 72, 71, 70, 72, 73, 72, 71, 72, 73, 72, 71, 70, 72, 72, 72],
    },
    tips: ["Hydrate before noon", "Sleep at fixed timing", "Limit caffeine after 4 PM"],
  },
  "blood-pressure": {
    title: "Blood Pressure",
    current: "120/80",
    unit: "mmHg",
    subtitle: "Normal blood pressure reading",
    insight: "Pressure trend is controlled. No sustained high readings found.",
    icon: <FiActivity />,
    tone: "blue",
    windows: {
      "7D": [118, 120, 122, 121, 119, 120, 118],
      "14D": [122, 121, 120, 119, 120, 121, 122, 121, 120, 119, 120, 121, 119, 118],
      "30D": [124, 123, 122, 121, 121, 120, 120, 119, 120, 121, 122, 121, 120, 120, 119, 118, 119, 120, 121, 120, 119, 120, 121, 120, 119, 118, 119, 119, 118, 118],
    },
    tips: ["Reduce high-salt snacks", "Walk 20 mins daily", "Monitor at same time each day"],
  },
  temperature: {
    title: "Body Temperature",
    current: "98.6",
    unit: "F",
    subtitle: "Normal body temperature",
    insight: "No fever pattern visible. Thermal range remained stable.",
    icon: <FiThermometer />,
    tone: "orange",
    windows: {
      "7D": [98.4, 98.6, 98.5, 98.7, 98.6, 98.5, 98.6],
      "14D": [98.3, 98.4, 98.5, 98.4, 98.6, 98.5, 98.6, 98.7, 98.6, 98.5, 98.6, 98.5, 98.6, 98.6],
      "30D": [98.4, 98.5, 98.4, 98.5, 98.6, 98.6, 98.5, 98.4, 98.5, 98.6, 98.7, 98.6, 98.5, 98.5, 98.6, 98.5, 98.4, 98.5, 98.6, 98.6, 98.5, 98.5, 98.6, 98.6, 98.5, 98.4, 98.5, 98.6, 98.6, 98.6],
    },
    tips: ["Continue hydration", "Avoid skipping meals", "Track if chills/fatigue appear"],
  },
  weight: {
    title: "Weight",
    current: "165",
    unit: "lbs",
    subtitle: "Consistent with your previous week",
    insight: "Weight is stable across recent windows with minor fluctuation.",
    icon: <FiPackage />,
    tone: "green",
    windows: {
      "7D": [165, 165, 164, 165, 166, 165, 165],
      "14D": [166, 165, 165, 164, 165, 166, 165, 165, 164, 165, 166, 165, 165, 165],
      "30D": [167, 166, 166, 165, 165, 164, 165, 166, 166, 165, 165, 164, 165, 166, 165, 165, 164, 165, 166, 165, 165, 164, 165, 166, 165, 165, 164, 165, 165, 165],
    },
    tips: ["Keep meal timing consistent", "Track weekly average", "Add light strength training"],
  },
}

function avg(values: number[]) {
  return values.reduce((sum, item) => sum + item, 0) / values.length
}

export default function MetricDetails() {
  const navigate = useNavigate()
  const { metricId } = useParams()
  const metric = details[metricId ?? "heart-rate"] ?? details["heart-rate"]
  const [windowKey, setWindowKey] = useState<WindowKey>("7D")
  const history = metric.windows[windowKey]

  const max = Math.max(...history)
  const min = Math.min(...history)
  const range = max - min || 1
  const average = avg(history)
  const trendDelta = history[history.length - 1] - history[0]
  const trendText = trendDelta > 0 ? `+${trendDelta.toFixed(1)}` : trendDelta.toFixed(1)

  return (
    <main className="metric-detail-page app-page-enter">
      <header className="metric-detail-header app-fade-stagger">
        <button className="metric-back app-pressable" type="button" onClick={() => navigate(-1)} aria-label="Back">
          <FiArrowLeft />
        </button>
        <h1>{metric.title} Analysis</h1>
      </header>

      <section className="metric-detail-shell app-content-slide">
        <article className={`metric-hero ${metric.tone} app-fade-stagger`}>
          <span className="hero-icon">{metric.icon}</span>
          <div>
            <h2>{metric.current} <small>{metric.unit}</small></h2>
            <p>{metric.subtitle}</p>
          </div>
        </article>

        <article className="metric-window-card app-fade-stagger">
          <h3>Time Window</h3>
          <div className="window-switch">
            {(["7D", "14D", "30D"] as const).map((item) => (
              <button
                key={item}
                type="button"
                className={`window-btn app-pressable ${windowKey === item ? "active" : ""}`}
                onClick={() => setWindowKey(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </article>

        <article className="metric-summary-grid app-fade-stagger">
          <section className="summary-item">
            <span>Average</span>
            <strong>{average.toFixed(1)} {metric.unit}</strong>
          </section>
          <section className="summary-item">
            <span>Lowest</span>
            <strong>{min.toFixed(1)} {metric.unit}</strong>
          </section>
          <section className="summary-item">
            <span>Highest</span>
            <strong>{max.toFixed(1)} {metric.unit}</strong>
          </section>
          <section className="summary-item trend">
            <span>Trend</span>
            <strong>{trendText} {metric.unit}</strong>
          </section>
        </article>

        <article className="metric-chart-card app-fade-stagger">
          <h3>Trend ({windowKey})</h3>
          <div className="metric-chart">
            {history.map((value, index) => {
              const height = 26 + ((value - min) / range) * 70
              return (
                <div className="bar-wrap" key={`${metric.title}-${windowKey}-${index}`}>
                  <span
                    className={`bar ${metric.tone}`}
                    style={{ height: `${height}%`, animationDelay: `${index * 70}ms` }}
                  />
                  <small>{index + 1}</small>
                </div>
              )
            })}
          </div>
        </article>

        <article className="metric-insight-card app-fade-stagger">
          <h3>Clinical insight</h3>
          <p>{metric.insight}</p>
          <ul>
            {metric.tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
            <li>Book consultation if unusual trend persists for 3+ days</li>
          </ul>
        </article>
      </section>
    </main>
  )
}
