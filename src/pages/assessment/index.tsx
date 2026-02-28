import { useState } from "react"
import Welcome from "./steps/Welcome"

const TOTAL_STEPS = 7

export default function HealthAssessment() {
  const [step, setStep] = useState(0)

  function nextStep() {
    setStep((s) => s + 1)
  }

  switch (step) {
    case 0:
      return <Welcome onNext={nextStep} />

    default:
      return <div>Next steps coming…</div>
  }
}