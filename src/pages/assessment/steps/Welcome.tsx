import AssessmentLayout from "../layout"

type Props = {
  onNext: () => void
}

export default function Welcome({ onNext }: Props) {
  return (
    <AssessmentLayout
      step={1}
      totalSteps={7}
      onNext={onNext}
    >
      <div className="welcome-step animate-in">
        <div className="pulse-circle"></div>

        <h1>Let’s understand your health</h1>
        <p>
          This takes about 2 minutes and helps us personalise your
          health insights.
        </p>
      </div>
    </AssessmentLayout>
  )
}