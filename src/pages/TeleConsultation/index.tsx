import { useMemo, useState } from "react"
import type { IconType } from "react-icons"
import {
  FiActivity,
  FiArrowLeft,
  FiCheckCircle,
  FiClock,
  FiHeart,
  FiLoader,
  FiMapPin,
  FiMic,
  FiMicOff,
  FiPhoneOff,
  FiRefreshCw,
  FiSearch,
  FiStar,
  FiUser,
  FiVideo,
  FiVideoOff,
} from "react-icons/fi"
import { useNavigate } from "react-router-dom"
import "./teleconsultation.css"

type Symptom = {
  id: string
  label: string
  icon: IconType
}

type Doctor = {
  id: string
  name: string
  specialty: "Internal Medicine" | "Cardiology" | "Dermatology" | "Pulmonology"
  rating: number
  distance: string
  eta: string
  fee: number
}

type JourneyStep = "analyze" | "options" | "ride" | "video"
type ConsultMode = "tele" | "opd"
type CallState = "ready" | "connecting" | "live" | "ended"

const symptoms: Symptom[] = [
  { id: "fever", label: "Fever", icon: FiActivity },
  { id: "headache", label: "Headache", icon: FiHeart },
  { id: "cold", label: "Cold", icon: FiRefreshCw },
  { id: "chest-pain", label: "Chest Pain", icon: FiHeart },
  { id: "dizziness", label: "Dizziness", icon: FiRefreshCw },
  { id: "fatigue", label: "Fatigue", icon: FiActivity },
  { id: "nausea", label: "Nausea", icon: FiLoader },
  { id: "breathing", label: "Breathing", icon: FiActivity },
  { id: "skin", label: "Skin", icon: FiUser },
]

const doctors: Doctor[] = [
  { id: "riza", name: "Dr. Riza Yuhi", specialty: "Internal Medicine", rating: 4.9, distance: "2.5 km away", eta: "15 mins", fee: 25 },
  { id: "sarah", name: "Dr. Sarah Chen", specialty: "Cardiology", rating: 4.8, distance: "3.2 km away", eta: "20 mins", fee: 35 },
  { id: "michael", name: "Dr. Michael Park", specialty: "Dermatology", rating: 4.7, distance: "1.8 km away", eta: "12 mins", fee: 30 },
  { id: "aarav", name: "Dr. Aarav Patel", specialty: "Pulmonology", rating: 4.8, distance: "2.9 km away", eta: "18 mins", fee: 32 },
]

const symptomSpecialtyMap: Record<string, Doctor["specialty"]> = {
  fever: "Internal Medicine",
  headache: "Internal Medicine",
  cold: "Internal Medicine",
  "chest-pain": "Cardiology",
  dizziness: "Internal Medicine",
  fatigue: "Internal Medicine",
  nausea: "Internal Medicine",
  breathing: "Pulmonology",
  skin: "Dermatology",
}

function inferSpecialtyFromText(text: string): Doctor["specialty"] | null {
  const q = text.trim().toLowerCase()
  if (!q) return null
  if (q.includes("chest") || q.includes("heart")) return "Cardiology"
  if (q.includes("skin") || q.includes("rash") || q.includes("itch")) return "Dermatology"
  if (q.includes("breath") || q.includes("cough")) return "Pulmonology"
  return "Internal Medicine"
}

