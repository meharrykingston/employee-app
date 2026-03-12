import { useState, type CSSProperties } from "react"
import { FiMinus, FiPlus } from "react-icons/fi"
import AssessmentLayout from "../layout"
import { saveHealthMetrics } from "../../../services/healthMetricsApi"

type Props = {
  onNext: () => void
}

const MIN_WEIGHT = 35
const MAX_WEIGHT = 180

function clampWeight(value: number) {
  return Math.min(MAX_WEIGHT, Math.max(MIN_WEIGHT, value))
}

export default function Weight({ onNext }: Props) {
  const [weight, setWeight] = useState(70)
  const progress = ((weight - MIN_WEIGHT) / (MAX_WEIGHT - MIN_WEIGHT)) * 100

  const sliderStyle = {
    "--slider-fill": `${progress}%`,
  } as CSSProperties

  async function handleNext() {
    try {
      await saveHealthMetrics({ weightKg: weight })
    } finally {
      onNext()
    }
  }

  return (
    <AssessmentLayout step={3} totalSteps={4} onNext={handleNext}>
      <div className="step-container animate-in">
        <h1>What's your weight?</h1>
        <p>This helps us calculate your health baseline</p>

        <div className="value-display">
          <span className="value">{weight}</span>
          <span className="unit">kg</span>
        </div>

        <div className="slider-actions">
          <button className="slider-stepper app-pressable" type="button" onClick={() => setWeight((v) => clampWeight(v - 1))} aria-label="decrease weight">
            <FiMinus />
          </button>
          <input
            type="range"
            min={MIN_WEIGHT}
            max={MAX_WEIGHT}
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
            className="slider"
            style={sliderStyle}
          />
          <button className="slider-stepper app-pressable" type="button" onClick={() => setWeight((v) => clampWeight(v + 1))} aria-label="increase weight">
            <FiPlus />
          </button>
        </div>

        <div className="slider-scale" aria-hidden="true">
          <span>{MIN_WEIGHT} kg</span>
          <span>{MAX_WEIGHT} kg</span>
        </div>

        <p className="helper">This is only used for personalised insights</p>
      </div>
    </AssessmentLayout>
  )
}
