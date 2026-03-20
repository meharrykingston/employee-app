import { useEffect, useMemo, useRef, useState } from "react"
import { FiActivity, FiCheckCircle, FiDroplet, FiHeart, FiMoon, FiSmile, FiThermometer } from "react-icons/fi"
import { useNavigate, useParams } from "react-router-dom"
import { healthTips } from "../../data/healthTips"
import { logBehaviorSignal } from "../../services/behaviorApi"
import "./tipblog.css"

const AI_THREAD_KEY = "employee_ai_thread_id"
const AI_MESSAGE_PREFIX = "employee_ai_thread_messages:"
const DAILY_TIP_STORAGE_KEY = "daily_tip_map"
const DAILY_TIP_DATE_KEY = "daily_tip_date"

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

function seedFromString(input: string) {
  let hash = 0
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0
  }
  return hash || 1
}

function seededShuffle<T>(items: T[], seed: number) {
  const arr = [...items]
  let s = seed
  for (let i = arr.length - 1; i > 0; i -= 1) {
    s = (s * 1664525 + 1013904223) >>> 0
    const j = s % (i + 1)
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function ensureFiveSections(sections: Array<{ heading: string; body: string; coach: string; question: { id: string; text: string; options: string[] } }>) {
  if (sections.length >= 5) return sections.slice(0, 5)
  const expanded = [...sections]
  while (expanded.length < 5) {
    const base = expanded[expanded.length - 1] ?? sections[0]
    expanded.push({
      heading: `${base.heading} • Next`,
      body: base.body,
      coach: base.coach,
      question: {
        id: `${base.question.id}-${expanded.length + 1}`,
        text: base.question.text,
        options: base.question.options,
      },
    })
  }
  return expanded
}

function buildQuestionIndices(total: number, seed: number) {
  const indices = Array.from({ length: total }, (_, idx) => idx)
  const shuffled = seededShuffle(indices, seed)
  const count = total <= 3 ? 1 : 2
  return new Set(shuffled.slice(1, 1 + count))
}

function buildOptions(base: string[], seed: number) {
  const fallbacks = ["Yes", "No", "I don’t know"]
  const merged = Array.from(new Set([...base, ...fallbacks]))
  return seededShuffle(merged, seed).slice(0, Math.min(4, merged.length))
}

export default function TipBlog() {
  const navigate = useNavigate()
  const { tipId } = useParams()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const lastScrollTop = useRef(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [lockedIndex, setLockedIndex] = useState<number | null>(null)
  const sectionRefs = useRef<Array<HTMLElement | null>>([])

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
        return { ...found, icon, sections: ensureFiveSections(found.sections) }
      } catch {
        return undefined
      }
    }
    const fallback = healthTips.find((item) => item.id === tipId)
    if (!fallback) return undefined
    return { ...fallback, sections: ensureFiveSections(fallback.sections) }
  }, [tipId])
  const moodHint = useMemo(() => getMoodHint(), [])
  const moodOptions = moodOptionMap[moodHint] ?? []
  const dayKey = useMemo(() => localStorage.getItem(DAILY_TIP_DATE_KEY) ?? new Date().toISOString().slice(0, 10), [])
  const questionIndices = useMemo(() => {
    if (!tip) return new Set<number>()
    return buildQuestionIndices(tip.sections.length, seedFromString(`${tip.id}:${dayKey}`))
  }, [tip, dayKey])

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
      node.scrollTop = lastScrollTop.current + clamped
      lastScrollTop.current = node.scrollTop

      if (lockedIndex !== null) return
      const sections = sectionRefs.current
      for (let index = 0; index < sections.length; index += 1) {
        if (!questionIndices.has(index)) continue
        if (answers[index]) continue
        const section = sections[index]
        if (!section) continue
        const rect = section.getBoundingClientRect()
        if (rect.top < 180 && rect.bottom > 220) {
          setLockedIndex(index)
          if (containerRef.current) {
            containerRef.current.style.overflow = "hidden"
          }
          break
        }
      }
    }

    node.addEventListener("scroll", onScroll, { passive: false })
    return () => node.removeEventListener("scroll", onScroll)
  }, [tipId, answers, questionIndices, lockedIndex])

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
      meta: { tipId: safeTip.id, sectionIndex, answer, dayKey },
    })
    if (lockedIndex === sectionIndex) {
      setLockedIndex(null)
      if (containerRef.current) {
        containerRef.current.style.overflow = "auto"
      }
    }
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

        <div className="tip-section-list">
          {tip.sections.map((section, index) => {
            const answered = answers[index]
            const shouldAsk = questionIndices.has(index)
            const rawOptions = moodOptions.length > 0 && index === 0
              ? [moodOptions[0], ...section.question.options.slice(0, 2)]
              : section.question.options
            const options = buildOptions(rawOptions, seedFromString(`${section.question.id}:${dayKey}`))

            return (
              <article
                key={section.heading}
                className="tip-section"
                data-section={index}
                ref={(el) => {
                  sectionRefs.current[index] = el
                }}
              >
                <div className="tip-section-head">
                  <h3>{section.heading}</h3>
                </div>
                <p>{section.body}</p>

                <div className="tip-coach">
                  <span className="tip-coach-label">Astikan AI</span>
                  <p>{section.coach}</p>
                </div>

                {shouldAsk && (
                  <div className="tip-question">
                    <p>{section.question.text}</p>
                    <div className="tip-options">
                      {options.map((option) => (
                        <button
                          key={option}
                          type="button"
                          className={`tip-option app-pressable ${answered === option ? "active" : ""}`}
                          onClick={() => handleAnswer(index, option)}
                        >
                          {answered === option && <FiCheckCircle />}
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      </section>

      {lockedIndex !== null && tip.sections[lockedIndex] && (
        <div className="tip-lock-overlay">
          <div className="tip-lock-card">
            <h3>{tip.sections[lockedIndex].question.text}</h3>
            <p>Quick check so we personalize tomorrow’s tip.</p>
            <div className="tip-options">
              {buildOptions(tip.sections[lockedIndex].question.options, seedFromString(`overlay:${tip.sections[lockedIndex].question.id}:${dayKey}`)).map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`tip-option app-pressable ${answers[lockedIndex] === option ? "active" : ""}`}
                  onClick={() => handleAnswer(lockedIndex, option)}
                >
                  {answers[lockedIndex] === option && <FiCheckCircle />}
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
