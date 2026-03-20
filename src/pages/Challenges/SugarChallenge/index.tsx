import { useEffect, useMemo, useRef, useState } from "react"
import { FiArrowLeft, FiCamera, FiCheckCircle, FiChevronRight, FiDroplet, FiImage, FiInfo, FiMessageCircle } from "react-icons/fi"
import { useNavigate } from "react-router-dom"
import { getEmployeeAuthSession } from "../../../services/authApi"
import { logBehaviorSignal } from "../../../services/behaviorApi"
import { getSugarChallengeState, getSugarCoachReply, saveSugarChallengeState } from "../../../services/sugarChallengeApi"
import "./sugar-challenge.css"

type ChallengeStep = "start" | "camera" | "analysis" | "dashboard" | "coach"

type MealBreakdown = {
  name: string
  grams: number
  flag?: "bad" | "warn"
}

type MealEntry = {
  id: string
  title: string
  sugar: number
  items: MealBreakdown[]
  createdAt: string
}

type SugarChallengeState = {
  started: boolean
  day: number
  limit: number
  sugarTotal: number
  meals: MealEntry[]
  completedDays: number
  coins: number
  completed: boolean
  lastDayKey: string
}

const STORAGE_KEY = "challenge_sugar_state"
const ACTIVE_KEY = "active_challenge_id"

const defaultBreakdown: MealBreakdown[] = [
  { name: "Roti", grams: 1 },
  { name: "Sabzi", grams: 3 },
  { name: "Chai", grams: 10, flag: "bad" },
  { name: "Ketchup", grams: 5, flag: "warn" },
]

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function loadState(): SugarChallengeState {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return {
      started: false,
      day: 1,
      limit: 25,
      sugarTotal: 0,
      meals: [],
      completedDays: 0,
      coins: 0,
      completed: false,
      lastDayKey: todayKey(),
    }
  }
  try {
    return JSON.parse(raw) as SugarChallengeState
  } catch {
    return {
      started: false,
      day: 1,
      limit: 25,
      sugarTotal: 0,
      meals: [],
      completedDays: 0,
      coins: 0,
      completed: false,
      lastDayKey: todayKey(),
    }
  }
}

