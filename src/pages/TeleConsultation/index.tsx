import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react"
import {
  FiActivity,
  FiArrowUpRight,
  FiArrowLeft,
  FiClock,
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
import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt"
import { goBackOrFallback } from "../../utils/navigation"
import { playAppSound } from "../../utils/sound"
import { ensureDoctorActor, ensureEmployeeActor } from "../../services/actorsApi"
import { createAppointment } from "../../services/appointmentsApi"
import { getEmployeeCompanySession } from "../../services/authApi"
import { fetchDoctors as fetchDoctorDirectory, type DirectoryDoctor } from "../../services/doctorsApi"
import { createTeleconsultSession, joinTeleconsultSession, type TeleconsultRtcPayload } from "../../services/teleconsultApi"
import { addNotification } from "../../services/notificationCenter"
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
  fallbackAvatar: string
  practiceAddress?: string | null
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
  teleconsultSessionId?: string
  scheduledAt?: string
  bookingId?: string
  startRide?: boolean
  startVideo?: boolean
  autoJoin?: boolean
}

type TeleBooking = {
  id: string
  sessionId: string
  doctorId: string
  doctorName: string
  specialty: string
  doctorAvatar?: string
  status?: string
  scheduledAt: string
  joinWindowStart: string
}

const TELE_BOOKINGS_KEY = "teleconsult_bookings"

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
  {
    handle: "aisha",
    fullName: "Dr. Aisha Qureshi",
    specialization: "Internal Medicine",
    avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=160&q=80",
    distance: "2.1 km away",
    eta: "14 mins",
    fee: 28,
  },
  {
    handle: "vivek",
    fullName: "Dr. Vivek Menon",
    specialization: "Cardiology",
    avatar: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&w=160&q=80",
    distance: "4.0 km away",
    eta: "22 mins",
    fee: 38,
  },
  {
    handle: "isha",
    fullName: "Dr. Isha Kapoor",
    specialization: "Dermatology",
    avatar: "https://images.unsplash.com/photo-1551836022-4c4c79ecde51?auto=format&fit=crop&w=160&q=80",
    distance: "1.6 km away",
    eta: "11 mins",
    fee: 30,
  },
  {
    handle: "naveen",
    fullName: "Dr. Naveen Rao",
    specialization: "Pulmonology",
    avatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=160&q=80",
    distance: "3.4 km away",
    eta: "19 mins",
    fee: 33,
  },
]
const MAX_TELECONSULT_SECONDS = 30 * 60
const MAX_JOIN_RETRIES = 3
const JOIN_RETRY_DELAY_MS = 1200
const DEFAULT_COMPANY_ID = "astikan-demo-company"
const LazyAgoraUIKit = lazy(() => import("agora-react-uikit"))


function resolveAvatarUrl(avatar: string | null | undefined, fallback: string) {
  if (!avatar) return fallback
  const trimmed = avatar.trim()
  if (!trimmed) return fallback
  if (trimmed.startsWith("http") || trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
    return trimmed
  }
  if (trimmed.startsWith("/")) {
    return trimmed
  }
  return `/assets/${trimmed.replace(/^assets\//, "")}`
}

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

