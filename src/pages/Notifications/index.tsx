import { useMemo, useState } from "react"
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
import "./notifications.css"

type NoticeItem = {
  id: string
  title: string
  body: string
  time: string
  group: "Today" | "Yesterday"
  unread?: boolean
  channel: "delivery" | "consult" | "health" | "system"
  cta?: { label: string; route: string }
}

const notices: NoticeItem[] = [
  {
    id: "n1",
    title: "Medicine order is packed",
    body: "Rider will pick up from HealthPlus in 2 mins. ETA 5 mins.",
    time: "2 min ago",
    group: "Today",
    unread: true,
    channel: "delivery",
    cta: { label: "Track Order", route: "/pharmacy/tracking" },
  },
  {
    id: "n2",
    title: "Doctor is ready in waiting room",
    body: "Dr. Riza Yuhi started your slot. Join now to avoid reschedule.",
    time: "8 min ago",
    group: "Today",
    unread: true,
    channel: "consult",
    cta: { label: "Join Now", route: "/teleconsultation" },
  },
  {
    id: "n3",
    title: "Hydration check",
    body: "You are below your target today. Drink water and log intake.",
    time: "26 min ago",
    group: "Today",
    channel: "health",
    cta: { label: "Open Health", route: "/health" },
  },
  {
    id: "n4",
    title: "Lab report available",
    body: "CBC report is generated. Values are in normal range.",
    time: "Yesterday, 6:15 PM",
    group: "Yesterday",
    channel: "health",
    cta: { label: "View Report", route: "/lab-tests" },
  },
  {
    id: "n5",
    title: "Account security",
    body: "New login detected on Chrome desktop. If not you, secure account.",
    time: "Yesterday, 1:08 PM",
    group: "Yesterday",
    channel: "system",
    cta: { label: "Review", route: "/settings" },
  },
]

function channelIcon(channel: NoticeItem["channel"]) {
  if (channel === "delivery") return <FiPackage />
  if (channel === "consult") return <FiVideo />
  if (channel === "health") return <FiDroplet />
  return <FiShield />
}

export default function Notifications() {
  const navigate = useNavigate()
  const [notifyState, setNotifyState] = useState("Push notifications are on")
  const [items, setItems] = useState<NoticeItem[]>(notices)

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

    const title = "Astikan Update"
    const options = {
      body: "Rider picked your medicine order. ETA 5 mins.",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: "astikan-live-notice",
    }

    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.getRegistration()
      if (reg) {
        await reg.showNotification(title, options)
        setNotifyState("Live test notification sent")
        playAppSound("notify")
        return
      }
    }

    new Notification(title, options)
    setNotifyState("Live test notification sent")
    playAppSound("notify")
  }

  function markAllRead() {
    setItems((prev) => prev.map((item) => ({ ...item, unread: false })))
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
