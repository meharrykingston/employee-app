import { useEffect, useMemo, useRef, useState } from "react"
import { FiActivity, FiCheckCircle, FiDroplet, FiHeart, FiLock, FiMoon, FiSmile, FiThermometer } from "react-icons/fi"
import { useNavigate, useParams } from "react-router-dom"
import { healthTips } from "../../data/healthTips"
import { logBehaviorSignal } from "../../services/behaviorApi"
import "./tipblog.css"

const AI_THREAD_KEY = "employee_ai_thread_id"
const AI_MESSAGE_PREFIX = "employee_ai_thread_messages:"
const DAILY_TIP_STORAGE_KEY = "daily_tip_map"

const moodOptionMap: Record<string, string[]> = {
  stress: ["I feel anxious", "I feel overwhelmed", "I feel okay"],
  dizzy: ["Lightheaded", "Unsteady", "Okay now"],
  sleep: ["Restless", "Woke often", "Slept fine"],
  fatigue: ["Low energy", "Heavy body", "Normal"],
}

function getMoodHint() {
  const threadId = localStorage.getItem(AI_THREAD_KEY)
  if (!threadId) return ""
  const raw = localStorage.getItem(`${AI_MESSAGE_PREFIX}${threadId}`)
  if (!raw) return ""
  try {
    const parsed = JSON.parse(raw) as Array<{ from: string; text: string }>
    const lastUser = [...parsed].reverse().find((item) => item.from === "user")
    if (!lastUser?.text) return ""
    const text = lastUser.text.toLowerCase()
    if (/(stress|anxious|panic|overwhelm|tension)/.test(text)) return "stress"
    if (/(dizz|vertigo|faint|lightheaded)/.test(text)) return "dizzy"
    if (/(sleep|insomnia|tired|night)/.test(text)) return "sleep"
    if (/(fatigue|low energy|weak|drained)/.test(text)) return "fatigue"
    return ""
  } catch {
    return ""
  }
}

export default function TipBlog() {
  const navigate = useNavigate()
  const { tipId } = useParams()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const lastScrollTop = useRef(0)
  const [unlockedIndex, setUnlockedIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [speedWarning, setSpeedWarning] = useState(false)

  const tip = useMemo(() => {
    if (tipId?.startsWith("daily-")) {
      try {
        const raw = localStorage.getItem(DAILY_TIP_STORAGE_KEY)
        if (!raw) return undefined
        const tips = JSON.parse(raw) as Array<{
          id: string
          title: string
          summary: string
          tags: string[]
          moodTags: string[]
          heroImage: string
          iconKey?: string
          sections: Array<{
            heading: string
            body: string
            coach: string
            question: { id: string; text: string; options: string[] }
          }>
        }>
        const found = tips.find((item) => item.id === tipId)
        if (!found) return undefined
        const icon = found.iconKey === "droplet"
          ? <FiDroplet />
          : found.iconKey === "moon"
            ? <FiMoon />
            : found.iconKey === "smile"
              ? <FiSmile />
              : found.iconKey === "heart"
                ? <FiHeart />
                : found.iconKey === "thermo"
                  ? <FiThermometer />
                  : <FiActivity />
        return { ...found, icon }
      } catch {
        return undefined
      }
    }
    return healthTips.find((item) => item.id === tipId)
  }, [tipId])
  const moodHint = useMemo(() => getMoodHint(), [])
  const moodOptions = moodOptionMap[moodHint] ?? []

  useEffect(() => {
    if (!tip) return
    const safeTip = tip
    void logBehaviorSignal({
      type: "tip_view",
      label: safeTip.title,
      tags: safeTip.tags,
      meta: { tipId: safeTip.id },
    })
  }, [tip])

  useEffect(() => {
    const node = containerRef.current
    if (!node) return

    const onScroll = () => {
      const current = node.scrollTop
      const delta = current - lastScrollTop.current
      const clamped = Math.sign(delta) * Math.min(26, Math.abs(delta))
      if (Math.abs(delta) > 60) {
        setSpeedWarning(true)
        void logBehaviorSignal({
          type: "tip_scroll_fast",
          meta: { tipId, delta },
        })
      }
      node.scrollTop = lastScrollTop.current + clamped
      lastScrollTop.current = node.scrollTop
      window.setTimeout(() => setSpeedWarning(false), 600)
    }

    node.addEventListener("scroll", onScroll, { passive: false })
    return () => node.removeEventListener("scroll", onScroll)
  }, [tipId])

  if (!tip) {
    return (
      <main className="tip-blog-page app-page-enter">
        <header className="tip-blog-header">
          <button className="tip-back app-pressable" onClick={() => navigate(-1)} type="button">&lt;</button>
          <h1>Health Tip</h1>
        </header>
        <section className="tip-blog-shell">
          <p>Tip not found.</p>
        </section>
      </main>
    )
  }

  function handleAnswer(sectionIndex: number, answer: string) {
    if (!tip) return
    const safeTip = tip
    setAnswers((prev) => ({ ...prev, [sectionIndex]: answer }))
    void logBehaviorSignal({
      type: "tip_answer",
      label: safeTip.title,
      tags: safeTip.tags,
      meta: { tipId: safeTip.id, sectionIndex, answer },
    })
    setUnlockedIndex((prev) => Math.max(prev, sectionIndex + 1))
    window.setTimeout(() => {
      const node = containerRef.current
      if (!node) return
      const next = node.querySelector(`[data-section="${sectionIndex + 1}"]`) as HTMLElement | null
      if (next) next.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 250)
  }

  return (
    <main className="tip-blog-page app-page-enter">
      <header className="tip-blog-header">
        <button className="tip-back app-pressable" onClick={() => navigate(-1)} type="button">&lt;</button>
        <h1>Daily Health Tip</h1>
      </header>

      <section className="tip-blog-shell" ref={containerRef}>
        <div className="tip-hero">
          <img src={tip.heroImage} alt={tip.title} />
          <div className="tip-hero-copy">
            <span className="tip-pill">{tip.tags[0]}</span>
            <h2>{tip.title}</h2>
            <p>{tip.summary}</p>
          </div>
        </div>

        {speedWarning && <div className="tip-speed">Slow down, take it in.</div>}

        <div className="tip-section-list">
          {tip.sections.map((section, index) => {
            const locked = index > unlockedIndex
            const answered = answers[index]
            const options = moodOptions.length > 0 && index === 0
              ? [moodOptions[0], ...section.question.options.slice(0, 2)]
              : section.question.options

            return (
              <article
                key={section.heading}
                className={`tip-section ${locked ? "locked" : ""}`}
                data-section={index}
              >
                <div className="tip-section-head">
                  <h3>{section.heading}</h3>
                  {locked && (
                    <span className="tip-lock">
                      <FiLock /> Locked
                    </span>
                  )}
                </div>
                <p>{section.body}</p>

                <div className="tip-coach">
                  <span className="tip-coach-label">Astikan AI</span>
                  <p>{section.coach}</p>
                </div>

                <div className="tip-question">
                  <p>{section.question.text}</p>
                  <div className="tip-options">
                    {options.map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={`tip-option app-pressable ${answered === option ? "active" : ""}`}
                        onClick={() => handleAnswer(index, option)}
                        disabled={locked}
                      >
                        {answered === option && <FiCheckCircle />}
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </main>
  )
}
