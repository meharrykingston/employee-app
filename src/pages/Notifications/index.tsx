import { useEffect, useMemo, useState } from "react"
import {
  FiArrowLeft,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiDroplet,
  FiPackage,
  FiShield,
  FiVideo,
} from "react-icons/fi"
import { useNavigate } from "react-router-dom"
import { fetchNotifications, markNotificationsRead, type AppNotification } from "../../services/notificationCenter"
import "./notifications.css"

function channelIcon(channel: AppNotification["channel"]) {
  if (channel === "delivery") return <FiPackage />
  if (channel === "consult") return <FiVideo />
  if (channel === "health") return <FiDroplet />
  return <FiShield />
}

export default function Notifications() {
  const navigate = useNavigate()
  const [items, setItems] = useState<AppNotification[]>([])

  useEffect(() => {
    let active = true
    void fetchNotifications()
      .then((rows) => {
        if (active) setItems(rows)
      })
      .catch(() => undefined)
    const onNew = (event: Event) => {
      const detail = (event as CustomEvent<AppNotification>).detail
      if (detail) setItems((prev) => [detail, ...prev])
    }
    window.addEventListener("app-notification", onNew as EventListener)
    return () => {
      active = false
      window.removeEventListener("app-notification", onNew as EventListener)
    }
  }, [])

  const grouped = useMemo(() => {
    const today = items.filter((item) => item.group === "Today")
    const yesterday = items.filter((item) => item.group === "Yesterday")
    return { today, yesterday }
  }, [items])

  const unreadCount = items.filter((item) => item.unread).length

  function markAllRead() {
    setItems((prev) => prev.map((item) => ({ ...item, unread: false })))
    void markNotificationsRead()
  }

  return (
    <main className="notif-page app-page-enter">
      <header className="notif-header app-fade-stagger">
        <button className="notif-back app-pressable" onClick={() => navigate(-1)} type="button" aria-label="Back">
          <FiArrowLeft />
        </button>
        <div className="notif-title-wrap">
          <h1>Notifications</h1>
          <p>{unreadCount} unread updates</p>
        </div>
        <button className="notif-mark-all app-pressable" type="button" onClick={markAllRead}>
          <FiCheckCircle />
          Mark all
        </button>
      </header>

      <section className="notif-shell app-content-slide">
        <section className="notif-group app-fade-stagger">
          <div className="notif-group-head">
            <h2>Today</h2>
            <span><FiClock /> Recent</span>
          </div>
          <div className="notif-list">
            {grouped.today.map((item) => (
              <article
                className={`notif-item ${item.unread ? "unread" : ""}`}
                key={item.id}
                onClick={() => {
                  if (!item.unread) return
                  setItems((prev) => prev.map((row) => (row.id === item.id ? { ...row, unread: false } : row)))
                  void markNotificationsRead([item.id])
                }}
              >
                <span className={`notif-icon ${item.channel}`}>{channelIcon(item.channel)}</span>
                <div className="notif-copy">
                  <div className="notif-row">
                    <h4>{item.title}</h4>
                    <small>{item.time}</small>
                  </div>
                  <p>{item.body}</p>
                  {item.cta && (
                    <button
                      className="notif-cta app-pressable"
                      type="button"
                      onClick={() => {
                        if (item.channel === "consult" && item.teleconsultSessionId && item.doctorId) {
                          navigate("/teleconsultation", {
                            state: {
                              startVideo: true,
                              selectedDoctorId: item.doctorId,
                              teleconsultSessionId: item.teleconsultSessionId,
                              scheduledAt: item.scheduledAt,
                            },
                          })
                          return
                        }
                        navigate(item.cta!.route)
                      }}
                    >
                      {item.cta.label}
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="notif-group app-fade-stagger">
          <div className="notif-group-head">
            <h2>Yesterday</h2>
            <span><FiCalendar /> Archive</span>
          </div>
          <div className="notif-list">
            {grouped.yesterday.map((item) => (
              <article className={`notif-item ${item.unread ? "unread" : ""}`} key={item.id}>
                <span className={`notif-icon ${item.channel}`}>{channelIcon(item.channel)}</span>
                <div className="notif-copy">
                  <div className="notif-row">
                    <h4>{item.title}</h4>
                    <small>{item.time}</small>
                  </div>
                  <p>{item.body}</p>
                  {item.cta && (
                    <button
                      className="notif-cta app-pressable"
                      type="button"
                      onClick={() => {
                        if (item.channel === "consult" && item.teleconsultSessionId && item.doctorId) {
                          navigate("/teleconsultation", {
                            state: {
                              startVideo: true,
                              selectedDoctorId: item.doctorId,
                              teleconsultSessionId: item.teleconsultSessionId,
                              scheduledAt: item.scheduledAt,
                            },
                          })
                          return
                        }
                        navigate(item.cta!.route)
                      }}
                    >
                      {item.cta.label}
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  )
}
