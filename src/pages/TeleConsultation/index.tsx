import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react"
import {
  FiActivity,
  FiArrowUpRight,
  FiArrowLeft,
  FiDroplet,
  FiCheckCircle,
  FiHeart,
  FiMapPin,
  FiShield,
  FiSearch,
  FiStar,
  FiVideo,
} from "react-icons/fi"
import type { ReactElement } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { goBackOrFallback } from "../../utils/navigation"
import { playAppSound } from "../../utils/sound"
import { ensureDoctorActor, ensureEmployeeActor } from "../../services/actorsApi"
import { createAppointment } from "../../services/appointmentsApi"
import { getEmployeeCompanySession } from "../../services/authApi"
import { fetchDoctors as fetchDoctorDirectory } from "../../services/doctorsApi"
import { createTeleconsultSession, joinTeleconsultSession, type TeleconsultRtcPayload } from "../../services/teleconsultApi"
import "./teleconsultation.css"

type Doctor = {
  id: string
  name: string
  specialty: string
  rating: number
  reviews: number
  distance: string
  eta: string
  fee: number
  avatar: string
}

type JourneyStep = "options" | "ride" | "video"
type ConsultMode = "tele" | "opd"
type CallState = "ready" | "connecting" | "live" | "ended" | "failed"
type TeleNavState = {
  fromAiAnalyser?: boolean
  preselectedSpecialty?: Doctor["specialty"]
  selectedSymptoms?: string[]
  analysisQuery?: string
  recommendedMode?: ConsultMode
  selectedDoctorId?: string
  startRide?: boolean
  startVideo?: boolean
}

const DEMO_DOCTORS: Array<{
  handle: string
  fullName: string
  specialization: string
  avatar: string
  distance: string
  eta: string
  fee: number
}> = [
  {
    handle: "riza",
    fullName: "Dr. Riza Yuhi",
    specialization: "Internal Medicine",
    avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=160&q=80",
    distance: "2.5 km away",
    eta: "15 mins",
    fee: 25,
  },
  {
    handle: "sarah",
    fullName: "Dr. Sarah Chen",
    specialization: "Cardiology",
    avatar: "https://images.unsplash.com/photo-1594824475317-6f6d4f3a04c9?auto=format&fit=crop&w=160&q=80",
    distance: "3.2 km away",
    eta: "20 mins",
    fee: 35,
  },
  {
    handle: "michael",
    fullName: "Dr. Michael Park",
    specialization: "Dermatology",
    avatar: "https://images.unsplash.com/photo-1614436163996-25cee5f54290?auto=format&fit=crop&w=160&q=80",
    distance: "1.8 km away",
    eta: "12 mins",
    fee: 30,
  },
  {
    handle: "aarav",
    fullName: "Dr. Aarav Patel",
    specialization: "Pulmonology",
    avatar: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=160&q=80",
    distance: "2.9 km away",
    eta: "18 mins",
    fee: 32,
  },
]
const MAX_TELECONSULT_SECONDS = 5 * 60
const MAX_JOIN_RETRIES = 3
const JOIN_RETRY_DELAY_MS = 1200
const DEFAULT_COMPANY_ID = "astikan-demo-company"
const ZEGO_PREBUILT_SDK_URL = "https://unpkg.com/@zegocloud/zego-uikit-prebuilt/zego-uikit-prebuilt.js"
const LazyAgoraUIKit = lazy(() => import("agora-react-uikit"))

function getEmployeeRtcId() {
  const key = "astikan_employee_rtc_id"
  const existing = localStorage.getItem(key)
  if (existing) {
    return existing
  }
  const generated = `emp-${Math.random().toString(36).slice(2, 10)}`
  localStorage.setItem(key, generated)
  return generated
}

async function ensureTeleconsultActors(doctor: Doctor) {
  const companySession = getEmployeeCompanySession()
  const employeeHandle = getEmployeeRtcId()
  const employee = await ensureEmployeeActor({
    companyReference: companySession?.companyId ?? DEFAULT_COMPANY_ID,
    companyName: companySession?.companyName ?? "Astikan",
    email: `${employeeHandle}@employee.astikan.local`,
    fullName: "Astikan Employee",
    handle: employeeHandle,
    employeeCode: employeeHandle.toUpperCase(),
  })

  const doctorActor = await ensureDoctorActor({
    email: `${doctor.id}@doctor.astikan.local`,
    fullName: doctor.name,
    handle: doctor.id,
    specialization: doctor.specialty,
  })

  return { employee, doctor: doctorActor }
}

