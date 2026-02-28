import { useNavigate } from "react-router-dom"
import { FiCheckCircle } from "react-icons/fi"
import { useState, useEffect } from "react"

import Welcome from "./steps/Welcome"
import Height from "./steps/Height"
import Weight from "./steps/Weight"
import Waist from "./steps/Waist"
import Activity from "./steps/Activity"
import Workout from "./steps/Workout"
import Sleep from "./steps/Sleep"
import "./assessment.css"

const FINAL_STEP = 7

export default function HealthAssessment() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (step < FINAL_STEP) return

    const timer = window.setTimeout(() => {
      navigate("/home")
    }, 1800)

    return () => window.clearTimeout(timer)
  }, [step, navigate])

  function nextStep() {
    setStep((s) => s + 1)
  }

  switch (step) {
    case 0:
      return <Welcome onNext={nextStep} />
    case 1:
      return <Height onNext={nextStep} />
    case 2:
      return <Weight onNext={nextStep} />
    case 3:
      return <Waist onNext={nextStep} />
    case 4:
      return <Activity onNext={nextStep} />
    case 5:
      return <Workout onNext={nextStep} />
    case 6:
      return <Sleep onNext={nextStep} />
    default:
      return (
        <div className="assessment-screen completion-screen app-page-enter">
          <div className="completion-card app-fade-stagger">
            <div className="completion-icon-wrap">
              <FiCheckCircle className="completion-icon" />
            </div>

            <h1>Assessment Complete</h1>
            <p>
              Your baseline profile is ready. We are preparing your personalized health dashboard.
            </p>

            <div className="completion-progress">
              <span />
            </div>

            <small>Moving to Home automatically...</small>

            <button
              className="next-btn"
              onClick={() => navigate("/home")}
              type="button"
            >
              Continue Now
            </button>
          </div>
        </div>
      )
  }
}