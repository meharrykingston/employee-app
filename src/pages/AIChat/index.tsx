import { useEffect, useMemo, useRef, useState } from "react"
import { FiArrowLeft, FiCalendar, FiImage, FiMic, FiPlus, FiSend } from "react-icons/fi"
import { useLocation, useNavigate } from "react-router-dom"
import { askAiChat, getAiLabReadinessQuestions, getAiThread, type ReadinessQuestion } from "../../services/aiApi"
import { ensureEmployeeActor } from "../../services/actorsApi"
import { getEmployeeCompanySession } from "../../services/authApi"
import { useProcessLoading } from "../../app/process-loading"
import { getLabCatalog } from "../../services/labApi"
import { fetchPharmacyProducts } from "../../services/pharmacyApi"
import { mapProductToMedicine, type MedicineItem } from "../Pharmacy/medicineData"
import { useCart } from "../../app/cart"
import chatBubbleSound from "../../assets/audio/chatbubble.mp3"
import "./aichat.css"

type Message = {
  id: string
  from: "ai" | "user"
  text: string
  time: string
  widgets?: LabWidget[]
  medicines?: MedicineWidget[]
  actions?: ChatAction[]
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

type MedicineWidget = {
  id: string
  name: string
  desc: string
  category: string
  priceLabel: string
  inStock: boolean
  image: string
  medicine: MedicineItem
}

type ChatAction = {
  id: string
  label: string
  action: "book_doctor" | "open_cart"
  payload?: Record<string, unknown>
}

type DoctorIntro = {
  name: string
  avatar: string
}

const defaultSuggestions = [
  "Since when is this happening?",
  "What tests should I consider first?",
  "Any urgent warning signs to watch?",
]
const THREAD_STORAGE_KEY = "employee_ai_thread_id"
const MESSAGE_STORAGE_PREFIX = "employee_ai_thread_messages:"
const fallbackMedicineImage = "https://images.unsplash.com/photo-1585435557343-3b092031a831?auto=format&fit=crop&w=900&q=80"

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
  const navState = location.state as { prefill?: string; doctor?: DoctorIntro } | undefined
  const companySession = getEmployeeCompanySession()
  const { start: startProcessLoading, stop: stopProcessLoading } = useProcessLoading()
  const { addItem } = useCart()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const prefillHandled = useRef(false)
  const chatBodyRef = useRef<HTMLDivElement>(null)
  const chatSoundRef = useRef<HTMLAudioElement | null>(null)

  const messagesRef = useRef<Message[]>([])

  const [doctorIntro] = useState<DoctorIntro>(() => {
    return (
      navState?.doctor ?? {
        name: "Dr. Asha Iyer",
        avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=320&q=80",
      }
    )
  })

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      from: "ai",
      text: `Hello, I’m ${doctorIntro.name}. I’m here to guide you with your symptoms and next steps. How are you feeling right now?`,
      time: "06:48 PM",
    },
  ])
  const [draft, setDraft] = useState("")
  const [attachedName, setAttachedName] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)
  const [loadingText, setLoadingText] = useState("")
  const [isListening, setIsListening] = useState(false)
  const [aiQuickReplies, setAiQuickReplies] = useState<string[]>(defaultSuggestions)
  const [bookingWidgetId, setBookingWidgetId] = useState<string | null>(null)
  const [threadId] = useState(() => {
    const existing = localStorage.getItem(THREAD_STORAGE_KEY)
    if (existing) return existing
    const generated = `emp-ai-${Math.random().toString(36).slice(2, 10)}`
    localStorage.setItem(THREAD_STORAGE_KEY, generated)
    return generated
  })
  const [employeeUserId, setEmployeeUserId] = useState("")

  useEffect(() => {
    const stored = localStorage.getItem(`${MESSAGE_STORAGE_PREFIX}${threadId}`)
    if (!stored) return
    try {
      const parsed = JSON.parse(stored) as Message[]
      if (Array.isArray(parsed) && parsed.length > 0) {
        setMessages(parsed)
      }
    } catch {
      // ignore malformed cache
    }
  }, [threadId])

  useEffect(() => {
    let active = true
    void ensureEmployeeActor({
      companyReference: "astikan-demo-company",
      companyName: companySession?.companyName ?? "Astikan",
      fullName: "Astikan Employee",
      handle: "astikan-employee",
      email: "employee@astikan.local",
    })
      .then((actor) => {
        if (!active) return
        setEmployeeUserId(actor.employeeUserId)
        return getAiThread(threadId)
      })
      .then((rows) => {
        if (!active || !rows || rows.length === 0) return
        const hydrated: Message[] = rows.map((row, index) => ({
          id: `${index}-${row.createdAt ?? Date.now()}`,
          from: row.role === "assistant" ? "ai" : "user",
          text: row.content,
          time: nowTime(),
        }))
        setMessages(hydrated)
        localStorage.setItem(`${MESSAGE_STORAGE_PREFIX}${threadId}`, JSON.stringify(hydrated))
      })
      .catch(() => {
        // Keep seeded conversation if backend history is unavailable.
      })

    return () => {
      active = false
    }
  }, [threadId])

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  function playChatBubbleSound() {
    const audio = chatSoundRef.current ?? new Audio(chatBubbleSound)
    audio.volume = 0.6
    audio.currentTime = 0
    chatSoundRef.current = audio
    audio.play().catch(() => undefined)
  }

  useEffect(() => {
    if (!threadId) return
    localStorage.setItem(`${MESSAGE_STORAGE_PREFIX}${threadId}`, JSON.stringify(messages))
  }, [messages, threadId])

  useEffect(() => {
    const node = chatBodyRef.current
    if (!node) return
    node.scrollTo({ top: node.scrollHeight, behavior: "smooth" })
  }, [messages, isTyping])

  useEffect(() => {
    if (!isTyping) {
      setLoadingStep(0)
      setLoadingText("")
      return
    }
    const interval = window.setInterval(() => {
      setLoadingStep((prev) => (prev + 1) % 3)
    }, 1400)
    return () => window.clearInterval(interval)
  }, [isTyping])

  useEffect(() => {
    if (!isTyping) return
    const lastUser = getLatestUserText(messagesRef.current).slice(0, 90)
    const label = lastUser ? `“${lastUser}”` : "your symptoms"
    const pool = [
      `Understanding ${label}...`,
      "Mapping likely causes and safe next steps...",
      "Checking if a doctor consult is needed...",
      "Looking at possible remedies and cautions...",
      "Summarizing a clear response for you...",
    ]
    setLoadingText(pool[loadingStep % pool.length])
  }, [isTyping, loadingStep])

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
      threadId,
      userId: employeeUserId || undefined,
      appContext: "employee",
    })
    setAiQuickReplies(toUserSideQuickReplies(result.quickReplies ?? []))

    const suggested = result.suggestedTests ?? []
    let widgets: LabWidget[] = []
    let medicines: MedicineWidget[] = []
    const actions: ChatAction[] = []

    const wantsDoctor =
      result.nextAction === "book_doctor" ||
      /book\s+(a\s+)?doctor|consult(ation)?/i.test(content)

    if (wantsDoctor) {
      actions.push({
        id: `book-doctor-${Date.now()}`,
        label: "Book Doctor",
        action: "book_doctor",
        payload: {
          specialty: result.doctorSpecialty,
          analysisQuery: content,
        },
      })
    }

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

    if ((result.suggestedMedicines ?? []).length > 0) {
      const medicineResults = await Promise.all(
        (result.suggestedMedicines ?? []).slice(0, 4).map(async (item, index) => {
          const keyword = item.name.trim()
          if (!keyword) return null

          try {
            const rows = await fetchPharmacyProducts({ search: keyword, limit: 1, audience: "employee" })
            const match = rows?.[0]
            if (match) {
              const med = mapProductToMedicine(match, index)
              return {
                id: med.id,
                name: med.name,
                desc: item.reason || med.overview,
                category: med.kind,
                priceLabel: med.price ? `₹${med.price}` : "Ask pharmacist",
                inStock: med.inStock,
                image: med.image,
                medicine: med,
              } satisfies MedicineWidget
            }
          } catch {
            // fall through to fallback
          }

          const fallbackProduct = {
            id: `ai-med-${index}-${Date.now()}`,
            name: item.name,
            category: item.category ?? "Medicine",
            description: item.reason ?? "Suggested by the care assistant",
            base_price_inr: 0,
            image_urls_json: [fallbackMedicineImage],
            in_stock: true,
          }
          const med = mapProductToMedicine(fallbackProduct, index)
          return {
            id: med.id,
            name: med.name,
            desc: item.reason || med.overview,
            category: med.kind,
            priceLabel: "Ask pharmacist",
            inStock: med.inStock,
            image: med.image,
            medicine: med,
          } satisfies MedicineWidget
        })
      )
      medicines = medicineResults.filter((item): item is MedicineWidget => !!item)
    }

    return {
      id: `${Date.now()}-a`,
      from: "ai" as const,
      text: result.reply,
      time: nowTime(),
      widgets,
      medicines,
      actions,
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
    playChatBubbleSound()
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
      playChatBubbleSound()
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

  function onActionClick(action: ChatAction) {
    if (action.action === "open_cart") {
      navigate("/cart")
      return
    }
    if (action.action === "book_doctor") {
      const specialty = String(action.payload?.specialty ?? "").trim()
      navigate("/teleconsultation", {
        state: {
          fromAiAnalyser: true,
          preselectedSpecialty: specialty || undefined,
          analysisQuery: String(action.payload?.analysisQuery ?? "") || undefined,
        },
      })
    }
  }

  useEffect(() => {
    if (prefillHandled.current || !navState?.prefill) {
      return
    }
    prefillHandled.current = true
    sendMessage(navState.prefill)
  }, [navState])

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
          <div className="ai-chat-doctor">
            <img src={doctorIntro.avatar} alt={doctorIntro.name} />
            <div>
              <h1 className="ai-chat-title">{doctorIntro.name}</h1>
              <div className="ai-chat-status">
                <span className="ai-chat-dot" /> Doctor online and ready
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="ai-chat-body" ref={chatBodyRef}>
        {messages.map((msg) => (
          <div key={msg.id} className={`message-row ${msg.from === "user" ? "user" : "ai"} bubble-enter`}>
            <div className="message-bubble">
              <div className="message-text">{renderRichText(msg.text)}</div>
              {msg.from === "ai" && !!msg.actions?.length && (
                <div className="ai-action-row">
                  {msg.actions.map((action) => (
                    <button
                      key={action.id}
                      type="button"
                      className="ai-action-btn app-pressable"
                      onClick={() => onActionClick(action)}
                    >
                      <FiCalendar />
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
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
              {msg.from === "ai" && !!msg.medicines?.length && (
                <div className="ai-med-widget-list">
                  {msg.medicines.map((med) => (
                    <article key={med.id} className="ai-med-widget">
                      <img src={med.image} alt={med.name} loading="lazy" />
                      <div className="ai-med-info">
                        <h4>{med.name}</h4>
                        <p>{med.desc}</p>
                        <div className="ai-med-meta">
                          <span>{med.category}</span>
                          <span>{med.priceLabel}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="ai-med-add app-pressable"
                        onClick={() => {
                          addItem(med.medicine)
                          navigate("/cart")
                        }}
                      >
                        <FiPlus /> Add
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
        {isTyping && (
          <div className="message-row ai">
            <div className="message-bubble typing-status">
              {loadingText || "Thinking..."}
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
