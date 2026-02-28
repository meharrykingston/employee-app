import { useState } from "react"
import { useNavigate } from "react-router-dom"
import "./stresschat.css"

type Mode = null | "breathing" | "sleep"

export default function StressRelief() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>(null)

  return (
    <div className="stress-page">
      {/* Header */}
      <div className="stress-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ←
        </button>
        <div className="header-center">
          <div className="icon-circle">❤</div>
          <div>
            <div className="title">Stress Relief Companion</div>
            <div className="subtitle">Your safe space to unwind</div>
          </div>
        </div>
      </div>

      {/* Activities */}
      <div className="section">
        <div className="section-title">Quick Relief Activities:</div>
        <div className="activities">
          <div className="card blue" onClick={() => setMode("breathing")}>
            🌬 Breathing Exercise
          </div>
          <div className="card pink">❤ Meditation</div>
          <div className="card purple" onClick={() => setMode("sleep")}>
            🌙 Sleep Sounds
          </div>
          <div className="card yellow">😊 Positive Vibes</div>
          <div className="card yellow">😊 Self Motivation</div>
          <div className="card yellow">😊 Something</div>
        </div>
      </div>

      {/* Chat bubble */}
      <div className="chat-area">
        <div className="chat-bubble">
          Hello! I’m your stress relief companion. Share your feelings, worries,
          or anything that’s bothering you. I’m here to listen.
          <div className="time">01:24 AM</div>
        </div>
      </div>

      {/* Input */}
      <div className="stress-input">
        <input placeholder="Share your feelings here... I'm listening 💜" />
        <button className="send-btn">➤</button>
      </div>

      {/* Breathing Exercise Overlay */}
      {mode === "breathing" && (
        <div className="overlay" onClick={() => setMode(null)}>
          <div className="breath-circle" />
          <p style={{ marginTop: 24, color: "#6b7280" }}>
            Breathe in… Breathe out…
          </p>
        </div>
      )}

      {/* Sleep Sounds Overlay */}
      {mode === "sleep" && (
        <div className="overlay" onClick={() => setMode(null)}>
          <p style={{ fontSize: 18, marginBottom: 12 }}>🌙 Sleep Sounds</p>
          <audio controls autoPlay loop>
            <source src="/sounds/rain.mp3" type="audio/mpeg" />
          </audio>
          <p style={{ marginTop: 16, color: "#6b7280" }}>
            Tap anywhere to close
          </p>
        </div>
      )}
    </div>
  )
}