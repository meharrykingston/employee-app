import { useMemo, useState } from "react"
import { FiArrowLeft, FiClock, FiLink, FiTarget } from "react-icons/fi"
import { useNavigate } from "react-router-dom"
import { goBackOrFallback } from "../../utils/navigation"
import "./weekendtasks.css"

type Task = {
  id: string
  title: string
  desc: string
  coins: number
  level: "Easy" | "Medium" | "Hard"
  type: "Physical" | "Mental" | "Health"
  duration: string
  done?: boolean
}

const allTasks: Task[] = [
  { id: "walk", title: "30-Minute Morning Walk", desc: "Start your weekend fresh with a morning walk in nature", coins: 150, level: "Easy", type: "Physical", duration: "30 min" },
  { id: "meditation", title: "Mindfulness Meditation", desc: "Practice 20 minutes of guided meditation", coins: 200, level: "Medium", type: "Mental", duration: "20 min" },
  { id: "meal-prep", title: "Healthy Meal Prep", desc: "Prepare nutritious meals for the week ahead", coins: 250, level: "Medium", type: "Health", duration: "1 hour", done: true },
  { id: "yoga", title: "Yoga Session", desc: "Complete a full body yoga routine", coins: 180, level: "Medium", type: "Physical", duration: "45 min" },
  { id: "journal", title: "Journaling Practice", desc: "Reflect on your week and set intentions", coins: 120, level: "Easy", type: "Mental", duration: "15 min", done: true },
  { id: "hydration", title: "Hydration Challenge", desc: "Drink 8 glasses of water today", coins: 100, level: "Easy", type: "Health", duration: "All day" },
  { id: "detox", title: "Digital Detox Hour", desc: "Spend 1 hour completely offline", coins: 150, level: "Hard", type: "Mental", duration: "1 hour" },
  { id: "steps", title: "10,000 Steps Goal", desc: "Reach your daily step goal", coins: 200, level: "Medium", type: "Physical", duration: "All day" },
]

export default function WeekendTasks() {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState<Task[]>(allTasks)

  const completed = useMemo(() => tasks.filter((task) => task.done).length, [tasks])
  const earned = useMemo(() => tasks.filter((task) => task.done).reduce((sum, task) => sum + task.coins, 0), [tasks])
  const remaining = useMemo(() => tasks.filter((task) => !task.done).reduce((sum, task) => sum + task.coins, 0), [tasks])

  function toggleTask(id: string) {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, done: !task.done } : task)),
    )
  }

  return (
    <main className="weekend-page app-page-enter">
      <header className="weekend-header app-fade-stagger">
        <button className="weekend-back app-pressable" type="button" onClick={() => goBackOrFallback(navigate)} aria-label="Back">
          <FiArrowLeft />
        </button>
        <div className="weekend-title">
          <h1>Weekend Challenges</h1>
          <p>Complete tasks, earn coins, stay healthy</p>
        </div>
      </header>

      <section className="weekend-content app-content-slide">
        <article className="progress-card app-fade-stagger">
          <div className="progress-head">
            <div className="progress-icon"><FiTarget /></div>
            <div>
              <p>Weekend Progress</p>
              <h2>{completed} / {tasks.length} Tasks</h2>
            </div>
            <span className="trophy">🏆</span>
          </div>
          <div className="progress-track">
            <span style={{ width: `${(completed / tasks.length) * 100}%` }} />
          </div>

          <div className="progress-metrics">
            <article><span>Earned</span><strong>{earned}</strong></article>
            <article><span>Remaining</span><strong>{remaining}</strong></article>
            <article><span>Streak</span><strong>3 weeks</strong></article>
          </div>
        </article>

        <section className="tasks-list app-fade-stagger">
          <h3>Your Tasks</h3>
          {tasks.map((task) => (
            <button
              key={task.id}
              className={`task-card app-pressable ${task.done ? "done" : ""}`}
              type="button"
              onClick={() => toggleTask(task.id)}
            >
              <span className={`task-check ${task.done ? "active" : ""}`}>{task.done ? "✓" : ""}</span>
              <div className="task-main">
                <div className="task-title">
                  <h4>{task.title}</h4>
                  <strong><FiLink /> +{task.coins}</strong>
                </div>
                <p>{task.desc}</p>
                <div className="task-tags">
                  <span className={`lvl ${task.level.toLowerCase()}`}>{task.level}</span>
                  <span className={`kind ${task.type.toLowerCase()}`}>{task.type}</span>
                  <span className="time"><FiClock /> {task.duration}</span>
                </div>
              </div>
            </button>
          ))}
        </section>

        <article className="bonus-card app-fade-stagger">
          <h4>Weekend Bonus Challenge</h4>
          <p>Complete all 8 tasks this weekend to earn a special bonus!</p>
          <div className="bonus-tags">
            <span>+1000 Bonus Coins</span>
            <span>Limited Time</span>
          </div>
          <i>🏆</i>
        </article>
      </section>
    </main>
  )
}