export default function TeleConsultation() {
  const navigate = useNavigate()
  const [step, setStep] = useState<JourneyStep>("analyze")
  const [query, setQuery] = useState("")
  const [analysisQuery, setAnalysisQuery] = useState("")
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([])
  const [activeSpecialty, setActiveSpecialty] = useState<Doctor["specialty"] | "All Specialties">("All Specialties")
  const [mode, setMode] = useState<ConsultMode>("tele")
  const [selectedDoctor, setSelectedDoctor] = useState("")
  const [ridePhase, setRidePhase] = useState(0)
  const [callState, setCallState] = useState<CallState>("ready")
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)

  const selectedDoctorInfo = doctors.find((doctor) => doctor.id === selectedDoctor) ?? null

  const specialtyFilters = useMemo(() => {
    const unique = Array.from(new Set(doctors.map((doctor) => doctor.specialty)))
    return ["All Specialties", ...unique] as const
  }, [])

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

  function toggleSymptom(id: string, label: string) {
    setSelectedSymptoms((prev) => {
      if (prev.includes(id)) return prev.filter((item) => item !== id)
      return [...prev, id]
    })
    setAnalysisQuery(label)
  }

  function runAnalysis() {
    const byChip = selectedSymptoms.length > 0 ? symptomSpecialtyMap[selectedSymptoms[0]] : null
    const byText = inferSpecialtyFromText(analysisQuery)
    setActiveSpecialty(byChip ?? byText ?? "All Specialties")
    setStep("options")
  }

  function continueJourney() {
    if (!selectedDoctorInfo) return
    if (mode === "tele") {
      setStep("video")
      setCallState("ready")
      return
    }
    setStep("ride")
    setRidePhase(0)
  }

  function startVideoCall() {
    if (!selectedDoctorInfo || callState === "connecting") return
    setCallState("connecting")
    window.setTimeout(() => setCallState("live"), 1400)
  }

  function endVideoCall() {
    setCallState("ended")
  }

  function advanceRide() {
    setRidePhase((prev) => Math.min(prev + 1, rideSteps.length - 1))
  }

  return (
    <main className="tele-page app-page-enter">
      <header className="tele-header app-fade-stagger">
        <button className="tele-back app-pressable" onClick={() => navigate("/home")} type="button" aria-label="Back">
          <FiArrowLeft />
        </button>
        <div>
          <h1>Teleconsultation / OPD</h1>
          <p>Analyze symptoms, choose doctor, start visit</p>
        </div>
      </header>

      <section className="tele-content app-content-slide">
        {step === "analyze" && (
          <section className="symptom-panel app-fade-stagger">
            <h2>AI-Powered Symptom Analysis</h2>
            <p>Step 1: Describe symptoms to get matched doctors</p>
            <div className="analysis-row">
              <input
                type="text"
                value={analysisQuery}
                onChange={(e) => setAnalysisQuery(e.target.value)}
                placeholder="E.g., fever, chest pain, breathing issue..."
              />
              <button className="analyze-btn app-pressable" type="button" onClick={runAnalysis}>Analyze</button>
            </div>

            <h3>Select common symptoms</h3>
            <div className="symptom-grid">
              {symptoms.map((item) => {
                const Icon = item.icon
                const selected = selectedSymptoms.includes(item.id)
                return (
                  <button
                    key={item.id}
                    className={`symptom-chip app-pressable ${selected ? "active" : ""}`}
                    onClick={() => toggleSymptom(item.id, item.label)}
                    type="button"
                  >
                    <Icon />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </div>
          </section>
        )}

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
                <p>Online video call in 15 mins</p>
              </button>

              <button
                type="button"
                className={`mode-card app-pressable ${mode === "opd" ? "active" : ""}`}
                onClick={() => setMode("opd")}
              >
                <FiMapPin />
                <h3>OPD Visit</h3>
                <p>Ride pickup + hospital drop</p>
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
                  {specialty}
                </button>
              ))}
            </section>

            <section className="doctor-section app-fade-stagger">
              <h3>Doctors for your symptoms</h3>
              <div className="doctor-list">
                {visibleDoctors.map((doctor) => (
                  <button
                    key={doctor.id}
                    className={`doctor-card app-pressable ${selectedDoctor === doctor.id ? "selected" : ""}`}
                    onClick={() => setSelectedDoctor(doctor.id)}
                    type="button"
                  >
                    <div className="doctor-avatar"><FiUser /></div>
                    <div className="doctor-main">
                      <h4>{doctor.name}</h4>
                      <p>{doctor.specialty}</p>
                      <div className="doctor-meta">
                        <span><FiStar /> {doctor.rating.toFixed(1)}</span>
                        <span><FiMapPin /> {doctor.distance}</span>
                      </div>
                    </div>
                    <div className="doctor-time">
                      <p>{mode === "tele" ? "Call in" : "Visit in"}</p>
                      <strong>{doctor.eta}</strong>
                    </div>
                  </button>
                ))}
              </div>
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
            <p>{selectedDoctorInfo.name} is booked. Ride updates below.</p>

            <article className="ride-map">
              <div className="ride-pin user">You</div>
              <div className="ride-route" />
              <div className="ride-pin clinic">OPD</div>
            </article>

            <article className="ride-status">
              <span>{ridePhase + 1}/3</span>
              <strong>{rideSteps[ridePhase]}</strong>
            </article>

            <button type="button" className="ride-next app-pressable" onClick={advanceRide} disabled={ridePhase === rideSteps.length - 1}>
              {ridePhase === rideSteps.length - 1 ? "Reached OPD" : "Update Ride Status"}
            </button>
          </section>
        )}
      </section>

      {(step === "analyze" || step === "options") && (
        <footer className="tele-footer app-fade-stagger">
          {step === "analyze" && (
            <button className="book-btn app-pressable" type="button" onClick={runAnalysis}>
              Continue to Consultation Options
            </button>
          )}

          {step === "options" && (
            <button className="book-btn app-pressable" type="button" disabled={!selectedDoctorInfo} onClick={continueJourney}>
              {mode === "tele" ? "Start Teleconsultation Journey" : "Book OPD with Ride"}
            </button>
          )}
        </footer>
      )}

      {step === "ride" && ridePhase === 2 && (
        <div className="booked-toast app-page-enter" role="status">
          <FiCheckCircle /> Arrived. Please proceed to doctor cabin.
        </div>
      )}
    </main>
  )
}

