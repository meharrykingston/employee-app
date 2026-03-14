import { useEffect, useMemo, useState } from "react"
import {
  FiArrowLeft,
  FiBell,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiDroplet,
  FiPackage,
  FiShield,
  FiVideo,
} from "react-icons/fi"
import { useNavigate } from "react-router-dom"
import { playAppSound } from "../../utils/sound"
import { addNotification, getNotificationsWithSeed, setStoredNotifications, type AppNotification } from "../../services/notificationCenter"
import "./notifications.css"

function channelIcon(channel: AppNotification["channel"]) {
  if (channel === "delivery") return <FiPackage />
  if (channel === "consult") return <FiVideo />
  if (channel === "health") return <FiDroplet />
  return <FiShield />
}

export default function Notifications() {
  const navigate = useNavigate()
  const [notifyState, setNotifyState] = useState("Push notifications are on")
  const [items, setItems] = useState<AppNotification[]>(getNotificationsWithSeed())

  useEffect(() => {
    const onNew = (event: Event) => {
      const detail = (event as CustomEvent<AppNotification>).detail
      if (detail) setItems((prev) => [detail, ...prev])
    }
    window.addEventListener("app-notification", onNew as EventListener)
    return () => window.removeEventListener("app-notification", onNew as EventListener)
  }, [])

  const grouped = useMemo(() => {
    const today = items.filter((item) => item.group === "Today")
    const yesterday = items.filter((item) => item.group === "Yesterday")
    return { today, yesterday }
  }, [items])

  const unreadCount = items.filter((item) => item.unread).length

  async function sendTestNotification() {
    if (!("Notification" in window)) {
      setNotifyState("Notifications are not supported in this browser")
      playAppSound("error")
      return
    }

    let permission = Notification.permission
    if (permission !== "granted") {
      permission = await Notification.requestPermission()
    }

    if (permission !== "granted") {
      setNotifyState("Notification permission not granted")
      playAppSound("error")
      return
    }

    await addNotification({
      title: "Rider picked your order",
      body: "ETA 5 mins. Rider is near your area.",
      channel: "delivery",
      cta: { label: "Track Order", route: "/pharmacy/tracking" },
    })
    setNotifyState("Live test notification sent")
    playAppSound("notify")
  }

  function markAllRead() {
    setItems((prev) => {
      const next = prev.map((item) => ({ ...item, unread: false }))
      setStoredNotifications(next)
      return next
    })
    playAppSound("success")
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
        <article className="notif-live-card app-fade-stagger">
          <div className="live-icon"><FiBell /></div>
          <div>
            <h3>Live Push Channel</h3>
            <p>{notifyState}</p>
          </div>
          <button className="live-send app-pressable" onClick={sendTestNotification} type="button">
            Send test
          </button>
        </article>

        <section className="notif-group app-fade-stagger">
          <div className="notif-group-head">
            <h2>Today</h2>
            <span><FiClock /> Recent</span>
          </div>
          <div className="notif-list">
            {grouped.today.map((item) => (
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
                        playAppSound("tap")
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
                        playAppSound("tap")
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
