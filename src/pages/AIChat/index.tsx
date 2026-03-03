import { useEffect, useMemo, useRef, useState } from "react"
import { FiArrowLeft, FiImage, FiMic, FiSend } from "react-icons/fi"
import { useLocation, useNavigate } from "react-router-dom"
import { askAiChat, getAiLabReadinessQuestions, type ReadinessQuestion } from "../../services/aiApi"
import { useProcessLoading } from "../../app/process-loading"
import { getLabCatalog } from "../../services/labApi"
import "./aichat.css"

type Message = {
  id: string
  from: "ai" | "user"
  text: string
  time: string
  widgets?: LabWidget[]
}

type LabWidget = {
  id: string
  name: string
  desc: string
  tag: string
  duration: string
  fasting: string
  color: "red" | "blue" | "gray" | "green" | "outline"
}

const defaultSuggestions = [
  "Since when is this happening?",
  "What tests should I consider first?",
  "Any urgent warning signs to watch?",
]

function nowTime() {
  const d = new Date()
  const h = d.getHours()
  const m = d.getMinutes().toString().padStart(2, "0")
  const hh = h % 12 || 12
  const ap = h >= 12 ? "PM" : "AM"
  return `${hh}:${m} ${ap}`
}

function getLatestUserText(messages: Message[]) {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i].from === "user") return messages[i].text.toLowerCase()
  }
  return ""
}

function contextualSuggestions(source: string) {
  const s = source.toLowerCase()

  if (/(dizz|vertigo|faint|lightheaded)/.test(s)) {
    return [
      "I also feel nausea sometimes",
      "It gets worse when I stand up",
      "What tests are useful for dizziness?",
    ]
  }
  if (/(hair|fatigue|tired|low energy|weak)/.test(s)) {
    return [
      "Please suggest tests for fatigue + hair fall",
      "Could this be vitamin or thyroid related?",
      "What checklist should I follow before tests?",
    ]
  }
  if (/(headache|migraine|eye strain)/.test(s)) {
    return [
      "Headache is daily in the evening",
      "I also have eye strain from screens",
      "Which initial tests are recommended?",
    ]
  }
  if (/(sleep|insomnia|stress|anxious|panic)/.test(s)) {
    return [
      "Sleep has been poor for 2 weeks",
      "I feel stressed and low during work",
      "What lifestyle checks should I do first?",
    ]
  }

  return defaultSuggestions
}

