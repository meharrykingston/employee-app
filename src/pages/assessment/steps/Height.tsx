import { useState, type CSSProperties } from "react"
import { FiMinus, FiPlus } from "react-icons/fi"
import AssessmentLayout from "../layout"
import { saveHealthMetrics } from "../../../services/healthMetricsApi"

type Props = {
  onNext: () => void
}

const MIN_HEIGHT = 120
const MAX_HEIGHT = 220

function clampHeight(value: number) {
  return Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, value))
}

function cmToFeetInches(cm: number) {
  const totalInches = cm / 2.54
  const feet = Math.floor(totalInches / 12)
  const inches = Math.round(totalInches - feet * 12)
  return { feet, inches }
}

export default function Height({ onNext }: Props) {
  const [height, setHeight] = useState(170)
  const progress = ((height - MIN_HEIGHT) / (MAX_HEIGHT - MIN_HEIGHT)) * 100
  const heightFt = cmToFeetInches(height)

  const sliderStyle = {
    "--slider-fill": `${progress}%`,
  } as CSSProperties

  async function handleNext() {
    try {
      await saveHealthMetrics({ heightCm: height })
    } finally {
      onNext()
    }
  }

  return (
    <AssessmentLayout step={2} totalSteps={4} onNext={handleNext}>
      <div className="step-container animate-in">
        <h1>What's your height?</h1>
        <p>This helps us understand your body composition</p>

        <div className="value-display">
          <span className="value">
            {heightFt.feet}'{heightFt.inches}"
          </span>
          <span className="unit">ft in</span>
        </div>
        <p className="helper">({height} cm)</p>

        <div className="slider-actions">
          <button className="slider-stepper app-pressable" type="button" onClick={() => setHeight((v) => clampHeight(v - 1))} aria-label="decrease height">
            <FiMinus />
          </button>
          <input
            type="range"
            min={MIN_HEIGHT}
            max={MAX_HEIGHT}
            value={height}
            onChange={(e) => setHeight(Number(e.target.value))}
            className="slider"
            style={sliderStyle}
          />
          <button className="slider-stepper app-pressable" type="button" onClick={() => setHeight((v) => clampHeight(v + 1))} aria-label="increase height">
            <FiPlus />
          </button>
        </div>

        <div className="slider-scale" aria-hidden="true">
          <span>{MIN_HEIGHT} cm</span>
          <span>{MAX_HEIGHT} cm</span>
        </div>

        <p className="helper">You can adjust this anytime later</p>
      </div>
    </AssessmentLayout>
  )
}
