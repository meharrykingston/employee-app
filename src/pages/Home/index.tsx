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
  FiZap,
} from "react-icons/fi"
import { useLocation, useNavigate } from "react-router-dom"
import { getEmployeeAuthSession, getEmployeeCompanySession } from "../../services/authApi"
import { logBehaviorSignal } from "../../services/behaviorApi"
import { preloadLabCatalog } from "../../services/labApi"
import { getLatestVital } from "../../services/vitalsApi"
import { fetchDailyTips, type DailyTipPayload } from "../../services/newsApi"
import { fetchWeather, type WeatherSnapshot } from "../../services/weatherApi"
import { healthTips, type HealthTip } from "../../data/healthTips"
import warningAlarm from "../../assets/audio/warning.mp3"
import "./home.css"


type QuickAccessItem = {
  title: string
  subtitle?: string
  tone: "purple" | "blue" | "indigo" | "orange" | "green" | "gold"
  badge?: string
  icon: "stress" | "lab" | "consult" | "weekend" | "pharmacy" | "badges"
}

type MetricId = "heart-rate" | "blood-pressure" | "calories" | "weight"

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

const TIP_PREF_KEY = "home:tip-preference"
const TIP_FAST_SCROLL_KEY = "home:tip-fast-scroll"
const DAILY_TIP_STORAGE_KEY = "daily_tip_map"
const DAILY_TIP_DATE_KEY = "daily_tip_date"
const AI_THREAD_KEY = "employee_ai_thread_id"
const AI_MESSAGE_PREFIX = "employee_ai_thread_messages:"

const metrics: Array<{ id: MetricId; title: string; value: string; unit: string; status: string; age: string; tone: string; icon: ReactElement }> = [
  { id: "heart-rate", title: "Heart Rate", value: "72", unit: "bpm", status: "normal", age: "2 hours ago", tone: "red", icon: <FiHeart /> },
  { id: "blood-pressure", title: "Blood Pressure", value: "120/80", unit: "mmHg", status: "normal", age: "4 hours ago", tone: "blue", icon: <FiActivity /> },
  { id: "calories", title: "Calories", value: "1850", unit: "kcal", status: "on track", age: "today", tone: "orange", icon: <FiZap /> },
  { id: "weight", title: "Weight", value: "165", unit: "lbs", status: "normal", age: "1 day ago", tone: "green", icon: <FiPackage /> },
]
const HOME_SCROLL_KEY = "home:scrollTop"

function seedFromString(input: string) {
  let hash = 0
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0
  }
  return hash || 1
}