function toUserSideQuickReplies(items: string[]) {
  const cleaned = items
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .map((item) => item.replace(/^["']|["']$/g, ""))
    .map((item) => {
      const lower = item.toLowerCase()
      if (lower.startsWith("show ")) return `I want ${lower}`
      if (lower.startsWith("suggest ")) return `I want ${lower}`
      if (lower.startsWith("book ")) return `I want to ${lower}`
      return item
    })
    .slice(0, 3)

  if (cleaned.length === 0) return defaultSuggestions
  return cleaned
}

function renderRichText(text: string) {
  const lines = text.split("\n")
  return lines.map((line, lineIdx) => {
    const chunks = line.split(/(\*\*[^*]+\*\*)/g).filter(Boolean)
    return (
      <span key={`line-${lineIdx}`} className="message-line">
        {chunks.map((chunk, chunkIdx) => {
          if (chunk.startsWith("**") && chunk.endsWith("**")) {
            return <strong key={`chunk-${lineIdx}-${chunkIdx}`}>{chunk.slice(2, -2)}</strong>
          }
          return <span key={`chunk-${lineIdx}-${chunkIdx}`}>{chunk}</span>
        })}
        {lineIdx < lines.length - 1 && <br />}
      </span>
    )
  })
}

function mapCategoryToColor(tag: string): LabWidget["color"] {
  const value = tag.toLowerCase()
  if (value.includes("blood")) return "red"
  if (value.includes("liver")) return "green"
  if (value.includes("vitamin")) return "outline"
  if (value.includes("hormone") || value.includes("thyroid")) return "gray"
  if (value.includes("lipid") || value.includes("heart")) return "blue"
  if (value.includes("diabetes") || value.includes("sugar")) return "green"
  return "outline"
}

export default function AIChat() {
  const navigate = useNavigate()
  const location = useLocation()
  const { start: startProcessLoading, stop: stopProcessLoading } = useProcessLoading()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const prefillHandled = useRef(false)

  const messagesRef = useRef<Message[]>([])

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      from: "ai",
      text: "Hello. I am here to help you with your symptoms. How are you feeling right now?",
      time: "06:48 PM",
    },
    {
      id: "2",
      from: "user",
      text: "I feel dizzy",
      time: "06:48 PM",
    },
    {
      id: "3",
      from: "ai",
      text: "Thanks for sharing that. Did this start suddenly, and are you drinking enough water today?",
      time: "06:48 PM",
    },
  ])
  const [draft, setDraft] = useState("")
  const [attachedName, setAttachedName] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [aiQuickReplies, setAiQuickReplies] = useState<string[]>(defaultSuggestions)
  const [bookingWidgetId, setBookingWidgetId] = useState<string | null>(null)

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  useEffect(() => {
    setAiQuickReplies(contextualSuggestions(getLatestUserText(messages)))
    // Intentionally run only on first mount with seeded chat.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const suggestions = useMemo(() => {
    if (!draft.trim()) {
      if (aiQuickReplies.length > 0) {
        return aiQuickReplies
      }
      return contextualSuggestions(getLatestUserText(messages))
    }
    return contextualSuggestions(draft)
  }, [aiQuickReplies, draft, messages])

  async function buildAiMessage(content: string, history: Array<{ role: "user" | "assistant"; content: string }>) {
    const result = await askAiChat({
      message: content,
      history,
    })
    setAiQuickReplies(toUserSideQuickReplies(result.quickReplies ?? []))

    const suggested = result.suggestedTests ?? []
    let widgets: LabWidget[] = []

    if (suggested.length > 0) {
      const widgetResults = await Promise.all(
        suggested.slice(0, 5).map(async (item, index) => {
          const keyword = item.name.trim()
          if (!keyword) {
            return null
          }

          try {
            const data = await getLabCatalog(keyword, 1, 0)
            const test = data.tests[0]
            if (!test) {
              return null
            }
            return {
              id: test.id,
              name: test.name,
              desc: test.code ? `Test Code: ${test.code}` : "Comprehensive health test",
              tag: test.category,
              duration: test.reportingTime || "Not available",
              fasting: "Preparation details available in test description",
              color: mapCategoryToColor(test.category),
            } satisfies LabWidget
          } catch {
            return {
              id: `ai-${index}-${Date.now()}`,
              name: item.name,
              desc: item.reason || "Suggested by AI based on your symptoms",
              tag: item.category || "General Test",
              duration: "Check availability",
              fasting: "Follow doctor/lab preparation advice",
              color: mapCategoryToColor(item.category || "General Test"),
            } satisfies LabWidget
          }
        })
      )

      widgets = widgetResults.filter((item): item is LabWidget => !!item)
    }

    return {
      id: `${Date.now()}-a`,
      from: "ai" as const,
      text: result.reply,
      time: nowTime(),
      widgets,
    }
  }

  async function sendMessage(text?: string) {
    const content = (text ?? draft).trim()
    if (!content) {
      return
    }

    const userMessage: Message = {
      id: `${Date.now()}-u`,
      from: "user",
      text: content,
      time: nowTime(),
    }

    setMessages((prev) => [...prev, userMessage])
    setDraft("")
    setIsTyping(true)

    try {
      const history = messagesRef.current
        .filter((item) => item.from === "ai" || item.from === "user")
        .slice(-10)
        .map((item) => ({
          role: item.from === "user" ? ("user" as const) : ("assistant" as const),
          content: item.text,
        }))

      const aiMessage = await buildAiMessage(content, history)
      setMessages((prev) => [...prev, aiMessage])
    } catch (_error: unknown) {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-retry`,
          from: "ai",
          text: "I’m reaching AI again, one moment...",
          time: nowTime(),
        },
      ])

      try {
        await new Promise((resolve) => window.setTimeout(resolve, 1200))
        const retryHistory = messagesRef.current
          .filter((item) => item.from === "ai" || item.from === "user")
          .slice(-10)
          .map((item) => ({
            role: item.from === "user" ? ("user" as const) : ("assistant" as const),
            content: item.text,
          }))
        const retryMessage = await buildAiMessage(content, retryHistory)
        setMessages((prev) => [...prev, retryMessage])
      } catch {
        setAiQuickReplies(defaultSuggestions)
        const aiMessage: Message = {
          id: `${Date.now()}-a`,
          from: "ai",
          text: "Still unable to connect right now. I’ll keep trying in the background. Please send one more message.",
          time: nowTime(),
        }
        setMessages((prev) => [...prev, aiMessage])
      }
    } finally {
      setIsTyping(false)
    }
  }

  async function onBookFromWidget(widget: LabWidget) {
    setBookingWidgetId(widget.id)
    startProcessLoading()
    try {
      const readiness = await getAiLabReadinessQuestions({
        testName: widget.name,
        fastingInfo: widget.fasting,
      })
      navigate("/lab-tests/readiness", {
        state: {
          selectedTest: {
            id: widget.id,
            color: widget.color,
            name: widget.name,
            desc: widget.desc,
            tag: widget.tag,
            duration: widget.duration,
            fasting: widget.fasting,
          },
          readinessQuestions: readiness.questions as ReadinessQuestion[],
        },
      })
    } catch {
      navigate("/lab-tests/readiness", {
        state: {
          selectedTest: {
            id: widget.id,
            color: widget.color,
            name: widget.name,
            desc: widget.desc,
            tag: widget.tag,
            duration: widget.duration,
            fasting: widget.fasting,
          },
        },
      })
    } finally {
      setBookingWidgetId(null)
      stopProcessLoading()
    }
  }

  useEffect(() => {
    const state = location.state as { prefill?: string } | undefined
    if (prefillHandled.current || !state?.prefill) {
      return
    }
    prefillHandled.current = true
    sendMessage(state.prefill)
  }, [location.state])

  function openPicker() {
    fileInputRef.current?.click()
  }

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) {
      return
    }
    setAttachedName(file.name)
    e.target.value = ""
  }

  return (
    <div className="ai-chat-page">
      <header className="ai-chat-header">
        <button className="ai-chat-back app-pressable" onClick={() => navigate(-1)} type="button" aria-label="Back">
          <FiArrowLeft />
        </button>

        <div className="ai-chat-header-info">
          <h1 className="ai-chat-title">AI Chat</h1>
          <div className="ai-chat-status">
            <span className="ai-chat-dot" /> Online and Ready to Help
          </div>
        </div>
      </header>

      <div className="ai-chat-body">
        {messages.map((msg) => (
          <div key={msg.id} className={`message-row ${msg.from === "user" ? "user" : "ai"} bubble-enter`}>
            <div className="message-bubble">
              {msg.from === "ai" && <div className="bubble-badge">Care Assistant</div>}
              <div className="message-text">{renderRichText(msg.text)}</div>
              {msg.from === "ai" && !!msg.widgets?.length && (
                <div className="ai-lab-widget-list">
                  {msg.widgets.map((widget) => (
                    <article key={widget.id} className="ai-lab-widget">
                      <div className={`ai-lab-dot ${widget.color}`} aria-hidden="true" />
                      <div className="ai-lab-info">
                        <h4>{widget.name}</h4>
                        <p>{widget.desc}</p>
                        <div className="ai-lab-meta">
                          <span>{widget.tag}</span>
                          <span>{widget.duration}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="ai-lab-book"
                        onClick={() => void onBookFromWidget(widget)}
                        disabled={bookingWidgetId === widget.id}
                      >
                        Book
                      </button>
                    </article>
                  ))}
                </div>
              )}
              <div className="message-time">{msg.time}</div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="message-row ai">
            <div className="message-bubble typing-bubble">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
      </div>

      <div className="composer-wrap">
        {!!attachedName && <div className="attached-pill">Attached: {attachedName}</div>}

        <div className="quick-actions">
          {suggestions.map((item) => (
            <button key={item} onClick={() => sendMessage(item)} type="button">
              {item}
            </button>
          ))}
        </div>

        <div className="ai-chat-input">
          <button className="icon-btn" onClick={openPicker} type="button" aria-label="Add image">
            <FiImage />
          </button>
          <button className="icon-btn" onClick={() => setIsListening(true)} type="button" aria-label="Voice input">
            <FiMic />
          </button>

          <input
            placeholder="Describe your symptoms..."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                sendMessage()
              }
            }}
          />

          <button className="send-btn" onClick={() => sendMessage()} type="button" aria-label="Send">
            <FiSend />
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden-file"
        onChange={onPickFile}
      />

      {isListening && (
        <div className="voice-overlay" onClick={() => setIsListening(false)}>
          <div className="voice-sheet app-page-enter" onClick={(e) => e.stopPropagation()}>
            <h4>Listening...</h4>
            <p>Speak your symptoms clearly.</p>
            <div className="voice-bars" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
            <button className="stop-voice app-pressable" onClick={() => setIsListening(false)} type="button">Stop</button>
          </div>
        </div>
      )}
    </div>
  )
}
