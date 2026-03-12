import { type ReactNode } from "react"
import { FiArrowRight } from "react-icons/fi"
import "./assessment.css"

type Props = {
  step: number
  totalSteps: number
  children: ReactNode
  onNext?: () => void
  showNext?: boolean
}

export default function AssessmentLayout({
  step,
  totalSteps,
  children,
  onNext,
  showNext = true,
}: Props) {
  return (
    <div className="assessment-screen">
      <div className="progress-wrapper">
        <div
          className="progress-bar"
          style={{ width: `${(step / totalSteps) * 100}%` }}
        />
      </div>

      <div className="assessment-content">
        {children}
      </div>

      {showNext && (
        <div className="assessment-footer">
          <button
            className="next-btn"
            onClick={onNext}
            type="button"
          >
            <span>Continue</span>
            <FiArrowRight
              className="assessment-icon"
              aria-hidden="true"
            />
          </button>
        </div>
      )}
    </div>
  )
}