function seededShuffle<T>(items: T[], seed: number) {
  const arr = [...items]
  let s = seed
  for (let i = arr.length - 1; i > 0; i -= 1) {
    s = (s * 1664525 + 1013904223) >>> 0
    const j = s % (i + 1)
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function buildLocalDailyTips(dayKey: string) {
  const shuffled = seededShuffle(healthTips, seedFromString(dayKey))
  return shuffled.slice(0, 3).map((tip, index) => ({
    id: `daily-local-${dayKey}-${index + 1}`,
    title: tip.title,
    summary: tip.summary,
    tags: tip.tags,
    moodTags: tip.moodTags,
    heroImage: tip.heroImage,
    sections: tip.sections,
  }))
}

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
  const [sosStep, setSosStep] = useState(0)
  const [sosRunning, setSosRunning] = useState(false)
  const [sosStatus, setSosStatus] = useState<"dialing" | "connecting" | "connected">("dialing")
  const [sosCountdown, setSosCountdown] = useState<number | null>(null)
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null)
  const [dailyTips, setDailyTips] = useState<DailyTipPayload[] | null>(null)
  const [latestHeartRate, setLatestHeartRate] = useState<{ value: number | null; eventAt?: string } | null>(null)
  const [latestBloodPressure, setLatestBloodPressure] = useState<{ sys: number | null; dia: number | null; eventAt?: string } | null>(null)
  const [heroIndex, setHeroIndex] = useState(0)
  const [heroDragging, setHeroDragging] = useState(false)
  const heroDragStartX = useRef<number | null>(null)
  const heroDragDelta = useRef(0)
  const heroDragWidth = useRef(1)
  const [heroDragOffset, setHeroDragOffset] = useState(0)
  const heroContainerRef = useRef<HTMLDivElement | null>(null)

  const tipTouchStartX = useRef<number | null>(null)
  const pageRef = useRef<HTMLElement | null>(null)
  const sosAlarmRef = useRef<number | null>(null)
  const sosAlarmAudioRef = useRef<HTMLAudioElement | null>(null)
  const sosVibrateRef = useRef<number | null>(null)
  const scoreTarget = 90

  const [moodHint, setMoodHint] = useState("")
  const formatAge = (eventAt?: string) => {
    if (!eventAt) return "No reading yet"
    const ts = Date.parse(eventAt)
    if (Number.isNaN(ts)) return "Recently"
    const diffMin = Math.max(0, Math.floor((Date.now() - ts) / 60000))
    if (diffMin < 1) return "Just now"
    if (diffMin < 60) return `${diffMin} mins ago`
    const hours = Math.floor(diffMin / 60)
    if (hours < 24) return `${hours} hours ago`
    const days = Math.floor(hours / 24)
    return `${days} days ago`
  }

  function computeMoodHint() {
    const threadId = localStorage.getItem(AI_THREAD_KEY)
    if (!threadId) return ""
    const raw = localStorage.getItem(`${AI_MESSAGE_PREFIX}${threadId}`)
    if (!raw) return ""
    try {
      const parsed = JSON.parse(raw) as Array<{ from: string; text: string }>
      const lastUser = [...parsed].reverse().find((item) => item.from === "user")
      if (!lastUser?.text) return ""
      const text = lastUser.text.toLowerCase()
      if (/(stress|anxious|panic|overwhelm|tension)/.test(text)) return "stress"
      if (/(dizz|vertigo|faint|lightheaded)/.test(text)) return "dizzy"
      if (/(sleep|insomnia|tired|night)/.test(text)) return "sleep"
      if (/(fatigue|low energy|weak|drained)/.test(text)) return "fatigue"
      return ""
    } catch {
      return ""
    }
  }

  useEffect(() => {
    const update = () => setMoodHint(computeMoodHint())
    update()
    const interval = window.setInterval(update, 3000)
    const onFocus = () => update()
    window.addEventListener("focus", onFocus)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener("focus", onFocus)
    }
  }, [])

  const recentFastScroll = useMemo(() => {
    const raw = localStorage.getItem(TIP_FAST_SCROLL_KEY)
    if (!raw) return false
    const ts = Number(raw)
    if (Number.isNaN(ts)) return false
    return Date.now() - ts < 6 * 60 * 60 * 1000
  }, [])

  const preferredTag = useMemo(() => localStorage.getItem(TIP_PREF_KEY) ?? "", [])

  const weatherTag = useMemo(() => {
    if (!weather) return ""
    if (weather.aqi && weather.aqi >= 4) return "Recovery"
    const cond = weather.condition.toLowerCase()
    if (weather.tempC >= 32) return "Hydration"
    if (weather.tempC <= 18) return "Sleep"
    if (cond.includes("rain") || cond.includes("drizzle") || cond.includes("thunder")) return "Recovery"
    if (weather.humidity >= 70) return "Hydration"
    return ""
  }, [weather])

  const hydratedDailyTips = useMemo<HealthTip[]>(() => {
    if (!dailyTips || dailyTips.length === 0) return []
    const iconFor = (key?: string) => {
      if (key === "droplet") return <FiDroplet />
      if (key === "moon") return <FiMoon />
      if (key === "smile") return <FiSmile />
      if (key === "heart") return <FiHeart />
      if (key === "thermo") return <FiThermometer />
      return <FiActivity />
    }
    return dailyTips.map((tip) => ({
      ...tip,
      icon: iconFor(tip.iconKey),
    }))
  }, [dailyTips])

  const displayTips = useMemo<HealthTip[]>(() => {
    if (hydratedDailyTips.length > 0) return hydratedDailyTips.slice(0, 3)
    let pool = [...healthTips]
    if (weatherTag) {
      const tagged = pool.filter((tip) => tip.tags.some((tag) => tag.toLowerCase() === weatherTag.toLowerCase()))
      if (tagged.length > 0) pool = tagged
    } else if (preferredTag) {
      const tagged = pool.filter((tip) => tip.tags.some((tag) => tag.toLowerCase() === preferredTag.toLowerCase()))
      if (tagged.length > 0) pool = tagged
    } else if (moodHint || recentFastScroll) {
      const mood = moodHint || (recentFastScroll ? "stress" : "")
      const tagged = pool.filter((tip) => tip.moodTags.includes(mood))
      if (tagged.length > 0) pool = tagged
    }
    const unique = Array.from(new Map(pool.map((tip) => [tip.id, tip])).values())
    const fallback = healthTips.filter((tip) => !unique.find((item) => item.id === tip.id))
    const combined = [...unique, ...fallback]
    return combined.slice(0, 3)
  }, [moodHint, preferredTag, recentFastScroll, weatherTag])

  const heroSlides = useMemo(
    () => [
      {
        id: "pharmacy",
        title: "Your medicines",
        highlight: "are on the way",
        subtitle: "Delivered in 5 MINS!",
        cta: "Track delivery",
        route: "/pharmacy/tracking",
        tone: "tone-pharmacy",
      },
      {
        id: "lab",
        title: "Lab tests",
        highlight: "at your doorstep",
        subtitle: "Book sample pickup in minutes",
        cta: "Book Lab Test",
        route: "/lab-tests",
        tone: "tone-lab",
      },
      {
        id: "tele",
        title: "Talk to a doctor",
        highlight: "within minutes",
        subtitle: "Video consults, anytime",
        cta: "Start Consult",
        route: "/teleconsultation",
        tone: "tone-tele",
      },
    ],
    [],
  )
  const labVariant = useMemo(() => ["a", "b", "c"][Math.floor(Math.random() * 3)], [])

  function renderHeroIllustration(id: string) {
    if (id === "lab") {
      return (
        <div className={`medicine-hero-illustration illustration-lab variant-${labVariant}`} aria-hidden="true">
          <div className="lab-beaker" />
          <div className="lab-chip" />
          <span className="lab-icon lab-thermo"><FiThermometer /></span>
          <span className="lab-icon lab-drop"><FiDroplet /></span>
          <span className="lab-icon lab-activity"><FiActivity /></span>
        </div>
      )
    }
    if (id === "tele") {
      return (
        <div className="medicine-hero-illustration illustration-tele" aria-hidden="true">
          <span className="tele-ring" />
          <span className="tele-phone"><FiPhoneCall /></span>
          <span className="tele-chat"><FiMessageCircle /></span>
          <span className="tele-pulse" />
        </div>
      )
    }
    return (
      <div className="medicine-hero-illustration illustration-pharmacy" aria-hidden="true">
        <div className="route-line route-a" />
        <div className="route-line route-b" />
        <span className="hero-pin hero-shop"><FiMapPin /></span>
        <span className="hero-pin hero-mid"><FiMapPin /></span>
        <span className="hero-rider"><FiTruck /></span>
        <span className="hero-pack"><FiPackage /></span>
      </div>
    )
  }

  useEffect(() => {
    if (heroSlides.length <= 1) return
    if (heroDragging) return
    const interval = window.setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroSlides.length)
    }, 4200)
    return () => window.clearInterval(interval)
  }, [heroSlides.length, heroDragging])

  function onHeroDragStart(clientX: number) {
    setHeroDragging(true)
    heroDragStartX.current = clientX
    heroDragDelta.current = 0
    heroDragWidth.current = heroContainerRef.current?.getBoundingClientRect().width || 1
    setHeroDragOffset(0)
  }

  function onHeroDragMove(clientX: number) {
    if (heroDragStartX.current === null) return
    const width = heroDragWidth.current || 1
    const raw = clientX - heroDragStartX.current
    const clamped = Math.max(-width * 0.85, Math.min(width * 0.85, raw))
    heroDragDelta.current = clamped
    setHeroDragOffset(clamped)
  }

  function onHeroDragEnd(clientX?: number) {
    if (heroDragStartX.current === null) return
    if (typeof clientX === "number") {
      heroDragDelta.current = clientX - heroDragStartX.current
    }
    const delta = heroDragDelta.current
    const width = heroDragWidth.current || 1
    const threshold = Math.min(90, width * 0.18)
    if (Math.abs(delta) > threshold) {
      const skip =
        Math.abs(delta) > width * 0.55 && heroSlides.length > 2 ? 2 : 1
      setHeroIndex((prev) => {
        if (delta > 0) return (prev - skip + heroSlides.length) % heroSlides.length
        return (prev + skip) % heroSlides.length
      })
    }
    heroDragStartX.current = null
    heroDragDelta.current = 0
    setHeroDragOffset(0)
    window.setTimeout(() => setHeroDragging(false), 160)
  }

  useEffect(() => {
    if (tipInteracting) return
    if (displayTips.length <= 1) return
    const ticker = window.setInterval(() => {
      setTipIndex((prev) => (prev + 1) % displayTips.length)
    }, 4300)
    return () => window.clearInterval(ticker)
  }, [tipInteracting, displayTips.length])

  useEffect(() => {
    if (tipIndex >= displayTips.length) setTipIndex(0)
  }, [displayTips.length, tipIndex])

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

  useEffect(() => {
    let active = true
    const loadLatest = async () => {
      try {
        const latest = await getLatestVital("heart_rate")
        if (!active) return
        setLatestHeartRate({ value: typeof latest?.value === "number" ? latest.value : null, eventAt: latest?.eventAt })
      } catch {
        if (!active) return
        setLatestHeartRate(null)
      }
    }
    void loadLatest()
    const interval = window.setInterval(loadLatest, 60000)
    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    let active = true
    const loadLatestBp = async () => {
      try {
        const [sys, dia] = await Promise.all([
          getLatestVital("blood_pressure_sys"),
          getLatestVital("blood_pressure_dia"),
        ])
        if (!active) return
        setLatestBloodPressure({
          sys: typeof sys?.value === "number" ? sys.value : null,
          dia: typeof dia?.value === "number" ? dia.value : null,
          eventAt: sys?.eventAt || dia?.eventAt,
        })
      } catch {
        if (!active) return
        setLatestBloodPressure(null)
      }
    }
    void loadLatestBp()
    const interval = window.setInterval(loadLatestBp, 90000)
    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [])

  const metricCards = useMemo(() => {
    return metrics.map((item) => {
      if (item.id !== "heart-rate") return item
      const value = latestHeartRate?.value
      const status = typeof value === "number"
        ? value > 100
          ? "high"
          : value < 55
            ? "low"
            : "normal"
        : item.status
      return {
        ...item,
        value: typeof value === "number" ? String(Math.round(value)) : item.value,
        age: latestHeartRate?.eventAt ? formatAge(latestHeartRate.eventAt) : item.age,
        status,
      }
    })
  }, [latestHeartRate])

  const metricCardsWithBp = useMemo(() => {
    if (!latestBloodPressure) return metricCards
    return metricCards.map((item) => {
      if (item.id !== "blood-pressure") return item
      const sys = latestBloodPressure.sys
      const dia = latestBloodPressure.dia
      if (typeof sys !== "number" || typeof dia !== "number") return item
      const status = sys >= 140 || dia >= 90 ? "high" : sys < 90 || dia < 60 ? "low" : "normal"
      return {
        ...item,
        value: `${Math.round(sys)}/${Math.round(dia)}`,
        age: latestBloodPressure.eventAt ? formatAge(latestBloodPressure.eventAt) : item.age,
        status,
      }
    })
  }, [metricCards, latestBloodPressure])

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
    if (Math.abs(delta) > 90) {
      localStorage.setItem(TIP_FAST_SCROLL_KEY, String(Date.now()))
      void logBehaviorSignal({
        type: "tip_swipe_fast",
        meta: { delta },
      })
    }
    if (delta > 45) setTipIndex((prev) => (prev - 1 + displayTips.length) % displayTips.length)
    if (delta < -45) setTipIndex((prev) => (prev + 1) % displayTips.length)
    window.setTimeout(() => setTipInteracting(false), 900)
  }

  function openTip(tip: HealthTip) {
    if (tip.id.startsWith("daily-") && dailyTips) {
      localStorage.setItem(DAILY_TIP_STORAGE_KEY, JSON.stringify(dailyTips))
    }
    if (tip.tags[0]) localStorage.setItem(TIP_PREF_KEY, tip.tags[0])
    void logBehaviorSignal({
      type: "tip_open",
      label: tip.title,
      tags: tip.tags,
      meta: { tipId: tip.id, mood: moodHint || null },
    })
    navigate(`/health-tips/${tip.id}`)
  }

  const companySession = getEmployeeCompanySession()
  const hrContact = companySession?.companyName
    ? `${companySession.companyName} HR Desk`
    : "HR Desk"
  const hrNumber = companySession?.hrPhone || localStorage.getItem("employee_hr_contact") || "1800-000-000"
  const sosContacts = [
    { label: hrContact, number: hrNumber, note: "Primary HR helpdesk" },
    { label: "Police", number: "100", note: "Immediate police assistance" },
    { label: "Ambulance", number: "108", note: "Emergency medical response" },
  ]

  function startSosAlarm() {
    if (sosAlarmRef.current) return
    const audio = sosAlarmAudioRef.current ?? new Audio(warningAlarm)
    audio.loop = true
    audio.volume = 0.75
    audio.currentTime = 0
    sosAlarmAudioRef.current = audio
    audio.play().catch(() => undefined)
    sosAlarmRef.current = window.setInterval(() => {
      if (audio.paused) {
        audio.play().catch(() => undefined)
      }
    }, 2000)
    if ("vibrate" in navigator) {
      navigator.vibrate(1200)
      sosVibrateRef.current = window.setInterval(() => {
        navigator.vibrate(1200)
      }, 1600)
    }
  }

  function stopSosAlarm() {
    if (!sosAlarmRef.current) return
    window.clearInterval(sosAlarmRef.current)
    sosAlarmRef.current = null
    const audio = sosAlarmAudioRef.current
    if (audio) {
      audio.pause()
      audio.currentTime = 0
    }
    if (sosVibrateRef.current) {
      window.clearInterval(sosVibrateRef.current)
      sosVibrateRef.current = null
      if ("vibrate" in navigator) {
        navigator.vibrate(0)
      }
    }
  }

  useEffect(() => {
    if (!showSos) {
      setSosRunning(false)
      setSosStep(0)
      setSosCountdown(null)
      stopSosAlarm()
      return
    }
    setSosRunning(false)
    const interval = window.setInterval(() => {
      setSosStep((prev) => (prev + 1) % sosContacts.length)
    }, 8000)
    return () => window.clearInterval(interval)
  }, [showSos, sosContacts.length])

  useEffect(() => {
    if (!showSos || sosCountdown === null) return
    if (sosCountdown <= 0) return
    const timer = window.setTimeout(() => {
      setSosCountdown((prev) => (prev !== null ? prev - 1 : null))
    }, 1000)
    return () => window.clearTimeout(timer)
  }, [showSos, sosCountdown])

  useEffect(() => {
    if (!showSos || sosCountdown !== 0) return
    setSosCountdown(null)
    setSosRunning(true)
    setSosStatus("dialing")
    startSosAlarm()
  }, [showSos, sosCountdown])

  useEffect(() => {
    if (!showSos || !sosRunning || sosCountdown !== null) return
    const contact = sosContacts[sosStep]
    if (!contact) return
    setSosStatus("dialing")
    const timer = window.setTimeout(() => {
      setSosStatus("connecting")
      window.location.href = `tel:${contact.number.replace(/\s/g, "")}`
      window.setTimeout(() => setSosStatus("connected"), 1500)
    }, 600)
    return () => window.clearTimeout(timer)
  }, [showSos, sosRunning, sosStep, sosContacts])

  useEffect(() => {
    const session = getEmployeeAuthSession()
    if (!session) {
      navigate("/login")
    }
  }, [navigate])

  useEffect(() => {
    const todayKey = new Date().toISOString().slice(0, 10)
    const cachedDate = localStorage.getItem(DAILY_TIP_DATE_KEY)
    const cachedTips = localStorage.getItem(DAILY_TIP_STORAGE_KEY)
    if (cachedDate === todayKey && cachedTips) {
      try {
        const parsed = JSON.parse(cachedTips) as DailyTipPayload[]
        if (parsed.length) {
          setDailyTips(parsed)
        }
      } catch {
        // ignore bad cache
      }
    } else {
      localStorage.removeItem(DAILY_TIP_STORAGE_KEY)
      localStorage.removeItem(DAILY_TIP_DATE_KEY)
    }

    const raw = localStorage.getItem("employee_geo")
    const runDaily = async (lat?: number, lon?: number, city?: string) => {
      try {
        const daily = await fetchDailyTips({ lat, lon, city })
        if (daily?.tips?.length) {
          setDailyTips(daily.tips)
          localStorage.setItem(DAILY_TIP_STORAGE_KEY, JSON.stringify(daily.tips))
          localStorage.setItem(DAILY_TIP_DATE_KEY, todayKey)
          return
        }
      } catch {
        // fall through
      }
      if (!cachedTips) {
        const localTips = buildLocalDailyTips(todayKey)
        setDailyTips(localTips)
        localStorage.setItem(DAILY_TIP_STORAGE_KEY, JSON.stringify(localTips))
        localStorage.setItem(DAILY_TIP_DATE_KEY, todayKey)
      }
    }

    if (!raw) {
      void runDaily()
      return
    }

    try {
      const parsed = JSON.parse(raw) as { lat?: number; lon?: number }
      if (parsed?.lat && parsed?.lon) {
        fetchWeather(parsed.lat, parsed.lon)
          .then((data) => {
            setWeather(data)
            return runDaily(parsed.lat, parsed.lon, data.location)
          })
          .catch(() => {
            void runDaily(parsed.lat, parsed.lon)
          })
      } else {
        void runDaily()
      }
    } catch {
      void runDaily()
    }
  }, [])

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

          <button
            className="sos-btn app-pressable"
            type="button"
            onClick={() => {
              setShowSos(true)
              setSosRunning(false)
              setSosStep(0)
              setSosStatus("dialing")
              setSosCountdown(3)
            }}
          >
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
          <div
            className={`hero-slider ${heroDragging ? "dragging" : ""}`}
            ref={heroContainerRef}
            onPointerDown={(e) => {
              if (e.pointerType === "mouse" && e.button !== 0) return
              onHeroDragStart(e.clientX)
              heroContainerRef.current?.setPointerCapture(e.pointerId)
            }}
            onPointerMove={(e) => {
              if (!heroDragging) return
              onHeroDragMove(e.clientX)
            }}
            onPointerUp={(e) => {
              onHeroDragEnd(e.clientX)
              heroContainerRef.current?.releasePointerCapture(e.pointerId)
            }}
            onPointerCancel={(e) => {
              onHeroDragEnd()
              heroContainerRef.current?.releasePointerCapture(e.pointerId)
            }}
          >
            <div
              className="hero-track"
              style={{
                transform: `translate3d(calc(-${heroIndex * 100}% + ${(-heroDragOffset / (heroDragWidth.current || 1)) * 100}%), 0, 0)`,
              }}
            >
              {heroSlides.map((slide) => (
                <article key={slide.id} className={`medicine-hero-card hero-slide ${slide.tone}`}>
                  <div className="medicine-hero-copy">
                    <h2><strong>{slide.title}</strong> {slide.highlight}</h2>
                    <p>{slide.subtitle}</p>
                    <button
                      className="medicine-hero-cta app-pressable"
                      type="button"
                      onClick={() => navigate(slide.route)}
                    >
                      {slide.cta}
                    </button>
                  </div>
                  {renderHeroIllustration(slide.id)}
                </article>
              ))}
            </div>
          </div>
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
          <div className="daily-tips-head">
            <div>
              <h3 className="section-title daily-tips-title">Daily Health Tips</h3>
            </div>
          </div>
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
                width: `${displayTips.length * 100}%`,
                transform: `translate3d(-${tipIndex * 100}%, 0, 0)`,
              }}
            >
              {displayTips.map((tip) => (
                <section
                  className="tip-card"
                  key={tip.title}
                  style={{ width: `${100 / displayTips.length}%` }}
                  onClick={() => openTip(tip)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") openTip(tip)
                  }}
                >
                  <div className="tip-header">
                    <div className="tip-title-icon">
                      <span className="tip-big-icon">{tip.icon}</span>
                      <div>
                        <h4>{tip.title}</h4>
                        <div className="tip-tags">
                          {tip.tags.map((tag) => (
                            <span key={tag}>{tag}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <p>{tip.summary}</p>
                </section>
              ))}
            </div>
            <div className="slider-dots">
              {displayTips.map((tip, index) => (
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
            {metricCardsWithBp.map((item) => (
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
        <div className="sos-overlay">
          <section className="sos-modal app-page-enter" onClick={(e) => e.stopPropagation()}>
            <header className="sos-head">
              <div className="sos-head-left">
                <span className="sos-head-icon"><FiShield /></span>
                <div>
                  <h3>Emergency</h3>
                  <p>Get immediate help</p>
                </div>
              </div>
            </header>

            <div className="sos-body">
              <div className="sos-call-core">
                <span className="sos-call-icon"><FiPhoneCall /></span>
                <h4>Emergency Call Flow</h4>
                {sosCountdown !== null ? (
                  <div className="sos-countdown">
                    <span>{sosCountdown}</span>
                    <small>Starting in</small>
                  </div>
                ) : (
                  <>
                    <div className="sos-step">
                      Calling: <strong>{sosContacts[sosStep]?.label}</strong>
                    </div>
                    <div className={`sos-status ${sosStatus}`}>
                      {sosStatus === "dialing" && "Dialing..."}
                      {sosStatus === "connecting" && "Ringing..."}
                      {sosStatus === "connected" && "Connected"}
                    </div>
                  </>
                )}
              </div>

              <div className="sos-contact-list">
                {sosContacts.map((contact, index) => (
                  <button
                    key={contact.label}
                    className={`sos-contact-row app-pressable ${index === sosStep ? "active" : ""}`}
                    type="button"
                    onClick={() => {
                      setSosStep(index)
                      window.location.href = `tel:${contact.number.replace(/\\s/g, "")}`
                    }}
                  >
                    <div>
                      <h5>{contact.label}</h5>
                      <p>{contact.note}</p>
                    </div>
                    <span className="sos-number">{contact.number}</span>
                  </button>
                ))}
              </div>

              <button
                className="sos-next app-pressable"
                type="button"
                onClick={() => {
                  stopSosAlarm()
                  setSosRunning(false)
                  setShowSos(false)
                  setSosCountdown(null)
                }}
              >
                Stop SOS
              </button>

            </div>
          </section>
        </div>
      )}
    </main>
  )
}