async function ensureDoctorDirectory() {
  let doctors = await fetchDoctorDirectory({ limit: 12 })
  if (doctors.length > 0) {
    return doctors
  }

  await Promise.all(
    DEMO_DOCTORS.map((doctor) =>
      ensureDoctorActor({
        email: `${doctor.handle}@doctor.astikan.local`,
        fullName: doctor.fullName,
        handle: doctor.handle,
        specialization: doctor.specialization,
      }),
    ),
  )

  doctors = await fetchDoctorDirectory({ limit: 12 })
  return doctors
}

function toAgoraNumericUid(value: string) {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  }
  const safe = hash % 1000000000
  return safe === 0 ? 1 : safe
}

let zegoPrebuiltLoadingPromise: Promise<void> | null = null

async function loadZegoPrebuiltSdk() {
  const sdk = (window as unknown as { ZegoUIKitPrebuilt?: any }).ZegoUIKitPrebuilt
  if (sdk) {
    return sdk
  }

  if (!zegoPrebuiltLoadingPromise) {
    zegoPrebuiltLoadingPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector<HTMLScriptElement>("script[data-zego-prebuilt='true']")
      if (existingScript) {
        existingScript.addEventListener("load", () => resolve(), { once: true })
        existingScript.addEventListener("error", () => reject(new Error("Failed to load Zego prebuilt SDK")), { once: true })
        return
      }

      const script = document.createElement("script")
      script.src = ZEGO_PREBUILT_SDK_URL
      script.async = true
      script.dataset.zegoPrebuilt = "true"
      script.onload = () => resolve()
      script.onerror = () => reject(new Error("Failed to load Zego prebuilt SDK"))
      document.head.appendChild(script)
    })
  }

  await zegoPrebuiltLoadingPromise
  const loaded = (window as unknown as { ZegoUIKitPrebuilt?: any }).ZegoUIKitPrebuilt
  if (!loaded) {
    throw new Error("Zego prebuilt SDK is unavailable")
  }
  return loaded
}

