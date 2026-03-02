import AssessmentLayout from "../layout"
import { FiActivity, FiBriefcase, FiSun, FiZap } from "react-icons/fi"
import type { ReactElement } from "react"

type Props = {
  onNext: () => void
}

const activityOptions = [
  {
    key: "desk",
    title: "Mostly desk work",
    desc: "Sitting for most of the day",
    icon: <FiBriefcase />,
  },
  {
    key: "mixed",
    title: "Mixed activity",
    desc: "Some walking and some desk work",
    icon: <FiActivity />,
  },
  {
    key: "active",
    title: "Physically active",
    desc: "Standing, walking, or moving often",
    icon: <FiZap />,
  },
  {
    key: "very-active",
    title: "Very active",
    desc: "Frequent movement and high-energy days",
    icon: <FiSun />,
  },
] as Array<{ key: string; title: string; desc: string; icon: ReactElement }>

export default function Activity({ onNext }: Props) {
  return (
    <AssessmentLayout step={5} totalSteps={7} showNext={false}>
      <div className="step-container animate-in">
        <h1>How active is your day?</h1>
        <p>This helps us estimate your daily energy and recovery needs</p>

        <div className="option-list activity-options-grid">
          {activityOptions.map((item) => (
            <button key={item.key} className="option-card activity-option-card app-pressable" onClick={onNext} type="button">
              <span className="activity-option-icon">{item.icon}</span>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </AssessmentLayout>
  )
}
