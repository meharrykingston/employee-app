export type AppNotification = {
  id: string
  title: string
  body: string
  time: string
  group: "Today" | "Yesterday"
  unread?: boolean
  channel: "delivery" | "consult" | "health" | "system"
  cta?: { label: string; route: string }
}

const STORAGE_KEY = "employee_notifications"

export const seedNotifications: AppNotification[] = [
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
]

function timeGroup(date: Date): "Today" | "Yesterday" {
  const now = new Date()
  const isToday = now.toDateString() === date.toDateString()
  return isToday ? "Today" : "Yesterday"
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })
}

export function getStoredNotifications(): AppNotification[] {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as AppNotification[]
    if (Array.isArray(parsed)) return parsed
  } catch {
    return []
  }
  return []
}

export function setStoredNotifications(items: AppNotification[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function getNotificationsWithSeed(): AppNotification[] {
  const stored = getStoredNotifications()
  return stored.length ? stored : seedNotifications
}

export async function pushBrowserNotification(title: string, body: string) {
  if (!("Notification" in window)) return false
  let permission = Notification.permission
  if (permission !== "granted") {
    permission = await Notification.requestPermission()
  }
  if (permission !== "granted") return false

  const options = {
    body,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: `notif-${Date.now()}`,
  }

  if ("serviceWorker" in navigator) {
    const reg = await navigator.serviceWorker.getRegistration()
    if (reg) {
      await reg.showNotification(title, options)
      return true
    }
  }

  new Notification(title, options)
  return true
}

export async function addNotification(input: Omit<AppNotification, "id" | "time" | "group" | "unread">) {
  const now = new Date()
  const item: AppNotification = {
    ...input,
    id: `n-${now.getTime()}`,
    time: formatTime(now),
    group: timeGroup(now),
    unread: true,
  }
  const next = [item, ...getStoredNotifications()]
  setStoredNotifications(next)
  window.dispatchEvent(new CustomEvent("app-notification", { detail: item }))
  return item
}
