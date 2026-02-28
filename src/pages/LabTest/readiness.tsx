import { useState } from "react"
import { FiArrowLeft } from "react-icons/fi"
import { useLocation, useNavigate } from "react-router-dom"
import "./labtest.css"

type LabTestItem = {
  id: string
  color: "red" | "blue" | "gray" | "green" | "outline"
  name: string
  desc: string
  tag: string
  duration: string
  fasting: string
  quick?: string
}

type ReadinessState = {
  feelingWell: "yes" | "no" | null
  eatenLastHours: "yes" | "no" | null
}

export default function LabReadinessStep() {
  const navigate = useNavigate()
  const { state } = useLocation() as { state?: { selectedTest?: LabTestItem } }
  const selectedTest = state?.selectedTest
  const [slide, setSlide] = useState(0)
  const [answers, setAnswers] = useState<ReadinessState>({
    feelingWell: null,
    eatenLastHours: null,
  })

  function setAnswer(key: keyof ReadinessState, value: "yes" | "no") {
    setAnswers((prev) => ({ ...prev, [key]: value }))
  }

  function next() {
    if (slide === 0) {
      setSlide(1)
      return
    }
    navigate("/lab-tests/location", {
      state: {
        selectedTest,
        readiness: answers,
      },
    })
  }

  const canContinue = slide === 0 ? answers.feelingWell !== null : answers.eatenLastHours !== null

  return (
    <div className="lab-page readiness-page">
      <div className="lab-header">
        <button className="lab-back" onClick={() => (slide === 0 ? navigate(-1) : setSlide(0))} type="button" aria-label="Back">
          <FiArrowLeft />
        </button>
        <div>
          <h1>Lab Test Booking</h1>
          <p>Quick check before we continue</p>
        </div>
      </div>

      <div className="lab-steps">
        <div className="step done">1. Tests</div>
        <span>-</span>
        <div className="step active">Readiness</div>
        <span>-</span>
        <div className="step pending">2. Location</div>
        <span>-</span>
        <div className="step pending">3. Schedule</div>
      </div>

      <section className="readiness-wrap">
        <p className="readiness-top-note">Just to help your test go smoothly</p>

        <div className={`readiness-slider slide-${slide}`}>
          <article className="readiness-slide">
            <h2>Are you feeling well today?</h2>
            <p>This helps us plan your collection experience better.</p>
            <div className="choice-row">
              <button
                type="button"
                className={`choice-btn ${answers.feelingWell === "yes" ? "active" : ""}`}
                onClick={() => setAnswer("feelingWell", "yes")}
              >
                Yes
              </button>
              <button
                type="button"
                className={`choice-btn ${answers.feelingWell === "no" ? "active" : ""}`}
                onClick={() => setAnswer("feelingWell", "no")}
              >
                No
              </button>
            </div>
          </article>

          <article className="readiness-slide">
            <h2>Have you eaten in the last 8-12 hours?</h2>
            <p>Useful for fasting-related test preparation.</p>
            <div className="choice-row">
              <button
                type="button"
                className={`choice-btn ${answers.eatenLastHours === "yes" ? "active" : ""}`}
                onClick={() => setAnswer("eatenLastHours", "yes")}
              >
                Yes
              </button>
              <button
                type="button"
                className={`choice-btn ${answers.eatenLastHours === "no" ? "active" : ""}`}
                onClick={() => setAnswer("eatenLastHours", "no")}
              >
                No
              </button>
            </div>
          </article>
        </div>
      </section>

      <div className="bottom-buttons single">
        <button className="btn-primary" type="button" onClick={next} disabled={!canContinue}>
          {slide === 0 ? "Next" : "Continue to Location"}
        </button>
      </div>
    </div>
  )
}

