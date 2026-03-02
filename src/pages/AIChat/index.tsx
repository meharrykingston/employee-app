import { useEffect, useMemo, useRef, useState } from "react"
import { FiArrowLeft, FiImage, FiMic, FiSend } from "react-icons/fi"
import { useLocation, useNavigate } from "react-router-dom"
import "./aichat.css"

type Message = {
  id: string
  from: "ai" | "user"
  text: string
  time: string
}

const suggestionPool = [
  "I feel dizzy since morning",
  "I have headache and eye strain",
  "I feel low energy after lunch",
  "I am having trouble sleeping",
]

function nowTime() {
  const d = new Date()
  const h = d.getHours()
  const m = d.getMinutes().toString().padStart(2, "0")
  const hh = h % 12 || 12
  const ap = h >= 12 ? "PM" : "AM"
  return `${hh}:${m} ${ap}`
}

export default function AIChat() {
  const navigate = useNavigate()
  const location = useLocation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const prefillHandled = useRef(false)

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

  const suggestions = useMemo(() => {
    if (!draft.trim()) {
      return ["Tell me more", "Any other symptoms?", "When did this start?"]
    }
    return suggestionPool.filter((item) => item.toLowerCase().includes(draft.toLowerCase())).slice(0, 3)
  }, [draft])

  function sendMessage(text?: string) {
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

    window.setTimeout(() => {
      const aiMessage: Message = {
        id: `${Date.now()}-a`,
        from: "ai",
        text: "I understand. I am checking your symptoms. Please sit down, hydrate slowly, and tell me if you also have nausea or blurred vision.",
        time: nowTime(),
      }
      setMessages((prev) => [...prev, aiMessage])
      setIsTyping(false)
    }, 850)
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
          <div key={msg.id} className={`message-row ${msg.from === "user" ? "user" : "ai"}`}>
            <div className="message-bubble">
              <div className="message-text">{msg.text}</div>
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
