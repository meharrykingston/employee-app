import { useState } from "react"
import AssessmentLayout from "../layout"

type Props = {
  onNext: () => void
}

export default function Waist({ onNext }: Props) {
  const [waist, setWaist] = useState(80)

  return (
    <AssessmentLayout
      step={4}
      totalSteps={7}
      onNext={onNext}
    >
      <div className="step-container animate-in">
        <h1>Your waist size</h1>
        <p>This helps us understand metabolic health</p>

        <div className="value-display">
          <span className="value">{waist}</span>
          <span className="unit">cm</span>
        </div>

        <input
          type="range"
          min={50}
          max={150}
          value={waist}
          onChange={(e) => setWaist(Number(e.target.value))}
          className="slider"
        />

        <p className="helper">
          Measure around your belly button
        </p>
      </div>
    </AssessmentLayout>
  )
}