function saveState(state: SugarChallengeState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export default function SugarChallenge() {
  const navigate = useNavigate()
  const session = getEmployeeAuthSession()
  const [step, setStep] = useState<ChallengeStep>("dashboard")
  const [state, setState] = useState<SugarChallengeState>(() => loadState())
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [breakdown, setBreakdown] = useState<MealBreakdown[]>(defaultBreakdown)
  const [coachReply, setCoachReply] = useState("You reduced sugar by 30% in 3 days 👏")
  const [coachLoading, setCoachLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const saveTimerRef = useRef<number | null>(null)

  useEffect(() => {
    const next = loadState()
    const key = todayKey()
    if (next.lastDayKey !== key) {
      const newDay = Math.min(7, next.day + 1)
      const updated: SugarChallengeState = {
        ...next,
        day: newDay,
        sugarTotal: 0,
        meals: [],
        lastDayKey: key,
      }
      setState(updated)
      saveState(updated)
    }
  }, [])

  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const res = await getSugarChallengeState()
        if (!active || !res.state) return
        const stored = res.state as SugarChallengeState
        setState(stored)
        saveState(stored)
      } catch {
        // keep local state
      }
    })()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current)
    saveTimerRef.current = window.setTimeout(() => {
      void saveSugarChallengeState(state)
    }, 900)
    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current)
    }
  }, [state])

  useEffect(() => {
    if (!state.started) {
      setStep("start")
    } else if (state.completed) {
      setStep("dashboard")
    } else {
      setStep((prev) => (prev === "analysis" || prev === "camera" || prev === "coach") ? prev : "dashboard")
    }
  }, [state.started, state.completed])

  useEffect(() => {
    if (step !== "coach") return
    setCoachLoading(true)
    void getSugarCoachReply({
      day: state.day,
      sugarTotal: state.sugarTotal,
      limit: state.limit,
      meals: state.meals,
    })
      .then((res) => setCoachReply(res.reply))
      .catch(() => setCoachReply("Try swapping sugary drinks with lemon water or herbal tea today."))
      .finally(() => setCoachLoading(false))
  }, [step])

  const totalSugar = useMemo(() => breakdown.reduce((sum, item) => sum + item.grams, 0), [breakdown])
  const progress = Math.min(100, Math.round((state.sugarTotal / state.limit) * 100))
  const biggestSource = useMemo(() => {
    if (!state.meals.length) return "Tea"
    const all = state.meals.flatMap((meal) => meal.items)
    const top = all.sort((a, b) => b.grams - a.grams)[0]
    return top?.name ?? "Tea"
  }, [state.meals])

  const handleStart = () => {
    const updated = { ...state, started: true }
    setState(updated)
    saveState(updated)
    localStorage.setItem(ACTIVE_KEY, "sugar-7-day")
    setStep("camera")
  }

  const handleSelectImage = (file?: File) => {
    if (!file) return
    const url = URL.createObjectURL(file)
    setSelectedImage(url)
    setAnalyzing(true)
    window.setTimeout(() => {
      setAnalyzing(false)
      setBreakdown(defaultBreakdown)
      setStep("analysis")
    }, 1200)
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleLogMeal = () => {
    const meal: MealEntry = {
      id: `${Date.now()}`,
      title: `Meal ${state.meals.length + 1}`,
      sugar: totalSugar,
      items: breakdown,
      createdAt: new Date().toISOString(),
    }
    const updated: SugarChallengeState = {
      ...state,
      sugarTotal: state.sugarTotal + totalSugar,
      meals: [meal, ...state.meals],
    }
    setState(updated)
    saveState(updated)
    void logBehaviorSignal({
      type: "challenge_meal_logged",
      label: "Sugar Challenge",
      meta: { totalSugar: totalSugar, day: updated.day },
      userId: session?.userId ?? undefined,
    })
    setStep("dashboard")
  }

  const completeDay = () => {
    if (state.completed) return
    const nextCompleted = Math.min(7, state.completedDays + 1)
    const completed = nextCompleted >= 7
    const updated = {
      ...state,
      completedDays: nextCompleted,
      completed,
      coins: completed ? state.coins + 100 : state.coins,
    }
    setState(updated)
    saveState(updated)
    if (completed) {
      localStorage.removeItem(ACTIVE_KEY)
    }
  }

  return (
    <main className="sugar-page app-page-enter">
      <header className="sugar-header">
        <button className="sugar-back app-pressable" type="button" onClick={() => navigate(-1)} aria-label="Back">
          <FiArrowLeft />
        </button>
        <div>
          <h1>No Sugar Challenge</h1>
          <p>7-Day sugar reset</p>
        </div>
      </header>

      {step === "start" && (
        <section className="sugar-shell">
          <article className="sugar-hero card-rise">
            <h2>Day 1 – Let’s begin</h2>
            <p className="sugar-sub">Upload every meal & stay under 25g sugar</p>
            <div className="sugar-rules">
              <div><FiInfo /> Upload every meal</div>
              <div><FiDroplet /> Stay under 25g sugar</div>
            </div>
            <button className="sugar-cta app-pressable" type="button" onClick={handleStart}>
              Upload your first meal
            </button>
          </article>
        </section>
      )}

      {step === "camera" && (
        <section className="sugar-shell">
          <article className="sugar-camera card-rise">
            <div className="camera-box">
              {selectedImage ? <img src={selectedImage} alt="meal" /> : <span>Camera view</span>}
            </div>
            <div className="camera-actions">
              <button className="camera-btn app-pressable" type="button" onClick={handleUploadClick}>
                <FiImage /> Upload from gallery
              </button>
              <button className="camera-btn primary app-pressable" type="button" onClick={handleUploadClick}>
                <FiCamera /> Capture
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                hidden
                onChange={(e) => handleSelectImage(e.target.files?.[0])}
              />
            </div>
            {analyzing && <div className="analyzing">Analyzing…</div>}
          </article>
        </section>
      )}

      {step === "analysis" && (
        <section className="sugar-shell">
          <article className="sugar-analysis card-rise">
            {selectedImage && <img src={selectedImage} alt="meal preview" className="analysis-image" />}
            <div className="analysis-list">
              {breakdown.map((item) => (
                <div key={item.name} className={`analysis-row ${item.flag ?? ""}`}>
                  <span>{item.name}</span>
                  <strong>{item.grams}g</strong>
                </div>
              ))}
            </div>
            <div className="analysis-total">
              <span>Total sugar</span>
              <strong>{totalSugar}g</strong>
            </div>
            <div className="analysis-insights">
              <p>Your chai is the biggest sugar source.</p>
              <p>You’re already at {Math.round((totalSugar / state.limit) * 100)}% of daily limit.</p>
            </div>
            <div className="analysis-actions">
              <button className="camera-btn app-pressable" type="button" onClick={() => setStep("coach")}>
                Get Suggestion
              </button>
              <button className="camera-btn primary app-pressable" type="button" onClick={handleLogMeal}>
                Log Meal
              </button>
            </div>
          </article>
        </section>
      )}

      {step === "dashboard" && (
        <section className="sugar-shell">
          <article className="sugar-dashboard card-rise">
            <div className="dash-top">
              <h2>Day {state.day} 🔥</h2>
              <span>{state.completedDays}/7 days done</span>
            </div>
            <div className="dash-progress">
              <p>Today’s sugar</p>
              <strong>{state.sugarTotal}g / {state.limit}g</strong>
              <div className="progress-bar">
                <span style={{ width: `${progress}%` }} />
              </div>
            </div>
            <div className="dash-meals">
              <h4>Meals</h4>
              {state.meals.length === 0 && <p>No meals logged yet.</p>}
              {state.meals.map((meal) => (
                <div key={meal.id} className="meal-row">
                  <span>{meal.title}</span>
                  <strong>{meal.sugar}g</strong>
                </div>
              ))}
            </div>
            <div className="dash-footer">
              <button className="camera-btn primary app-pressable" type="button" onClick={() => setStep("camera")}>
                + Add Meal
              </button>
              <button className="camera-btn app-pressable" type="button" onClick={() => setStep("coach")}>
                AI Coach
              </button>
            </div>
            <div className="dash-tip">
              Biggest sugar source today: <strong>{biggestSource}</strong>
            </div>
            {!state.completed && (
              <button className="challenge-complete-btn app-pressable" type="button" onClick={completeDay}>
                Mark today complete
              </button>
            )}
            {state.completed && (
              <div className="challenge-complete">
                <FiCheckCircle /> Challenge completed • +100 coins
              </div>
            )}
          </article>
        </section>
      )}

      {step === "coach" && (
        <section className="sugar-shell">
          <article className="sugar-coach card-rise">
            <div className="coach-head">
              <FiMessageCircle />
              <div>
                <h3>AI Coach</h3>
                <p>{coachReply}</p>
              </div>
            </div>
            <div className="coach-chat">
              <div className="bubble bot">Try replacing evening chai with lemon water.</div>
              <div className="bubble bot">Need help with healthier snacks?</div>
            </div>
            <button
              className="camera-btn app-pressable"
              type="button"
              onClick={async () => {
                setCoachLoading(true)
                try {
                  const res = await getSugarCoachReply({
                    day: state.day,
                    sugarTotal: state.sugarTotal,
                    limit: state.limit,
                    meals: state.meals,
                  })
                  setCoachReply(res.reply)
                } catch {
                  setCoachReply("Try swapping sugary drinks with lemon water or herbal tea today.")
                } finally {
                  setCoachLoading(false)
                }
              }}
            >
              {coachLoading ? "Thinking..." : "Ask Coach"}
            </button>
            <button className="camera-btn primary app-pressable" type="button" onClick={() => setStep("dashboard")}>
              Back to Dashboard
            </button>
          </article>
        </section>
      )}
    </main>
  )
}