export default function TeleConsultation() {
  const navigate = useNavigate()
  const location = useLocation()
  const incomingState = location.state as TeleNavState | undefined
  const [step, setStep] = useState<JourneyStep>(() => {
    if (incomingState?.startRide) return "ride"
    return "options"
  })
  const [query, setQuery] = useState("")
  const [analysisQuery, setAnalysisQuery] = useState(() => incomingState?.analysisQuery ?? "")
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(() => incomingState?.selectedSymptoms ?? [])
  const [activeSpecialty, setActiveSpecialty] = useState<Doctor["specialty"] | "All Specialties">(
    () => incomingState?.preselectedSpecialty ?? "All Specialties",
  )
  const [mode, setMode] = useState<ConsultMode>(() => {
    if (incomingState?.startRide) return "opd"
    return incomingState?.recommendedMode ?? "tele"
  })
  const [selectedDoctor, setSelectedDoctor] = useState(() => incomingState?.selectedDoctorId ?? "")
  const [ridePhase, setRidePhase] = useState(0)
  const [rideProgress, setRideProgress] = useState(0)
  const [rideBanner, setRideBanner] = useState<"booked" | "onway" | "reached" | null>(null)
  const [callState, setCallState] = useState<CallState>("ready")
  const [callError, setCallError] = useState("")
  const [mediaError, setMediaError] = useState("")
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [showDoctors, setShowDoctors] = useState(false)
  const [isBookingNow, setIsBookingNow] = useState(false)
  const [teleconsultSessionId, setTeleconsultSessionId] = useState("")
  const [usingZegoTemplate, setUsingZegoTemplate] = useState(false)
  const [usingAgoraTemplate, setUsingAgoraTemplate] = useState(false)
  const [activeRtc, setActiveRtc] = useState<TeleconsultRtcPayload | null>(null)
  const [doctors, setDoctors] = useState<Doctor[]>([])

  const zegoTemplateContainerRef = useRef<HTMLDivElement | null>(null)
  const zegoTemplateInstanceRef = useRef<any>(null)
  const zegoChatCopyObserverRef = useRef<MutationObserver | null>(null)
  const connectTimerRef = useRef<number | null>(null)
  const callClockRef = useRef<number | null>(null)
  const employeeRtcIdRef = useRef(getEmployeeRtcId())
  const zegoBootstrapInProgressRef = useRef(false)
  const callExitHandledRef = useRef(false)

  const selectedDoctorInfo = doctors.find((doctor) => doctor.id === selectedDoctor) ?? null

  useEffect(() => {
    let active = true
    void ensureDoctorDirectory()
      .then((rows) => {
        if (!active) return
        const mapped = rows.map((row, index) => {
          const fallback = DEMO_DOCTORS[index % DEMO_DOCTORS.length]
          return {
            id: row.user_id,
            name: row.full_name ?? row.full_display_name ?? fallback.fullName,
            specialty: row.doctor_specializations?.[0]?.specialization_name ?? fallback.specialization,
            rating: Number(row.rating_avg ?? 4.7),
            reviews: Number(row.rating_count ?? 85),
            distance: fallback.distance,
            eta: fallback.eta,
            fee: Number(row.consultation_fee_inr ?? fallback.fee),
            avatar: row.avatar_url ?? fallback.avatar,
          }
        })
        setDoctors(mapped)
        if (!selectedDoctor && mapped[0]) {
          setSelectedDoctor(mapped[0].id)
        }
      })
      .catch(() => {
        if (!active) return
        setDoctors(
          DEMO_DOCTORS.map((doctor) => ({
            id: doctor.handle,
            name: doctor.fullName,
            specialty: doctor.specialization,
            rating: 4.8,
            reviews: 85,
            distance: doctor.distance,
            eta: doctor.eta,
            fee: doctor.fee,
            avatar: doctor.avatar,
          })),
        )
      })

    return () => {
      active = false
    }
  }, [])

  const specialtyFilters = useMemo(() => {
    const unique = Array.from(new Set(doctors.map((doctor) => doctor.specialty)))
    return ["All Specialties", ...unique] as const
  }, [])

  const specialtyIcons = useMemo<Record<string, ReactElement>>(
    () => ({
      "All Specialties": <FiShield />,
      "Internal Medicine": <FiActivity />,
      Cardiology: <FiHeart />,
      Dermatology: <FiDroplet />,
      Pulmonology: <FiActivity />,
    }),
    [],
  )

  const visibleDoctors = useMemo(() => {
    const q = query.trim().toLowerCase()
    return doctors.filter((doctor) => {
      const bySpecialty = activeSpecialty === "All Specialties" || doctor.specialty === activeSpecialty
      const byText = !q || doctor.name.toLowerCase().includes(q) || doctor.specialty.toLowerCase().includes(q)
      return bySpecialty && byText
    })
  }, [query, activeSpecialty])

  const rideSteps = [
    "Ride is on the way to pick you up",
    "You are on the way to the OPD doctor",
    "Arrived at clinic. Doctor will see you shortly",
  ]

  useEffect(() => {
    const state = location.state as TeleNavState | undefined

    if (!state) return

    if (state.fromAiAnalyser) {
      if (state.analysisQuery) setAnalysisQuery(state.analysisQuery)
      if (Array.isArray(state.selectedSymptoms) && state.selectedSymptoms.length > 0) {
        setSelectedSymptoms(state.selectedSymptoms)
      }
      if (state.preselectedSpecialty) {
        setActiveSpecialty(state.preselectedSpecialty)
      }
      if (state.recommendedMode) setMode(state.recommendedMode)
      setStep("options")
    }

    if (state.selectedDoctorId) setSelectedDoctor(state.selectedDoctorId)
    if (state.startVideo) {
      setMode("tele")
      setStep("video")
      setCallState("ready")
      return
    }
    if (state.startRide) {
      setMode("opd")
      setStep("ride")
      setRidePhase(0)
      return
    }
  }, [location.state])

  useEffect(() => {
    if (step !== "options") return
    setShowDoctors(false)
    const timer = window.setTimeout(() => setShowDoctors(true), 280)
    return () => window.clearTimeout(timer)
  }, [mode, step])

  useEffect(() => {
    if (step !== "ride" || !selectedDoctorInfo) return

    setRidePhase(0)
    setRideProgress(0)
    setRideBanner("booked")

    let intervalId = 0
    const onWayTimer = window.setTimeout(() => setRideBanner("onway"), 1300)
    const progressTimer = window.setTimeout(() => {
      intervalId = window.setInterval(() => {
        setRideProgress((prev) => {
          const next = Math.min(prev + 10, 100)
          if (next >= 100) {
            window.clearInterval(intervalId)
            setRidePhase(2)
            setRideBanner("reached")
            return next
          }
          if (next >= 45 && next < 85) setRidePhase(1)
          if (next >= 85) setRidePhase(2)
          return next
        })
      }, 900)
    }, 1800)

    return () => {
      window.clearTimeout(onWayTimer)
      window.clearTimeout(progressTimer)
      if (intervalId) window.clearInterval(intervalId)
    }
  }, [step, selectedDoctorInfo])

  useEffect(() => {
    return () => {
      if (connectTimerRef.current) window.clearTimeout(connectTimerRef.current)
      if (callClockRef.current) window.clearInterval(callClockRef.current)
      teardownRealtimeCall()
    }
  }, [])

  useEffect(() => {
    if (step === "video") {
      callExitHandledRef.current = false
    }
  }, [step])

  function exitCallToPreviousScreen() {
    if (callExitHandledRef.current) {
      return
    }
    callExitHandledRef.current = true
    goBackOrFallback(navigate)
  }

  async function bootstrapZegoTemplateCall(preferredProvider?: "zego" | "agora") {
    if (zegoBootstrapInProgressRef.current || usingZegoTemplate || usingAgoraTemplate || step !== "video" || mode !== "tele") {
      return
    }
    zegoBootstrapInProgressRef.current = true
    setCallState("connecting")
    setMediaError("")
    setCallError("")
    setElapsedSeconds(0)

    try {
      const rtc = await connectRealtimeCallWithRetry(preferredProvider)
      if (!rtc) {
        throw new Error("Realtime provider unavailable")
      }
      setActiveRtc(rtc)
      if (rtc.provider === "zego") {
        try {
          await startZegoTemplateCall(rtc)
        } catch {
          setUsingZegoTemplate(false)
          setActiveRtc(null)
          const fallbackRtc = await connectRealtimeCallWithRetry("agora")
          if (fallbackRtc) {
            setActiveRtc(fallbackRtc)
            setUsingAgoraTemplate(true)
          } else {
            throw new Error("Unable to start Zego. Agora fallback unavailable.")
          }
        }
      } else {
        setUsingAgoraTemplate(true)
      }
      setCallState("live")
      playAppSound("notify")
      startLiveTimer()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to join consultation"
      setCallState("failed")
      setMediaError("")
      setCallError(message)
    } finally {
      zegoBootstrapInProgressRef.current = false
    }
  }

  useEffect(() => {
    if (step !== "video" || mode !== "tele" || usingZegoTemplate || usingAgoraTemplate) {
      return
    }
    void bootstrapZegoTemplateCall()
  }, [step, mode, usingZegoTemplate, usingAgoraTemplate, selectedDoctor])

  async function ensureTeleconsultSession(doctorId: string) {
    if (teleconsultSessionId) {
      return teleconsultSessionId
    }
    const selectedDoctorRecord = doctors.find((doctor) => doctor.id === doctorId)
    if (!selectedDoctorRecord) {
      throw new Error("Doctor not found")
    }
    const actors = await ensureTeleconsultActors(selectedDoctorRecord)
    const now = new Date()
    const start = now.toISOString()
    const end = new Date(now.getTime() + 30 * 60 * 1000).toISOString()
    const appointment = await createAppointment({
      companyId: actors.employee.companyId,
      employeeId: actors.employee.employeeUserId,
      doctorId: actors.doctor.userId,
      createdByUserId: actors.employee.employeeUserId,
      appointmentType: "teleconsult",
      source: "employee_booked",
      scheduledStart: start,
      scheduledEnd: end,
      status: "confirmed",
      reason: analysisQuery || selectedDoctorRecord.specialty,
      patientSummary: selectedSymptoms.join(", "),
      symptomSnapshot: { selectedSymptoms },
      aiTriageSummary: analysisQuery || undefined,
    })
    const created = await createTeleconsultSession({
      companyId: actors.employee.companyId,
      employeeId: actors.employee.employeeUserId,
      doctorId: actors.doctor.userId,
      appointmentId: appointment.appointmentId,
      preferredProvider: "zego",
    })
    setTeleconsultSessionId(created.sessionId)
    return created.sessionId
  }

  async function continueJourney() {
    if (!selectedDoctorInfo) return
    if (mode === "tele") {
      setIsBookingNow(true)
      setMediaError("")
      try {
        await ensureTeleconsultSession(selectedDoctorInfo.id)
      } catch {
        // Session can still be created during the call bootstrap path.
      } finally {
        setIsBookingNow(false)
      }
      setStep("video")
      setCallState("connecting")
      return
    }
    try {
      const actors = await ensureTeleconsultActors(selectedDoctorInfo)
      const now = new Date()
      await createAppointment({
        companyId: actors.employee.companyId,
        employeeId: actors.employee.employeeUserId,
        doctorId: actors.doctor.userId,
        createdByUserId: actors.employee.employeeUserId,
        appointmentType: "opd",
        source: "employee_booked",
        scheduledStart: now.toISOString(),
        scheduledEnd: new Date(now.getTime() + 30 * 60 * 1000).toISOString(),
        status: "confirmed",
        reason: analysisQuery || selectedDoctorInfo.specialty,
        patientSummary: selectedSymptoms.join(", "),
        symptomSnapshot: { selectedSymptoms },
        aiTriageSummary: analysisQuery || undefined,
      })
    } catch {
      // Keep OPD journey resilient even if appointment persistence is unavailable.
    }
    navigate("/teleconsultation/pickup", { state: { doctor: selectedDoctorInfo, analysisQuery, selectedSymptoms } })
  }

  function teardownRealtimeCall() {
    if (zegoChatCopyObserverRef.current) {
      zegoChatCopyObserverRef.current.disconnect()
      zegoChatCopyObserverRef.current = null
    }
    if (zegoTemplateInstanceRef.current) {
      try {
        zegoTemplateInstanceRef.current.destroy()
      } catch {
        // Keep teardown best-effort.
      }
    }
    zegoTemplateInstanceRef.current = null
    if (zegoTemplateContainerRef.current) {
      zegoTemplateContainerRef.current.innerHTML = ""
    }

    setUsingZegoTemplate(false)
    setUsingAgoraTemplate(false)
    setActiveRtc(null)
  }

  function applyZegoChatCopyOverride(container: HTMLElement) {
    const desiredText = "Tell symptoms to your doctor"

    const patch = () => {
      const placeholders = container.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
        "input[placeholder], textarea[placeholder]"
      )
      placeholders.forEach((node) => {
        const current = (node.getAttribute("placeholder") ?? "").toLowerCase()
        if (current.includes("message")) {
          node.setAttribute("placeholder", desiredText)
        }
      })

      const textNodes = container.querySelectorAll<HTMLElement>("span, div, p, label")
      textNodes.forEach((node) => {
        const text = (node.textContent ?? "").trim().toLowerCase()
        if (text === "send a message to everyone") {
          node.textContent = desiredText
        }
      })
    }

    patch()
    if (zegoChatCopyObserverRef.current) {
      zegoChatCopyObserverRef.current.disconnect()
    }
    const observer = new MutationObserver(() => patch())
    observer.observe(container, { childList: true, subtree: true, attributes: true })
    zegoChatCopyObserverRef.current = observer
  }

  async function startZegoTemplateCall(rtc: TeleconsultRtcPayload) {
    const appId = Number(rtc.appId)
    if (!appId || !rtc.token) {
      throw new Error("Invalid Zego credentials")
    }
    const container = zegoTemplateContainerRef.current
    if (!container) {
      throw new Error("Video container is not ready")
    }

    const ZegoUIKitPrebuilt = await loadZegoPrebuiltSdk()
    const kitToken = ZegoUIKitPrebuilt.generateKitTokenForProduction(
      appId,
      rtc.token,
      rtc.channelName,
      employeeRtcIdRef.current,
      "Employee",
    )

    const zp = ZegoUIKitPrebuilt.create(kitToken)
    zegoTemplateInstanceRef.current = zp
    container.innerHTML = ""
    setUsingZegoTemplate(true)
    applyZegoChatCopyOverride(container)
    zp.joinRoom({
      container,
      scenario: {
        mode: ZegoUIKitPrebuilt.OneONoneCall,
      },
      layout: ZegoUIKitPrebuilt.AutoLayout,
      showPreJoinView: false,
      turnOnMicrophoneWhenJoining: true,
      turnOnCameraWhenJoining: true,
      autoHideFooter: false,
      showLeaveRoomConfirmDialog: false,
      showMyCameraToggleButton: true,
      showMyMicrophoneToggleButton: true,
      showAudioVideoSettingsButton: false,
      showTextChat: true,
      showUserList: false,
      showRoomDetailsButton: false,
      showMoreButton: false,
      showLayoutButton: false,
      showScreenSharingButton: false,
      maxUsers: 2,
      onLeaveRoom: () => {
        if (connectTimerRef.current) window.clearTimeout(connectTimerRef.current)
        if (callClockRef.current) window.clearInterval(callClockRef.current)
        connectTimerRef.current = null
        callClockRef.current = null
        setCallState("ended")
        setElapsedSeconds(0)
        setUsingZegoTemplate(false)
        zegoTemplateInstanceRef.current = null
        container.innerHTML = ""
        exitCallToPreviousScreen()
      },
    })
  }

  function startLiveTimer() {
    if (callClockRef.current) window.clearInterval(callClockRef.current)
    callClockRef.current = window.setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1
          if (next >= MAX_TELECONSULT_SECONDS) {
            if (callClockRef.current) window.clearInterval(callClockRef.current)
            callClockRef.current = null
            setCallState("ended")
            teardownRealtimeCall()
            exitCallToPreviousScreen()
            return MAX_TELECONSULT_SECONDS
          }
        return next
      })
    }, 1000)
  }

  async function connectRealtimeCallWithRetry(preferredProvider?: "zego" | "agora"): Promise<TeleconsultRtcPayload | null> {
    let lastError: unknown = null

    for (let attempt = 0; attempt < MAX_JOIN_RETRIES; attempt += 1) {
      try {
        if (!selectedDoctorInfo) {
          return null
        }

        const actors = await ensureTeleconsultActors(selectedDoctorInfo)
        const sessionId = await ensureTeleconsultSession(selectedDoctorInfo.id)
        const joined = await joinTeleconsultSession(sessionId, {
          participantType: "employee",
          participantId: actors.employee.employeeUserId,
          preferredProvider: attempt === 0 ? preferredProvider ?? "zego" : undefined,
          forceFailover: attempt > 0 || preferredProvider === "agora",
        })

        return joined.rtc
      } catch (error) {
        lastError = error
        if (attempt < MAX_JOIN_RETRIES - 1) {
          await new Promise<void>((resolve) => {
            window.setTimeout(resolve, JOIN_RETRY_DELAY_MS)
          })
        }
      }
    }

    throw lastError instanceof Error ? lastError : new Error("Unable to join teleconsult session")
  }

  const liveMinutes = String(Math.floor(elapsedSeconds / 60)).padStart(2, "0")
  const liveSeconds = String(elapsedSeconds % 60).padStart(2, "0")
  const agoraRtcProps =
    activeRtc && activeRtc.provider === "agora"
      ? {
          appId: activeRtc.appId,
          channel: activeRtc.channelName,
          token: activeRtc.token ?? undefined,
          uid: toAgoraNumericUid(activeRtc.userId),
        }
      : null

  return (
    <main className="tele-page app-page-enter">
      {step !== "video" && (
        <header className="tele-header app-fade-stagger">
          <button className="tele-back app-pressable" onClick={() => goBackOrFallback(navigate)} type="button" aria-label="Back">
            <FiArrowLeft />
          </button>
          <div>
            <h1>Book Appointment</h1>
            <p>Choose consultation type and get matched doctors</p>
          </div>
        </header>
      )}

      <section className={`tele-content app-content-slide ${step === "video" ? "tele-content-call" : ""}`}>
        {step === "options" && (
          <>
            <section className="mode-row app-fade-stagger">
              <button
                type="button"
                className={`mode-card app-pressable ${mode === "tele" ? "active" : ""}`}
                onClick={() => setMode("tele")}
              >
                <FiVideo />
                <h3>Teleconsultation</h3>
                <p>Online doctor appointment</p>
                <span className="mode-badge">5 mins</span>
              </button>

              <button
                type="button"
                className={`mode-card app-pressable ${mode === "opd" ? "active" : ""}`}
                onClick={() => setMode("opd")}
              >
                <FiMapPin />
                <h3>OPD Visit</h3>
                <p>Hospital visit booking</p>
                <span className="mode-badge">15 mins</span>
              </button>
            </section>

            <section className="search-wrap app-fade-stagger">
              <FiSearch />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search doctors or specialties.."
              />
            </section>

            <section className="specialty-row app-fade-stagger">
              {specialtyFilters.map((specialty) => (
                <button
                  key={specialty}
                  className={`specialty-chip app-pressable ${activeSpecialty === specialty ? "active" : ""}`}
                  onClick={() => setActiveSpecialty(specialty)}
                  type="button"
                >
                  <span className="specialty-icon">{specialtyIcons[specialty]}</span>
                  {specialty}
                </button>
              ))}
            </section>

            <section className="doctor-section app-fade-stagger">
              <h3>Doctors for your symptoms</h3>
              <div className={`doctor-list ${showDoctors ? "ready" : ""}`}>
                {visibleDoctors.map((doctor) => (
                  <button
                    key={doctor.id}
                    className={`doctor-card app-pressable ${selectedDoctor === doctor.id ? "selected" : ""}`}
                    onClick={() => {
                      setSelectedDoctor(doctor.id)
                    }}
                    type="button"
                  >
                    <div className="doctor-avatar">
                      <img src={doctor.avatar} alt={doctor.name} loading="lazy" />
                    </div>
                    <div className="doctor-main">
                      <h4>{doctor.name}</h4>
                      <p>{doctor.specialty}</p>
                      <div className="doctor-rating-block">
                        <span className="doctor-rating"><FiStar /> {doctor.rating.toFixed(1)}</span>
                        <span className="doctor-reviews">{doctor.reviews} Reviews</span>
                      </div>
                    </div>
                    <div className="doctor-time-badge">
                      {mode === "tele" ? "Call" : "Visit"} {doctor.eta}
                    </div>
                    <div className="doctor-go" aria-hidden="true">
                      <FiArrowUpRight />
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section className="consult-map-wrap app-fade-stagger">
              <h3>Nearby Clinic Route</h3>
              <article className="consult-map">
                <div className="consult-pin user">You</div>
                <div className="consult-route" />
                <div className="consult-pin clinic">Clinic</div>
                <div className="consult-chip eta">{mode === "tele" ? "5 mins" : "15 mins"}</div>
                <div className="consult-chip dist">{selectedDoctorInfo ? selectedDoctorInfo.distance : "2.5 km away"}</div>
              </article>
            </section>
          </>
        )}

        {step === "video" && selectedDoctorInfo && (
          <section className={`video-stage tele-call-stage app-fade-stagger ${usingZegoTemplate || usingAgoraTemplate ? "video-stage-template" : ""}`}>
            {!usingZegoTemplate && !usingAgoraTemplate && (
              <div className="video-top">
                <h3>{selectedDoctorInfo.name}</h3>
                <p>{selectedDoctorInfo.specialty}</p>
              </div>
            )}

            <div className="video-call-shell">
              {usingAgoraTemplate && agoraRtcProps ? (
                <div className="zego-template-shell">
                  <Suspense fallback={<p className="video-permission-note">Loading Agora call UI...</p>}>
                    <LazyAgoraUIKit
                      rtcProps={agoraRtcProps}
                      callbacks={{
                        EndCall: () => {
                          if (connectTimerRef.current) window.clearTimeout(connectTimerRef.current)
                          if (callClockRef.current) window.clearInterval(callClockRef.current)
                          connectTimerRef.current = null
                          callClockRef.current = null
                          setCallState("ended")
                          setElapsedSeconds(0)
                          setUsingAgoraTemplate(false)
                          setActiveRtc(null)
                          exitCallToPreviousScreen()
                        },
                      }}
                    />
                  </Suspense>
                </div>
              ) : (
                <div className="zego-template-shell">
                  <div ref={zegoTemplateContainerRef} className="zego-template-container" />
                </div>
              )}

            </div>

            {callState === "connecting" && (
              <div className="tele-join-loader" role="status" aria-live="polite">
                <span className="tele-join-spinner" aria-hidden="true" />
                <strong>Joining consultation...</strong>
                <p>Setting up your secure call room. This may take a few seconds.</p>
              </div>
            )}

            {callState === "failed" && (
              <div className="tele-join-loader tele-join-failed" role="status" aria-live="polite">
                <span className="tele-join-spinner" aria-hidden="true" />
                <strong>We could not connect yet</strong>
                <p>{callError || "Please check your network and try again."}</p>
                <div className="tele-join-actions">
                  <button className="app-pressable" type="button" onClick={() => void bootstrapZegoTemplateCall()}>
                    Retry join
                  </button>
                  <button className="ghost" type="button" onClick={exitCallToPreviousScreen}>
                    Go back
                  </button>
                </div>
              </div>
            )}

            {mediaError ? <p className="video-permission-note">{mediaError}</p> : null}
            {(callState === "live" || callState === "connecting") && !usingZegoTemplate && !usingAgoraTemplate && (
              <div className="video-clock-inline">
                <span>{liveMinutes}:{liveSeconds}</span>
              </div>
            )}

            {!usingZegoTemplate && !usingAgoraTemplate && (
              <div className="video-controls" />
            )}
          </section>
        )}

        {step === "ride" && selectedDoctorInfo && (
          <section className="ride-stage app-fade-stagger">
            <h3>OPD Ride Tracking</h3>
            <p>{selectedDoctorInfo.name} is booked. Live ride updates below.</p>

            <article className="ride-map">
              <iframe
                title="Ride live map"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src="https://maps.google.com/maps?q=12.9716,77.5946%20to%2012.9352,77.6245&z=12&output=embed"
              />
              <div className="ride-pin user">You</div>
              <div className="ride-route" />
              <div className="ride-car" style={{ left: `calc(${rideProgress}% - 18px)` }}>Ride</div>
              <div className="ride-pin clinic">OPD</div>
            </article>

            <article className="ride-status">
              <span>{ridePhase + 1}/3</span>
              <strong>{rideSteps[ridePhase]}</strong>
              <p>{rideProgress}% completed</p>
            </article>
          </section>
        )}
      </section>

      {step === "options" && (
        <footer className="tele-footer app-fade-stagger">
          {selectedDoctorInfo && (
            <div className="book-actions">
              <button
                className="book-later-btn app-pressable"
                type="button"
                disabled={isBookingNow}
                onClick={() =>
                  navigate("/teleconsultation/schedule", {
                    state: {
                      doctor: selectedDoctorInfo,
                      mode,
                      analysisQuery,
                      selectedSymptoms,
                    },
                  })
                }
              >
                Schedule
              </button>
              <button className="book-btn app-pressable" type="button" onClick={continueJourney} disabled={isBookingNow}>
                {isBookingNow ? (
                  <span className="book-btn-loading">
                    <span className="book-btn-spinner" aria-hidden="true" />
                    Preparing call...
                  </span>
                ) : (
                  "Book Now"
                )}
              </button>
            </div>
          )}
          {!selectedDoctorInfo && (
            <p className="tele-hint">Select any doctor card to choose Office Pickup or Home Pickup.</p>
          )}
        </footer>
      )}

      {step === "ride" && rideBanner === "booked" && (
        <div className="booked-toast app-page-enter" role="status">
          <FiCheckCircle /> Appointment booked.
        </div>
      )}

      {step === "ride" && rideBanner === "onway" && (
        <div className="booked-toast onway app-page-enter" role="status">
          <FiCheckCircle /> Your ride is on the way.
        </div>
      )}

      {step === "ride" && rideBanner === "reached" && (
        <div className="booked-toast app-page-enter" role="status">
          <FiCheckCircle /> Arrived. Please proceed to doctor cabin.
        </div>
      )}
    </main>
  )
}
