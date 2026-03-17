import { useEffect, useMemo, useState } from "react"
import { FiArrowLeft, FiAward, FiClock, FiLink, FiTarget } from "react-icons/fi"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { getEmployeeAuthSession } from "../../services/authApi"
import { completeWeekendChallenge, fetchWeekendChallenges, type WeekendChallenge } from "../../services/challengesApi"
import "../../pages/WeekendTasks/weekendtasks.css"

type Task = {
  id: string
  title: string
  desc: string
  coins: number
  level: "Easy" | "Medium" | "Hard"
  type: "Physical" | "Mental" | "Health" | "Lifestyle"
  duration: string
  done?: boolean
}

export default function WeekendTaskDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { state } = useLocation() as { state?: { task?: Task } }
  const session = getEmployeeAuthSession()
  const [task, setTask] = useState<Task | null>(state?.task ?? null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    if (task || !session?.userId || !id) return
    ;(async () => {
      try {
        const data = await fetchWeekendChallenges(session.userId)
        if (!active) return
        const match = data.challenges.find((item) => item.id === id)
        if (match) {
          setTask({
            id: match.id,
            title: match.title,
            desc: match.description,
            coins: match.points,
            level: match.difficulty,
            type: match.category,
            duration: match.duration,
            done: match.completed,
          })
        }
      } catch (err) {
        if (!active) return
        setError(err instanceof Error ? err.message : "Unable to load challenge")
      }
    })()
    return () => {
      active = false
    }
  }, [id, session?.userId, task])

  const meta = useMemo(() => {
    if (!task) return null
    return [
      { label: "Points", value: `+${task.coins}` },
      { label: "Difficulty", value: task.level },
      { label: "Type", value: task.type },
      { label: "Duration", value: task.duration },
    ]
  }, [task])

  async function markComplete() {
    if (!session?.userId || !task || task.done) return
    setSaving(true)
    setError("")
    try {
      await completeWeekendChallenge(session.userId, task.id)
      setTask({ ...task, done: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to complete challenge")
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="weekend-page app-page-enter">
      <header className="weekend-header app-fade-stagger">
        <button className="weekend-back app-pressable" type="button" onClick={() => navigate(-1)} aria-label="Back">
          <FiArrowLeft />
        </button>
        <div className="weekend-title">
          <h1>Challenge Detail</h1>
          <p>Complete this to earn points</p>
        </div>
      </header>

      <section className="weekend-content app-content-slide">
        {!task && !error && <p>Loading challenge...</p>}
        {error && <p>{error}</p>}

        {task && (
          <>
            <article className="challenge-hero card-rise">
              <div className="challenge-icon">
                <FiAward />
              </div>
              <div>
                <h2>{task.title}</h2>
                <p>{task.desc}</p>
              </div>
            </article>

            <div className="challenge-meta">
              {meta?.map((item) => (
                <article key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </article>
              ))}
            </div>

            <article className="challenge-steps">
              <h3>How to complete</h3>
              <ul>
                <li>Follow the task guidance for today.</li>
                <li>Keep it consistent until you finish.</li>
                <li>Tap complete once done.</li>
              </ul>
            </article>

            {task.done ? (
              <div className="challenge-complete">
                <FiTarget />
                Completed! Points added to your weekend tally.
              </div>
            ) : (
              <button className="challenge-cta app-pressable" type="button" onClick={markComplete} disabled={saving}>
                <FiLink /> {saving ? "Marking..." : "Mark as complete"}
              </button>
            )}
          </>
        )}
      </section>
    </main>
  )
}
