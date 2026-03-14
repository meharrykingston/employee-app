import { useEffect, useMemo, useRef, useState } from "react"
import {
  FiArrowLeft,
  FiActivity,
  FiHeart,
  FiMic,
  FiMoon,
  FiSend,
  FiSmile,
  FiSquare,
  FiSun,
  FiWind,
  FiZap,
} from "react-icons/fi"
import { useNavigate } from "react-router-dom"
import "./stresschat.css"

type Mode = null | "breathing" | "sleep"
type SpeechRecognitionInstance = {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((event: any) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

type ActivityItem = {
  id: string
  title: string
  subtitle: string
  tone: "blue" | "pink" | "purple" | "teal"
  icon: React.ReactElement
  action?: Mode
}

type SleepRecording = {
  id: string
  createdAt: string
  label: string
  dataUrl: string
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

const breathingSteps = [
  { label: "Inhale", seconds: 4 },
  { label: "Hold", seconds: 4 },
  { label: "Exhale", seconds: 4 },
]
const SLEEP_RECORDINGS_KEY = "employee_sleep_recordings_v1"

export default function StressRelief() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>(null)
  const [draft, setDraft] = useState("")
  const [lastSent, setLastSent] = useState("")
  const [breathingStep, setBreathingStep] = useState(0)
  const [breathingCount, setBreathingCount] = useState(breathingSteps[0].seconds)
  const [sleepRecords, setSleepRecords] = useState<SleepRecording[]>(() => {
    const raw = localStorage.getItem(SLEEP_RECORDINGS_KEY)
    if (!raw) return []
    try {
      const parsed = JSON.parse(raw) as SleepRecording[]
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })
  const [isRecording, setIsRecording] = useState(false)
  const [sleepSound, setSleepSound] = useState("Rain")
  const [isListening, setIsListening] = useState(false)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const recordChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const speechRef = useRef<SpeechRecognitionInstance | null>(null)

  const calmScore = useMemo(() => 78, [])
  const isNight = useMemo(() => {
    const hour = new Date().getHours()
    return hour >= 21 || hour < 6
  }, [])

  function triggerActivity(item: ActivityItem) {
    if (item.id === "reset") {
      navigate("/ai-chat", { state: { prefill: "I need a mood reset. Help me calm down." } })
      return
    }
    if (item.id === "meditation") {
      navigate("/meditation")
      return
    }
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
    navigate("/ai-chat", { state: { prefill: text } })
  }

  function persistSleepRecords(next: SleepRecording[]) {
    setSleepRecords(next)
    localStorage.setItem(SLEEP_RECORDINGS_KEY, JSON.stringify(next))
  }

  function formatRecordingLabel(createdAt: string) {
    const date = new Date(createdAt)
    const today = new Date()
    const yesterday = new Date()
    yesterday.setDate(today.getDate() - 1)
    const sameDay = date.toDateString() === today.toDateString()
    const lastNight = date.toDateString() === yesterday.toDateString()
    if (sameDay) return "Tonight"
    if (lastNight) return "Last night"
    return date.toLocaleDateString()
  }

  async function startRecording() {
    if (!isNight || isRecording) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const recorder = new MediaRecorder(stream)
      recordChunksRef.current = []
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordChunksRef.current.push(event.data)
        }
      }
      recorder.onstop = () => {
        const blob = new Blob(recordChunksRef.current, { type: recorder.mimeType || "audio/webm" })
        const reader = new FileReader()
        reader.onload = () => {
          const dataUrl = String(reader.result || "")
          const now = new Date().toISOString()
          const next: SleepRecording = {
            id: `sleep-${Date.now()}`,
            createdAt: now,
            label: formatRecordingLabel(now),
            dataUrl,
          }
          const updated = [next, ...sleepRecords].slice(0, 5)
          persistSleepRecords(updated)
        }
        reader.readAsDataURL(blob)
        stream.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
      recorder.start()
      recorderRef.current = recorder
      setIsRecording(true)
    } catch {
      setIsRecording(false)
    }
  }

  function stopRecording() {
    if (!recorderRef.current) return
    recorderRef.current.stop()
    recorderRef.current = null
    setIsRecording(false)
  }

  useEffect(() => {
    if (mode !== "breathing") return
    setBreathingStep(0)
    setBreathingCount(breathingSteps[0].seconds)
    const interval = window.setInterval(() => {
      setBreathingCount((prev) => {
        if (prev <= 1) {
          setBreathingStep((current) => {
            const nextStep = (current + 1) % breathingSteps.length
            setBreathingCount(breathingSteps[nextStep].seconds)
            return nextStep
          })
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => window.clearInterval(interval)
  }, [mode])

  useEffect(() => {
    return () => {
      if (speechRef.current) {
        speechRef.current.stop()
        speechRef.current = null
      }
      if (recorderRef.current) {
        recorderRef.current.stop()
        recorderRef.current = null
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
    }
  }, [])

  function stopVoiceToText() {
    if (speechRef.current) {
      speechRef.current.stop()
      speechRef.current = null
    }
    setIsListening(false)
  }

  function startVoiceToText() {
    const Recognition = (window as typeof window & {
      SpeechRecognition?: new () => SpeechRecognitionInstance
      webkitSpeechRecognition?: new () => SpeechRecognitionInstance
    }).SpeechRecognition || (window as typeof window & { webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).webkitSpeechRecognition

    if (!Recognition) {
      setLastSent("Voice input is not supported on this device.")
      return
    }

    const recognition = new Recognition()
    recognition.lang = "en-IN"
    recognition.continuous = false
    recognition.interimResults = false
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim() || ""
      if (transcript) {
        setDraft(transcript)
        navigate("/ai-chat", { state: { prefill: transcript } })
      }
      setIsListening(false)
    }
    recognition.onerror = () => stopVoiceToText()
    recognition.onend = () => stopVoiceToText()
    speechRef.current = recognition
    setIsListening(true)
    recognition.start()
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
        <button className="input-icon app-pressable" type="button" aria-label="Voice input" onClick={startVoiceToText}>
          <FiMic />
        </button>
        <input placeholder="Share your feelings..." value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && onSend()} />
        <button className="send-btn app-pressable" type="button" aria-label="Send" onClick={onSend}><FiSend /></button>
      </div>

      {isListening && (
        <div className="voice-overlay" onClick={stopVoiceToText}>
          <div className="voice-sheet app-page-enter" onClick={(e) => e.stopPropagation()}>
            <h4>Listening...</h4>
            <p>Speak your feelings. We’ll take you to AI chat right after.</p>
            <div className="voice-bars" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
            <button className="stop-voice app-pressable" onClick={stopVoiceToText} type="button">Stop</button>
          </div>
        </div>
      )}

      {mode === "breathing" && (
        <div className="overlay" onClick={() => setMode(null)}>
          <div className="breath-wrap">
            <div className="breath-ring ring-1" />
            <div className="breath-ring ring-2" />
            <div className="breath-circle" />
          </div>
          <p className="overlay-title">Breathing Exercise</p>
          <p className="overlay-sub">{breathingSteps[breathingStep].label} • {breathingCount}s</p>
          <p className="overlay-sub">Inhale for 4s, hold for 4s, exhale for 4s</p>
        </div>
      )}

      {mode === "sleep" && (
        <div className="overlay" onClick={() => setMode(null)}>
          <div className="sleep-sheet" onClick={(e) => e.stopPropagation()}>
            <p className="overlay-title">Sleep Sounds</p>
            <p className="overlay-sub">Choose a calming soundscape</p>
            <div className="sleep-tags">
              {["Rain", "Ocean", "Forest"].map((tag) => (
                <button key={tag} type="button" className={`sleep-tag ${sleepSound === tag ? "active" : ""}`} onClick={() => setSleepSound(tag)}>
                  {tag}
                </button>
              ))}
            </div>
            <audio controls autoPlay loop>
              <source src={`/sounds/${sleepSound.toLowerCase()}.mp3`} type="audio/mpeg" />
            </audio>

            <div className="sleep-record">
              <div>
                <strong>Record sleep sound</strong>
                <p>{isNight ? "Recording available at night" : "Available between 9 PM and 6 AM"}</p>
              </div>
              <button
                type="button"
                className="sleep-record-btn app-pressable"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={!isNight}
              >
                {isRecording ? <FiSquare /> : <FiMic />}
                {isRecording ? "Stop" : "Record"}
              </button>
            </div>

            {sleepRecords.length > 0 && (
              <div className="sleep-history">
                <h4>Previous sleep sounds</h4>
                {sleepRecords.map((record) => (
                  <div key={record.id} className="sleep-history-row">
                    <span>{record.label}</span>
                    <audio controls src={record.dataUrl} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

