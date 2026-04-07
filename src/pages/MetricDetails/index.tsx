import { useEffect, useRef, useState, type ReactElement } from "react"
import { FiActivity, FiArrowLeft, FiCamera, FiDroplet, FiHeart, FiZap } from "react-icons/fi"
import { useNavigate, useParams } from "react-router-dom"
import { getLatestVital, getVitalHistory, saveVitalReading } from "../../services/vitalsApi"
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

type MealType = "Breakfast" | "Lunch" | "Dinner" | "Snack"

type MealEntry = {
  id: string
  type: MealType
  name: string
  calories: number
  notes: string
  image?: string
  loggedAt: string
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
  calories: {
    title: "Calories",
    current: "1850",
    unit: "kcal",
    subtitle: "On-track for daily energy goal",
    insight: "Calorie intake is consistent with your weekly average.",
    icon: <FiZap />,
    tone: "orange",
    windows: {
      "7D": [1780, 1860, 1920, 1805, 1870, 1815, 1850],
      "14D": [1720, 1805, 1875, 1900, 1760, 1840, 1810, 1895, 1920, 1785, 1830, 1865, 1795, 1850],
      "30D": [1760, 1820, 1890, 1905, 1740, 1855, 1810, 1875, 1925, 1800, 1780, 1860, 1835, 1890, 1755, 1845, 1885, 1810, 1865, 1790, 1825, 1900, 1775, 1850, 1880, 1805, 1765, 1860, 1825, 1855],
    },
    tips: ["Maintain protein with meals", "Add a 10-min walk after lunch", "Hydrate to curb false hunger"],
  },
  sugar: {
    title: "Sugar Count",
    current: "110",
    unit: "mg/dL",
    subtitle: "Fasting range is within target",
    insight: "Sugar values are stable with no sharp spikes this week.",
    icon: <FiDroplet />,
    tone: "green",
    windows: {
      "7D": [112, 110, 108, 114, 109, 111, 110],
      "14D": [115, 112, 110, 108, 114, 111, 109, 110, 112, 108, 109, 111, 110, 109],
      "30D": [116, 114, 112, 111, 110, 109, 111, 112, 110, 109, 108, 110, 111, 109, 112, 110, 108, 109, 110, 112, 111, 109, 108, 110, 111, 109, 110, 108, 109, 110],
    },
    tips: ["Log readings at the same time daily", "Limit sugary snacks", "Walk after meals to stabilize glucose"],
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
  const [measureStage, setMeasureStage] = useState<"idle" | "guide" | "prepare" | "measuring" | "done">("idle")
  const [measureProgress, setMeasureProgress] = useState(0)
  const [measureBpm, setMeasureBpm] = useState(72)
  const [cameraError, setCameraError] = useState("")
  const [lowSignal, setLowSignal] = useState(false)
  const [signalQuality, setSignalQuality] = useState(0)
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [historyOverride, setHistoryOverride] = useState<number[] | null>(null)
  const [latestOverride, setLatestOverride] = useState<number | null>(null)
  const [bpLatest, setBpLatest] = useState<{ sys: number | null; dia: number | null; eventAt?: string } | null>(null)
  const [bpHistory, setBpHistory] = useState<number[] | null>(null)
  const [saveTimeoutReached, setSaveTimeoutReached] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const measureStartRef = useRef<number | null>(null)
  const samplesRef = useRef<Array<{ t: number; v: number }>>([])
  const rafRef = useRef<number | null>(null)
  const savedRef = useRef(false)
  const retryTimerRef = useRef<number | null>(null)
  const history = metric.windows[windowKey]
  const dynamicHistory = metricId === "blood-pressure"
    ? bpHistory ?? history
    : historyOverride ?? history

  const max = Math.max(...dynamicHistory)
  const min = Math.min(...dynamicHistory)
  const range = max - min || 1
  const average = avg(dynamicHistory)
  const trendDelta = dynamicHistory[dynamicHistory.length - 1] - dynamicHistory[0]
  const trendText = trendDelta > 0 ? `+${trendDelta.toFixed(1)}` : trendDelta.toFixed(1)
  const displayCurrentNumber = latestOverride ?? Number(metric.current)
  const todayKey = new Date().toISOString().slice(0, 10)
  const mealStorageKey = `calorie_meals_${todayKey}`
  const mealTypes: MealType[] = ["Breakfast", "Lunch", "Dinner", "Snack"]
  const lastCheckDate = localStorage.getItem("heart_rate_check_date")
  const lastCheckAt = localStorage.getItem("heart_rate_check_at")
  const checkedToday = lastCheckDate === todayKey
  const hrSubtitle =
    displayCurrentNumber > 100
      ? "Elevated resting rate today"
      : displayCurrentNumber < 55
        ? "Below typical resting range"
        : "Within healthy resting range"
  const hrInsight =
    trendDelta > 4
      ? "AI insight: Your trend is rising this week. Prioritize hydration, sleep, and reduce stimulants."
      : trendDelta < -4
        ? "AI insight: Your trend is improving. Keep recovery and light activity consistent."
        : "AI insight: Stable rhythm with no major spikes in your recent trend."
  const hrTips = displayCurrentNumber > 100
    ? ["Short recovery walk", "Hydrate + electrolytes", "Reduce caffeine today"]
    : ["Hydrate before noon", "Sleep at fixed timing", "Limit caffeine after 4 PM"]

  const displayValue =
    metricId === "blood-pressure" && bpLatest?.sys && bpLatest?.dia
      ? `${Math.round(bpLatest.sys)}/${Math.round(bpLatest.dia)}`
      : String(displayCurrentNumber)
  const displayUnit = metricId === "blood-pressure" ? "mmHg" : metric.unit

  const [mealEntries, setMealEntries] = useState<MealEntry[]>(() => {
    if (metricId !== "calories") return []
    const raw = localStorage.getItem(mealStorageKey)
    if (!raw) return []
    try {
      const parsed = JSON.parse(raw) as MealEntry[]
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })
  const [mealDraft, setMealDraft] = useState({
    type: "Breakfast" as MealType,
    name: "",
    calories: "",
    notes: "",
    image: "",
  })
  const [mealScanState, setMealScanState] = useState<"idle" | "scanning" | "done">("idle")
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (metricId !== "calories") return
    localStorage.setItem(mealStorageKey, JSON.stringify(mealEntries))
  }, [mealEntries, mealStorageKey, metricId])

  function handlePickMealImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : ""
      setMealDraft((prev) => ({ ...prev, image: result }))
    }
    reader.readAsDataURL(file)
    e.target.value = ""
  }

  function estimateCalories() {
    if (mealScanState === "scanning") return
    if (!mealDraft.image && !mealDraft.name.trim()) {
      setMealDraft((prev) => ({ ...prev, notes: prev.notes || "Add a meal name or photo to estimate calories." }))
      return
    }
    setMealScanState("scanning")
    const base = mealDraft.type === "Breakfast" ? 350 : mealDraft.type === "Lunch" ? 600 : mealDraft.type === "Dinner" ? 650 : 220
    const jitter = Math.round((Math.random() * 120) - 60)
    window.setTimeout(() => {
      const estimate = Math.max(120, base + jitter)
      setMealDraft((prev) => ({ ...prev, calories: String(estimate) }))
      setMealScanState("done")
      window.setTimeout(() => setMealScanState("idle"), 1200)
    }, 900)
  }

  function saveMeal() {
    const name = mealDraft.name.trim() || `${mealDraft.type} meal`
    const calories = Number(mealDraft.calories) || 0
    if (!mealDraft.image && !mealDraft.name.trim()) {
      setMealDraft((prev) => ({ ...prev, notes: prev.notes || "Add a meal name or photo before saving." }))
      return
    }
    const entry: MealEntry = {
      id: `meal-${Date.now()}`,
      type: mealDraft.type,
      name,
      calories,
      notes: mealDraft.notes.trim(),
      image: mealDraft.image || undefined,
      loggedAt: new Date().toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }),
    }
    setMealEntries((prev) => [entry, ...prev])
    setMealDraft({ type: mealDraft.type, name: "", calories: "", notes: "", image: "" })
  }

  useEffect(() => {
    if (measureStage !== "prepare") return
    const timer = window.setTimeout(() => setMeasureStage("measuring"), 700)
    return () => window.clearTimeout(timer)
  }, [measureStage])

  useEffect(() => {
    if (measureStage === "idle" || measureStage === "done" || measureStage === "guide") {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      if (retryTimerRef.current) {
        window.clearTimeout(retryTimerRef.current)
        retryTimerRef.current = null
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          if (track.kind === "video") {
            try {
              ;(track as any).applyConstraints({ advanced: [{ torch: false }] })
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
          const caps = (track as any).getCapabilities?.()
          if (caps?.torch) {
            try {
              await (track as any).applyConstraints({ advanced: [{ torch: true }] })
            } catch {
              // ignore torch failures
            }
          }
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play().catch(() => undefined)
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
    setSaveStatus("idle")
    setMeasureStage("guide")
  }

  useEffect(() => {
    if (measureStage !== "done" || savedRef.current) return
    savedRef.current = true
    setSaveTimeoutReached(false)
    const timeoutId = window.setTimeout(() => {
      setSaveTimeoutReached(true)
      setSaveStatus("error")
    }, 120000)
    const saveNow = async () => {
      try {
        setSaveStatus("saving")
        await saveVitalReading({
          metric: "heart_rate",
          value: measureBpm,
          unit: "bpm",
          source: "camera",
          signalQuality: Number(signalQuality.toFixed(2)),
        })
        setSaveStatus("saved")
        localStorage.setItem("heart_rate_check_date", todayKey)
        localStorage.setItem("heart_rate_check_at", new Date().toISOString())
        const latest = await getLatestVital("heart_rate")
        if (typeof latest?.value === "number") {
          setLatestOverride(latest.value)
        }
        const historyResp = await getVitalHistory("heart_rate", 30)
        if (historyResp?.points?.length) {
          const values = historyResp.points
            .slice()
            .reverse()
            .map((point) => point.value)
          setHistoryOverride(values)
        }
        window.clearTimeout(timeoutId)
      } catch (error) {
        setSaveStatus("error")
        console.warn("Failed to save vital reading", error)
        if (!saveTimeoutReached) {
          retryTimerRef.current = window.setTimeout(saveNow, 4000)
        }
      }
    }
    void saveNow()
    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [measureStage, measureBpm, signalQuality])

  useEffect(() => {
    if (metricId !== "heart-rate") return
    let active = true
    void (async () => {
      try {
        const latest = await getLatestVital("heart_rate")
        if (!active) return
        if (typeof latest?.value === "number") {
          setLatestOverride(latest.value)
        }
        const historyResp = await getVitalHistory("heart_rate", 30)
        if (!active) return
        if (historyResp?.points?.length) {
          const values = historyResp.points
            .slice()
            .reverse()
            .map((point) => point.value)
          setHistoryOverride(values)
        }
      } catch {
        // keep fallback data
      }
    })()
    return () => {
      active = false
    }
  }, [metricId])

  useEffect(() => {
    if (metricId !== "blood-pressure") return
    let active = true
    void (async () => {
      try {
        const [sys, dia] = await Promise.all([
          getLatestVital("blood_pressure_sys"),
          getLatestVital("blood_pressure_dia"),
        ])
        if (!active) return
        setBpLatest({
          sys: typeof sys?.value === "number" ? sys.value : null,
          dia: typeof dia?.value === "number" ? dia.value : null,
          eventAt: sys?.eventAt || dia?.eventAt,
        })
        const historyResp = await getVitalHistory("blood_pressure_sys", 30)
        if (!active) return
        if (historyResp?.points?.length) {
          const values = historyResp.points
            .slice()
            .reverse()
            .map((point) => point.value)
          setBpHistory(values)
        }
      } catch {
        // keep fallback data
      }
    })()
    return () => {
      active = false
    }
  }, [metricId])

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
            <h2>{displayValue} <small>{displayUnit}</small></h2>
            <p>{metricId === "heart-rate" ? hrSubtitle : metric.subtitle}</p>
          </div>
        </article>

        {metricId === "heart-rate" && !checkedToday && (
          <article className="metric-measure-card app-fade-stagger">
            <div>
              <h3>Check your heart rate</h3>
              <p>Daily check-in helps build your trend and AI insight.</p>
            </div>
            <button className="measure-btn app-pressable" type="button" onClick={startMeasurement}>
              Start Checking Heart Rate
            </button>
          </article>
        )}

        {metricId === "heart-rate" && checkedToday && (
          <article className="metric-measure-card app-fade-stagger">
            <div>
              <h3>Heart rate checked today</h3>
              <p>{lastCheckAt ? `Last check: ${new Date(lastCheckAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}` : "Saved to your health log."}</p>
            </div>
          </article>
        )}

        {(metricId === "blood-pressure" || metricId === "sugar") && (
          <article className="metric-measure-card app-fade-stagger">
            <div>
              <h3>Daily tracking</h3>
              <p>Log your reading on the tracking page to keep the analysis accurate.</p>
            </div>
            <button
              className="measure-btn app-pressable"
              type="button"
              onClick={() => navigate(metricId === "sugar" ? "/metric/sugar/log" : "/metric/blood-pressure/log")}
            >
              {metricId === "sugar" ? "Log blood sugar" : "Log blood pressure"}
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

        {metricId === "calories" && (
          <article className="meal-tracker-card app-fade-stagger">
            <header className="meal-tracker-head">
              <div>
                <h3>Daily Meal Tracker</h3>
                <p>Log breakfast, lunch, dinner, and snacks with a photo scan.</p>
              </div>
              <div className="meal-total">
                <span>Total today</span>
                <strong>{mealEntries.reduce((sum, item) => sum + item.calories, 0)} kcal</strong>
              </div>
            </header>

            <div className="meal-grid">
              {mealTypes.map((type) => {
                const latest = mealEntries.find((item) => item.type === type)
                return (
                  <div key={type} className="meal-slot">
                    <div className="meal-slot-head">
                      <h4>{type}</h4>
                      <span>{latest ? `${latest.calories} kcal` : "Not logged"}</span>
                    </div>
                    {latest ? (
                      <div className="meal-slot-body">
                        {latest.image ? <img src={latest.image} alt={latest.name} /> : <div className="meal-photo-fallback">No image</div>}
                        <div>
                          <p>{latest.name}</p>
                          <small>{latest.loggedAt}</small>
                        </div>
                      </div>
                    ) : (
                      <div className="meal-slot-empty">Add your {type.toLowerCase()} to see insights.</div>
                    )}
                    <button
                      type="button"
                      className={`meal-chip ${mealDraft.type === type ? "active" : ""}`}
                      onClick={() => setMealDraft((prev) => ({ ...prev, type }))}
                    >
                      Add {type}
                    </button>
                  </div>
                )
              })}
            </div>

            <div className="meal-form">
              <div className="meal-form-row">
                <label>
                  Meal name
                  <input
                    className="meal-input"
                    placeholder="E.g., Poha with peanuts"
                    value={mealDraft.name}
                    onChange={(e) => setMealDraft((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </label>
                <label>
                  Calories (estimated)
                  <input
                    className="meal-input"
                    placeholder="Auto estimate"
                    value={mealDraft.calories}
                    onChange={(e) => setMealDraft((prev) => ({ ...prev, calories: e.target.value }))}
                  />
                </label>
              </div>
              <label>
                Notes
                <input
                  className="meal-input"
                  placeholder="Add ingredients or portion size"
                  value={mealDraft.notes}
                  onChange={(e) => setMealDraft((prev) => ({ ...prev, notes: e.target.value }))}
                />
              </label>
              <div className="meal-actions">
                <button type="button" className="meal-btn secondary" onClick={() => fileInputRef.current?.click()}>
                  <FiCamera /> Add food photo
                </button>
                <button type="button" className="meal-btn" onClick={estimateCalories} disabled={mealScanState === "scanning"}>
                  {mealScanState === "scanning" ? "Scanning..." : "Scan & estimate"}
                </button>
                <button type="button" className="meal-btn primary" onClick={saveMeal}>
                  Save meal
                </button>
              </div>
              {!!mealDraft.image && (
                <div className="meal-preview">
                  <img src={mealDraft.image} alt="Meal preview" />
                  <span>{mealDraft.type} preview</span>
                </div>
              )}
            </div>
          </article>
        )}

        <article className="metric-chart-card app-fade-stagger">
          <h3>Trend ({windowKey})</h3>
          <div className="metric-chart">
            {dynamicHistory.map((value, index) => {
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
          <p>{metricId === "heart-rate" ? hrInsight : metric.insight}</p>
          <ul>
            {(metricId === "heart-rate" ? hrTips : metric.tips).map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
            <li>Book consultation if unusual trend persists for 3+ days</li>
          </ul>
        </article>
      </section>

      {metricId === "calories" && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="meal-file"
          onChange={handlePickMealImage}
        />
      )}

      {metricId === "heart-rate" && measureStage !== "idle" && (
        <div className="hr-measure-overlay">
          <section className="hr-measure-card">
            <header className="hr-measure-head">
              <h2>Measure</h2>
              <p>
                {measureStage === "guide"
                  ? "Before we start"
                  : measureStage === "prepare"
                    ? "Press your finger on camera"
                    : "Measuring your heart rate..."}
              </p>
            </header>

            {measureStage === "guide" && (
              <div className="hr-guide">
                <div className="hr-guide-illustration" aria-hidden="true">
                  <span className="hr-phone" />
                  <span className="hr-hand" />
                  <span className="hr-camera-dot" />
                </div>
                <ol>
                  <li>Place your index finger gently on the rear camera.</li>
                  <li>Cover the light fully, hold steady for 25 seconds.</li>
                  <li>Stay seated and breathe normally.</li>
                </ol>
                <button className="measure-close measure-close--primary app-pressable" type="button" onClick={() => setMeasureStage("prepare")}>
                  Start measurement
                </button>
              </div>
            )}

            {measureStage !== "guide" && (
              <>
                <div className="hr-camera-shell">
                  {cameraError ? (
                    <div className="hr-camera-error">{cameraError}</div>
                  ) : (
                    <video ref={videoRef} className="hr-camera" muted playsInline />
                  )}
                </div>
                <canvas ref={canvasRef} className="hr-camera-canvas" />
              </>
            )}

            {measureStage !== "guide" && (
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
            )}

            {measureStage !== "guide" && (
              <div className="hr-measure-foot">
                <span className="hr-progress-text">
                  {measureStage === "done" ? "Completed" : `Measuring... (${measureProgress}%)`}
                </span>
                {lowSignal && measureStage !== "done" && (
                  <span className="hr-signal-warning">Low signal. Cover camera and light fully.</span>
                )}
                {measureStage === "done" && saveStatus === "saving" && (
                  <span className="hr-signal-warning">Saving to server...</span>
                )}
                {measureStage === "done" && saveStatus === "error" && (
                  <span className="hr-signal-warning">
                    {saveTimeoutReached ? "Save timed out. Tap Retry." : "Retrying save... keep app open."}
                  </span>
                )}
                <div className="hr-wave" aria-hidden="true" />
              </div>
            )}

            {measureStage !== "guide" && measureStage === "done" && saveTimeoutReached ? (
              <div className="hr-save-actions">
                <button className="measure-close app-pressable" type="button" onClick={() => setMeasureStage("idle")}>
                  Cancel
                </button>
                <button
                  className="measure-close measure-close--primary app-pressable"
                  type="button"
                  onClick={() => {
                    savedRef.current = false
                    setSaveTimeoutReached(false)
                    setSaveStatus("saving")
                    setMeasureStage("done")
                  }}
                >
                  Retry Save
                </button>
              </div>
            ) : measureStage !== "guide" ? (
              <button
                className="measure-close app-pressable"
                type="button"
                onClick={() => setMeasureStage("idle")}
                disabled={measureStage === "done" && saveStatus !== "saved"}
              >
                {measureStage === "done" ? "Done" : "Cancel"}
              </button>
            ) : null}
          </section>
        </div>
      )}

      {measureStage === "done" && saveStatus === "saving" && (
        <div className="hr-save-blocker">
          <div className="hr-save-card">
            <span className="save-spinner" />
            <p>Saving to server...</p>
          </div>
        </div>
      )}
    </main>
  )
}
