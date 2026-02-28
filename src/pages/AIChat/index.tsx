import { useMemo, useRef, useState } from "react"
import { FiArrowLeft, FiImage, FiSend } from "react-icons/fi"
import { useNavigate } from "react-router-dom"
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
  const fileInputRef = useRef<HTMLInputElement>(null)

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

    const aiMessage: Message = {
      id: `${Date.now()}-a`,
      from: "ai",
      text: "Noted. I suggest hydration, rest for 10-15 mins, and monitoring symptoms. If this persists, book a doctor consultation.",
      time: nowTime(),
    }

    setMessages((prev) => [...prev, userMessage, aiMessage])
    setDraft("")
  }

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
        <button className="back-btn" onClick={() => navigate(-1)} type="button" aria-label="Back">
          <FiArrowLeft />
        </button>

        <div className="header-info">
          <div className="title">AI Chat</div>
          <div className="status">
            <span className="dot" /> Online and Ready to Help
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
    </div>
  )
}