function toAgoraNumericUid(value: string) {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  }
  const safe = hash % 1000000000
  return safe === 0 ? 1 : safe
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
  const [scheduledAt, setScheduledAt] = useState<string | null>(null)
  const [bookingId, setBookingId] = useState<string | null>(null)
  const [joinReady, setJoinReady] = useState(true)
  const [autoJoin, setAutoJoin] = useState(false)
  const [usingZegoTemplate, setUsingZegoTemplate] = useState(false)
  const [usingAgoraTemplate, setUsingAgoraTemplate] = useState(false)
  const [activeRtc, setActiveRtc] = useState<TeleconsultRtcPayload | null>(null)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [doctorOffset, setDoctorOffset] = useState(0)
  const [doctorHasMore, setDoctorHasMore] = useState(true)
  const [doctorLoading, setDoctorLoading] = useState(false)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const [forceAgora, setForceAgora] = useState(false)
  const zegoContainerRef = useRef<HTMLDivElement | null>(null)
  const zegoUiRef = useRef<ReturnType<typeof ZegoUIKitPrebuilt.create> | null>(null)
  const connectTimerRef = useRef<number | null>(null)
  const callClockRef = useRef<number | null>(null)
  const zegoBootstrapInProgressRef = useRef(false)
  const callExitHandledRef = useRef(false)

  const selectedDoctorInfo = doctors.find((doctor) => doctor.id === selectedDoctor) ?? null
  const effectiveStep: JourneyStep = step === "video" && !selectedDoctorInfo ? "options" : step
  const joinWindowStart = useMemo(() => {
    if (!scheduledAt) return null
    const scheduledMs = Date.parse(scheduledAt)
    if (!Number.isFinite(scheduledMs)) return null
    return new Date(scheduledMs - 60 * 1000)
  }, [scheduledAt])
  const joinWindowLabel = joinWindowStart
    ? joinWindowStart.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })
    : null
  const rideDoctor = selectedDoctorInfo ?? doctors[0] ?? {
    id: "assigned",
    name: "Assigned Doctor",
    specialty: "Internal Medicine",
    rating: 4.7,
    reviews: 80,
    distance: "2.5 km away",
    eta: "15 mins",
    fee: 28,
    avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=160&q=80",
    fallbackAvatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=160&q=80",
    practiceAddress: null,
  }

  const PAGE_SIZE = 12

  const mapDoctorRows = (rows: DirectoryDoctor[]) =>
    rows.map((row, index) => {
      const fallback = DEMO_DOCTORS[index % DEMO_DOCTORS.length]
      const fallbackAvatar = fallback.avatar
      return {
        id: row.user_id,
        name: row.full_name ?? row.full_display_name ?? fallback.fullName,
        specialty: row.doctor_specializations?.[0]?.specialization_name ?? fallback.specialization,
        rating: Number(row.rating_avg ?? 4.7),
        reviews: Number(row.rating_count ?? 85),
        distance: fallback.distance,
        eta: fallback.eta,
        fee: Number(row.consultation_fee_inr ?? fallback.fee),
        avatar: resolveAvatarUrl(row.avatar_url, fallbackAvatar),
        fallbackAvatar,
        practiceAddress: row.practice_address ?? null,
      }
    })

  async function loadDoctors(reset = false) {
    if (doctorLoading) return
    setDoctorLoading(true)
    try {
      const offset = reset ? 0 : doctorOffset
      const rows = await fetchDoctorDirectory({
        limit: PAGE_SIZE,
        offset,
      })
      const mapped = mapDoctorRows(rows)
      if (reset) {
        setDoctors(mapped)
      } else {
        setDoctors((prev) => [...prev, ...mapped])
      }
      const nextOffset = offset + mapped.length
      setDoctorOffset(nextOffset)
      setDoctorHasMore(mapped.length === PAGE_SIZE)
      if (!selectedDoctor && mapped[0]) {
        setSelectedDoctor(mapped[0].id)
      }
    } catch {
      if (reset) {
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
            fallbackAvatar: doctor.avatar,
            practiceAddress: null,
          })),
        )
        setDoctorHasMore(false)
      }
    } finally {
      setDoctorLoading(false)
    }
  }

  useEffect(() => {
    setDoctorOffset(0)
    setDoctorHasMore(true)
    void loadDoctors(true)
  }, [])

  useEffect(() => {
    let active = true
    if (!loadMoreRef.current) return () => {}
    const observer = new IntersectionObserver(
      (entries) => {
        if (!active) return
        if (entries.some((entry) => entry.isIntersecting) && doctorHasMore && !doctorLoading) {
          void loadDoctors(false)
        }
      },
      { rootMargin: "200px" },
    )
    observer.observe(loadMoreRef.current)
    return () => {
      active = false
      observer.disconnect()
    }
  }, [doctorHasMore, doctorLoading])

  const specialtyFilters = useMemo(() => {
    const base = ["Internal Medicine", "Cardiology", "Dermatology", "Pulmonology"]
    const unique = Array.from(new Set([...base, ...doctors.map((doctor) => doctor.specialty)]))
    return ["All Specialties", ...unique] as const
  }, [doctors])

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
    const filtered = doctors.filter((doctor) => {
      const bySpecialty = activeSpecialty === "All Specialties" || doctor.specialty === activeSpecialty
      const byText = !q || doctor.name.toLowerCase().includes(q) || doctor.specialty.toLowerCase().includes(q)
      return bySpecialty && byText
    })
    if (filtered.length >= 2) return filtered
    if (filtered.length > 0) return filtered
    return []
  }, [doctors, activeSpecialty, query])

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
    if (state.teleconsultSessionId) setTeleconsultSessionId(state.teleconsultSessionId)
    if (state.scheduledAt) setScheduledAt(state.scheduledAt)
    if (state.bookingId) setBookingId(state.bookingId)
    if (state.startVideo) {
      setMode("tele")
      setStep("video")
      setCallState("ready")
      setCallError("")
      setMediaError("")
      setAutoJoin(Boolean(state.autoJoin))
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
    if (!autoJoin || step !== "video" || !joinReady) return
    if (callState !== "ready" || usingZegoTemplate || usingAgoraTemplate) return
    setAutoJoin(false)
    void bootstrapZegoTemplateCall(forceAgora ? "agora" : undefined)
  }, [autoJoin, callState, forceAgora, joinReady, step, usingAgoraTemplate, usingZegoTemplate])

  useEffect(() => {
    if (step !== "options") return
    setShowDoctors(false)
    const timer = window.setTimeout(() => setShowDoctors(true), 280)
    return () => window.clearTimeout(timer)
  }, [mode, step])

  useEffect(() => {
    if (!selectedDoctor && visibleDoctors[0]) {
      setSelectedDoctor(visibleDoctors[0].id)
    }
  }, [selectedDoctor, visibleDoctors])

  useEffect(() => {
    if (step !== "video") return
    if (selectedDoctorInfo) return
    if (doctors.length > 0) {
      setSelectedDoctor(doctors[0].id)
      return
    }
    if (teleconsultSessionId || bookingId) return
    setStep("options")
  }, [doctors, selectedDoctorInfo, step, teleconsultSessionId, bookingId])

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
      setCallState("ready")
      setCallError("")
      setMediaError("")
    }
  }, [step])

  useEffect(() => {
    if (step !== "video" || callState !== "failed") return
    const timer = window.setTimeout(() => {
      if (!usingAgoraTemplate) {
        void bootstrapZegoTemplateCall("agora")
      }
    }, 800)
    return () => window.clearTimeout(timer)
  }, [step, callState, usingAgoraTemplate])

  useEffect(() => {
    if (step !== "video" || !joinWindowStart) {
      setJoinReady(true)
      return
    }
    const now = Date.now()
    const openAt = joinWindowStart.getTime()
    if (now >= openAt) {
      setJoinReady(true)
      return
    }
    setJoinReady(false)
    const timer = window.setTimeout(() => setJoinReady(true), openAt - now)
    return () => window.clearTimeout(timer)
  }, [step, joinWindowStart])

  useEffect(() => {
    if (step !== "video" || joinReady) return
    if (bookingId) {
      navigate(`/teleconsultation/overview/${bookingId}`, { replace: true })
    }
  }, [step, joinReady, bookingId, navigate])

  function exitCallToPreviousScreen() {
    if (callExitHandledRef.current) {
      return
    }
    callExitHandledRef.current = true
    goBackOrFallback(navigate)
  }

  async function bootstrapZegoTemplateCall(preferredProvider?: "zego" | "agora") {
    if (zegoBootstrapInProgressRef.current || usingZegoTemplate || usingAgoraTemplate || step !== "video" || mode !== "tele" || !joinReady) {
      return
    }
    zegoBootstrapInProgressRef.current = true
    setCallState("connecting")
    setMediaError("")
    setCallError("")
    setElapsedSeconds(0)

    try {
      const preferred = forceAgora ? "agora" : preferredProvider
      const rtc = await connectRealtimeCallWithRetry(preferred)
      if (!rtc) {
        throw new Error("Realtime provider unavailable")
      }
      setActiveRtc(rtc)
      if (preferred === "agora" && rtc.provider !== "agora") {
        throw new Error("Agora fallback unavailable")
      }
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
      if (preferredProvider !== "agora") {
        try {
          const fallbackRtc = await connectRealtimeCallWithRetry("agora")
          if (fallbackRtc) {
            setActiveRtc(fallbackRtc)
            setUsingAgoraTemplate(true)
            setCallState("live")
            playAppSound("notify")
            startLiveTimer()
            return
          }
        } catch {
          // fall through to failure UI
        }
      }
      const message = error instanceof Error ? error.message : "Unable to join consultation"
      setForceAgora(true)
      setCallState("failed")
      setMediaError("")
      setCallError(message)
    } finally {
      zegoBootstrapInProgressRef.current = false
    }
  }

  // Join is now user-initiated from the waiting room UI.

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
      meetingJoinWindowStart: new Date(now.getTime() - 60 * 1000).toISOString(),
      meetingJoinWindowEnd: end,
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
      let booking: TeleBooking | null = null
      try {
        const now = new Date()
        const start = new Date(now.getTime())
        const end = new Date(start.getTime() + 30 * 60 * 1000)
        const actors = await ensureTeleconsultActors(selectedDoctorInfo)
        const appointment = await createAppointment({
          companyId: actors.employee.companyId,
          employeeId: actors.employee.employeeUserId,
          doctorId: actors.doctor.userId,
          createdByUserId: actors.employee.employeeUserId,
          appointmentType: "teleconsult",
          source: "employee_booked",
          scheduledStart: start.toISOString(),
          scheduledEnd: end.toISOString(),
          meetingJoinWindowStart: new Date(start.getTime()).toISOString(),
          meetingJoinWindowEnd: end.toISOString(),
          status: "confirmed",
          reason: analysisQuery || selectedDoctorInfo.specialty,
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
        scheduledAt: start.toISOString(),
      })
        setTeleconsultSessionId(created.sessionId)
        setScheduledAt(start.toISOString())
        booking = {
          id: appointment.appointmentId,
          sessionId: created.sessionId,
          doctorId: selectedDoctorInfo.id,
          doctorName: selectedDoctorInfo.name,
          specialty: selectedDoctorInfo.specialty,
          doctorAvatar: selectedDoctorInfo.avatar,
          status: "confirmed",
          scheduledAt: start.toISOString(),
          joinWindowStart: new Date(start.getTime()).toISOString(),
        }
        const existing = JSON.parse(localStorage.getItem(TELE_BOOKINGS_KEY) || "[]") as TeleBooking[]
        localStorage.setItem(TELE_BOOKINGS_KEY, JSON.stringify([booking, ...existing].slice(0, 20)))
        await addNotification({
          title: "Teleconsultation booked",
          body: `Your call with ${selectedDoctorInfo.name} is booked. Join will open 1 minute before time.`,
          channel: "consult",
          cta: { label: "Join Call", route: `/teleconsultation/overview/${booking.id}` },
          joinWindowStart: booking.joinWindowStart,
          teleconsultSessionId: booking.sessionId,
          doctorId: booking.doctorId,
          scheduledAt: booking.scheduledAt,
        })
      } catch {
        // Session can still be created during the call bootstrap path.
      } finally {
        setIsBookingNow(false)
      }
      if (booking) {
        navigate("/teleconsultation/confirm", { state: { booking } })
      } else {
        navigate("/bookings")
      }
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
    if (zegoUiRef.current) {
      try {
        zegoUiRef.current.destroy()
      } catch {
        // best effort
      }
      zegoUiRef.current = null
    }
    if (zegoContainerRef.current) {
      zegoContainerRef.current.innerHTML = ""
    }
    setUsingZegoTemplate(false)
    setUsingAgoraTemplate(false)
    setActiveRtc(null)
  }

  async function startZegoTemplateCall(rtc: TeleconsultRtcPayload) {
    const appId = Number(rtc.appId)
    if (!appId) {
      throw new Error("Invalid Zego credentials")
    }
    const serverSecret = import.meta.env.VITE_ZEGO_SERVER_SECRET as string | undefined
    const effectiveAppId = Number(import.meta.env.VITE_ZEGO_APP_ID || appId)
    if (!serverSecret || !effectiveAppId) {
      throw new Error("Zego credentials missing")
    }
    if (!zegoContainerRef.current) {
      await new Promise<void>((resolve) => window.setTimeout(resolve, 50))
    }
    if (!zegoContainerRef.current) {
      throw new Error("Call container not ready")
    }
    setUsingZegoTemplate(true)
    const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
      effectiveAppId,
      serverSecret,
      rtc.channelName,
      rtc.userId,
      "Astikan Employee",
    )
    const zp = ZegoUIKitPrebuilt.create(kitToken)
    zegoUiRef.current = zp
    zp.joinRoom({
      container: zegoContainerRef.current,
      scenario: { mode: ZegoUIKitPrebuilt.OneONoneCall },
      showPreJoinView: false,
      turnOnCameraWhenJoining: true,
      turnOnMicrophoneWhenJoining: true,
      maxUsers: 2,
      onLeaveRoom: () => {
        if (connectTimerRef.current) window.clearTimeout(connectTimerRef.current)
        if (callClockRef.current) window.clearInterval(callClockRef.current)
        connectTimerRef.current = null
        callClockRef.current = null
        setCallState("ended")
        setElapsedSeconds(0)
        setUsingZegoTemplate(false)
        setActiveRtc(null)
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
        const sessionId = teleconsultSessionId || (await ensureTeleconsultSession(selectedDoctorInfo.id))
        const joined = await joinTeleconsultSession(sessionId, {
          participantType: "employee",
          participantId: actors.employee.employeeUserId,
          preferredProvider: attempt === 0 ? preferredProvider ?? "zego" : undefined,
          forceFailover: attempt > 0 || preferredProvider === "agora",
          allowEarlyJoin: true,
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
      {effectiveStep !== "video" && (
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

      <section className={`tele-content app-content-slide ${effectiveStep === "video" ? "tele-content-call" : ""}`}>
        {effectiveStep === "options" && (
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
                      <img
                        src={doctor.avatar}
                        alt={doctor.name}
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.src = doctor.fallbackAvatar
                        }}
                      />
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
                {doctorLoading && (
                  <div className="doctor-loading">Loading more doctors...</div>
                )}
                <div ref={loadMoreRef} className="doctor-load-sentinel" />
              </div>
            </section>

            {/* Nearby clinic route removed per UX request */}
          </>
        )}

        {effectiveStep === "video" && selectedDoctorInfo && (
          <section className={`video-stage tele-call-stage app-fade-stagger ${usingZegoTemplate || usingAgoraTemplate ? "video-stage-template" : ""}`}>
            {!joinReady && (
              <div className="tele-wait-card">
                <div className="tele-wait-icon"><FiClock /></div>
                <div className="tele-wait-copy">
                  <h3>Teleconsultation booked</h3>
                  <p>Join opens at {joinWindowLabel ?? "the scheduled time"}.</p>
                </div>
                <button className="app-pressable" type="button" onClick={() => navigate("/bookings")}>
                  Go to Bookings
                </button>
              </div>
            )}

            {joinReady && callState === "ready" && !usingZegoTemplate && !usingAgoraTemplate && (
              <div className="tele-wait-card">
                <div className="tele-wait-icon"><FiVideo /></div>
                <div className="tele-wait-copy">
                  <h3>Consultation room ready</h3>
                  <p>Tap below to join your doctor in the video room.</p>
                </div>
                <button
                  className="app-pressable"
                  type="button"
                  disabled={usingZegoTemplate || usingAgoraTemplate}
                  onClick={() => {
                    if (callState !== "ready") return
                    void bootstrapZegoTemplateCall(forceAgora ? "agora" : undefined)
                  }}
                >
                  Join Call
                </button>
              </div>
            )}

            {joinReady && (
              <>
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
              ) : usingZegoTemplate ? (
                <div className="zego-template-shell zego-uikit-shell">
                  <div ref={zegoContainerRef} className="zego-uikit-container" />
                </div>
              ) : (
                <div className="zego-template-shell zego-express-shell">
                  <div className="video-screen remote">
                    <div className="video-placeholder">
                      <span>Call preview will appear here.</span>
                    </div>
                    <div className="video-screen-overlay" />
                  </div>
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
              </>
            )}
          </section>
        )}

        {effectiveStep === "ride" && (
          <section className="ride-stage app-fade-stagger">
            <h3>OPD Ride Tracking</h3>
            <p>{rideDoctor.name} is booked. Live ride updates below.</p>

            <article className="ride-map">
              <iframe
                title="Ride live map"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src="https://maps.google.com/maps?q=28.6139,77.2090%20to%2028.6304,77.2177&z=12&output=embed"
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

      {effectiveStep === "options" && (
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
                    Processing booking...
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

      {effectiveStep === "ride" && rideBanner === "booked" && (
        <div className="booked-toast app-page-enter" role="status">
          <FiCheckCircle /> Appointment booked.
        </div>
      )}

      {effectiveStep === "ride" && rideBanner === "onway" && (
        <div className="booked-toast onway app-page-enter" role="status">
          <FiCheckCircle /> Your ride is on the way.
        </div>
      )}

      {effectiveStep === "ride" && rideBanner === "reached" && (
        <div className="booked-toast app-page-enter" role="status">
          <FiCheckCircle /> Arrived. Please proceed to doctor cabin.
        </div>
      )}
    </main>
  )
}
