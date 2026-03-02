import { useEffect, useMemo, useState } from "react"
import {
  FiActivity,
  FiArrowUpRight,
  FiArrowLeft,
  FiDroplet,
  FiCheckCircle,
  FiHeart,
  FiMapPin,
  FiMic,
  FiMicOff,
  FiPhoneOff,
  FiShield,
  FiSearch,
  FiStar,
  FiVideo,
  FiVideoOff,
} from "react-icons/fi"
import type { ReactElement } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { goBackOrFallback } from "../../utils/navigation"
import "./teleconsultation.css"

type Doctor = {
  id: string
  name: string
  specialty: "Internal Medicine" | "Cardiology" | "Dermatology" | "Pulmonology"
  rating: number
  reviews: number
  distance: string
  eta: string
  fee: number
  avatar: string
}

type JourneyStep = "options" | "ride" | "video"
type ConsultMode = "tele" | "opd"
type CallState = "ready" | "connecting" | "live" | "ended"
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

const doctors: Doctor[] = [
  {
    id: "riza",
    name: "Dr. Riza Yuhi",
    specialty: "Internal Medicine",
    rating: 4.9,
    reviews: 85,
    distance: "2.5 km away",
    eta: "15 mins",
    fee: 25,
    avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=160&q=80",
  },
  {
    id: "sarah",
    name: "Dr. Sarah Chen",
    specialty: "Cardiology",
    rating: 4.8,
    reviews: 85,
    distance: "3.2 km away",
    eta: "20 mins",
    fee: 35,
    avatar: "https://images.unsplash.com/photo-1594824475317-6f6d4f3a04c9?auto=format&fit=crop&w=160&q=80",
  },
  {
    id: "michael",
    name: "Dr. Michael Park",
    specialty: "Dermatology",
    rating: 4.7,
    reviews: 85,
    distance: "1.8 km away",
    eta: "12 mins",
    fee: 30,
    avatar: "https://images.unsplash.com/photo-1614436163996-25cee5f54290?auto=format&fit=crop&w=160&q=80",
  },
  {
    id: "aarav",
    name: "Dr. Aarav Patel",
    specialty: "Pulmonology",
    rating: 4.8,
    reviews: 85,
    distance: "2.9 km away",
    eta: "18 mins",
    fee: 32,
    avatar: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=160&q=80",
  },
]

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
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)
  const [showDoctors, setShowDoctors] = useState(false)

  const selectedDoctorInfo = doctors.find((doctor) => doctor.id === selectedDoctor) ?? null

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

  function continueJourney() {
    if (!selectedDoctorInfo) return
    if (mode === "tele") {
      setStep("video")
      setCallState("ready")
      return
    }
    navigate("/teleconsultation/pickup", { state: { doctor: selectedDoctorInfo, analysisQuery, selectedSymptoms } })
  }

  function startVideoCall() {
    if (!selectedDoctorInfo || callState === "connecting") return
    setCallState("connecting")
    window.setTimeout(() => setCallState("live"), 1400)
  }

  function endVideoCall() {
    setCallState("ended")
  }

  return (
    <main className="tele-page app-page-enter">
      <header className="tele-header app-fade-stagger">
        <button className="tele-back app-pressable" onClick={() => goBackOrFallback(navigate)} type="button" aria-label="Back">
          <FiArrowLeft />
        </button>
        <div>
          <h1>Book Appointment</h1>
          <p>Choose consultation type and get matched doctors</p>
        </div>
      </header>

      <section className="tele-content app-content-slide">
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
          <section className="video-stage app-fade-stagger">
            <div className="video-top">
              <h3>Online Video Consultation</h3>
              <p>{selectedDoctorInfo.name} • {selectedDoctorInfo.specialty}</p>
            </div>

            <div className="video-screen remote">
              {callState === "ready" && <span>Ready to connect with doctor</span>}
              {callState === "connecting" && <span>Connecting call...</span>}
              {callState === "live" && <span>Dr. {selectedDoctorInfo.name.split(" ")[1]} is live</span>}
              {callState === "ended" && <span>Call ended</span>}
            </div>
            <div className="video-screen local">
              <span>{camOn ? "Your camera preview" : "Camera off"}</span>
            </div>

            <div className="video-controls">
              <button type="button" className="app-pressable" onClick={() => setMicOn((prev) => !prev)}>
                {micOn ? <FiMic /> : <FiMicOff />}
              </button>
              <button type="button" className="app-pressable" onClick={() => setCamOn((prev) => !prev)}>
                {camOn ? <FiVideo /> : <FiVideoOff />}
              </button>
              {callState !== "live" && callState !== "connecting" && (
                <button type="button" className="start-call app-pressable" onClick={startVideoCall}>Start Call</button>
              )}
              {(callState === "live" || callState === "connecting") && (
                <button type="button" className="end-call app-pressable" onClick={endVideoCall}>
                  <FiPhoneOff />
                </button>
              )}
            </div>
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
              <button className="book-btn app-pressable" type="button" onClick={continueJourney}>
                Book Now
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
