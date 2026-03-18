import { useEffect, useRef, useState, type ReactElement } from "react"
import { FiActivity, FiArrowLeft, FiHeart, FiPackage, FiThermometer } from "react-icons/fi"
import { useNavigate, useParams } from "react-router-dom"
import { saveVitalReading } from "../../services/vitalsApi"
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
  const [measureStage, setMeasureStage] = useState<"idle" | "prepare" | "measuring" | "done">("idle")
  const [measureProgress, setMeasureProgress] = useState(0)
  const [measureBpm, setMeasureBpm] = useState(72)
  const [cameraError, setCameraError] = useState("")
  const [lowSignal, setLowSignal] = useState(false)
  const [signalQuality, setSignalQuality] = useState(0)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const measureStartRef = useRef<number | null>(null)
  const samplesRef = useRef<Array<{ t: number; v: number }>>([])
  const rafRef = useRef<number | null>(null)
  const savedRef = useRef(false)
  const history = metric.windows[windowKey]

  const max = Math.max(...history)
  const min = Math.min(...history)
  const range = max - min || 1
  const average = avg(history)
  const trendDelta = history[history.length - 1] - history[0]
  const trendText = trendDelta > 0 ? `+${trendDelta.toFixed(1)}` : trendDelta.toFixed(1)

  useEffect(() => {
    if (measureStage !== "prepare") return
    const timer = window.setTimeout(() => setMeasureStage("measuring"), 700)
    return () => window.clearTimeout(timer)
  }, [measureStage])

  useEffect(() => {
    if (measureStage === "idle" || measureStage === "done") {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          if (track.kind === "video") {
            try {
              track.applyConstraints({ advanced: [{ torch: false }] })
            } catch {
              // ignore torch cleanup
            }
          }
          track.stop()
        })
        streamRef.current = null
      }
      return
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera access not supported.")
      return
    }
    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30 } },
          audio: false,
        })
        streamRef.current = stream
        const track = stream.getVideoTracks()[0]
        if (track) {
          const caps = track.getCapabilities?.() as { torch?: boolean } | undefined
          if (caps?.torch) {
            try {
              await track.applyConstraints({ advanced: [{ torch: true }] })
            } catch {
              // ignore torch failures
            }
          }
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
      } catch (error) {
        setCameraError(error instanceof Error ? error.message : "Camera permission denied.")
      }
    }
    void start()
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
    }
  }, [measureStage])

  useEffect(() => {
    if (measureStage !== "measuring") return
    const durationMs = 25000
    measureStartRef.current = performance.now()
    samplesRef.current = []
    savedRef.current = false

    const tick = () => {
      const now = performance.now()
      const start = measureStartRef.current ?? now
      const elapsed = now - start
      const progress = Math.min(100, Math.round((elapsed / durationMs) * 100))
      setMeasureProgress(progress)

      const video = videoRef.current
      const canvas = canvasRef.current
      if (video && canvas && video.readyState >= 2) {
        const size = 64
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext("2d", { willReadFrequently: true })
        if (ctx) {
          ctx.drawImage(video, 0, 0, size, size)
          const image = ctx.getImageData(22, 22, 20, 20).data
          let gSum = 0
          const count = image.length / 4
          for (let i = 0; i < image.length; i += 4) {
            gSum += image[i + 1]
          }
          const avgG = gSum / count
          samplesRef.current.push({ t: now, v: avgG })
          const windowMs = 10000
          samplesRef.current = samplesRef.current.filter((s) => now - s.t <= windowMs)

          const values = samplesRef.current.map((s) => s.v)
          const mean = values.reduce((sum, v) => sum + v, 0) / (values.length || 1)
          const detrended = values.map((v) => v - mean)
          const variance = detrended.reduce((sum, v) => sum + Math.pow(v, 2), 0) / (detrended.length || 1)
          const std = Math.sqrt(variance)
          const quality = Math.min(1, std / 5)
          setSignalQuality(quality)
          setLowSignal(quality < 0.2)
          const threshold = std * 0.4

          const peaks: number[] = []
          const minInterval = 380
          let lastPeak = 0
          for (let i = 1; i < samplesRef.current.length - 1; i += 1) {
            const prev = detrended[i - 1]
            const curr = detrended[i]
            const next = detrended[i + 1]
            if (curr > threshold && curr > prev && curr >= next) {
              const t = samplesRef.current[i].t
              if (!lastPeak || t - lastPeak > minInterval) {
                peaks.push(t)
                lastPeak = t
              }
            }
          }
          if (peaks.length >= 2) {
            const diffs = peaks.slice(1).map((t, idx) => t - peaks[idx])
            const avgDiff = diffs.reduce((sum, v) => sum + v, 0) / diffs.length
            const bpm = Math.round(60000 / avgDiff)
            if (bpm >= 45 && bpm <= 140) {
              setMeasureBpm(bpm)
            }
          }
        }
      }

      if (progress >= 100) {
        setMeasureProgress(100)
        setMeasureStage("done")
        return
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [measureStage])

  const startMeasurement = () => {
    setMeasureProgress(0)
    setMeasureBpm(72)
    setCameraError("")
    setLowSignal(false)
    setSignalQuality(0)
    setMeasureStage("prepare")
  }

  useEffect(() => {
    if (measureStage !== "done" || savedRef.current) return
    savedRef.current = true
    void saveVitalReading({
      metric: "heart_rate",
      value: measureBpm,
      unit: "bpm",
      source: "camera",
      signalQuality: Number(signalQuality.toFixed(2)),
    })
  }, [measureStage, measureBpm, signalQuality])

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

        {metricId === "heart-rate" && (
          <article className="metric-measure-card app-fade-stagger">
            <div>
              <h3>Check your heart rate</h3>
              <p>Use your camera to get a quick live reading.</p>
            </div>
            <button className="measure-btn app-pressable" type="button" onClick={startMeasurement}>
              Start Checking Heart Rate
            </button>
          </article>
        )}

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

      {metricId === "heart-rate" && measureStage !== "idle" && (
        <div className="hr-measure-overlay">
          <section className="hr-measure-card">
            <header className="hr-measure-head">
              <h2>Measure</h2>
              <p>{measureStage === "prepare" ? "Press your finger on camera" : "Measuring your heart rate..."}</p>
            </header>

            <div className="hr-camera-shell">
              {cameraError ? (
                <div className="hr-camera-error">{cameraError}</div>
              ) : (
                <video ref={videoRef} className="hr-camera" muted playsInline />
              )}
            </div>
            <canvas ref={canvasRef} className="hr-camera-canvas" />

            <div
              className="hr-measure-ring"
              style={{ ["--progress" as string]: `${measureProgress}%` }}
            >
              <div className="hr-measure-inner">
                <span className="hr-heart"><FiHeart /></span>
                <strong>{measureStage === "prepare" ? "--" : measureBpm}</strong>
                <small>bpm</small>
              </div>
            </div>

            <div className="hr-measure-foot">
              <span className="hr-progress-text">
                {measureStage === "done" ? "Completed" : `Measuring... (${measureProgress}%)`}
              </span>
              {lowSignal && measureStage !== "done" && (
                <span className="hr-signal-warning">Low signal. Cover camera and light fully.</span>
              )}
              <div className="hr-wave" aria-hidden="true" />
            </div>

            <button
              className="measure-close app-pressable"
              type="button"
              onClick={() => setMeasureStage("idle")}
            >
              {measureStage === "done" ? "Done" : "Cancel"}
            </button>
          </section>
        </div>
      )}
    </main>
  )
}
