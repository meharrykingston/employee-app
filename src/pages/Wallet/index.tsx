import { useEffect, useMemo, useState } from "react"
import {
  FiActivity,
  FiArrowLeft,
  FiBell,
  FiCreditCard,
  FiHome,
  FiMessageCircle,
  FiSmile,
} from "react-icons/fi"
import { useLocation, useNavigate } from "react-router-dom"
import { getSugarLeaderboard } from "../../services/sugarChallengeApi"
import { fetchGamificationSummary } from "../../services/gamificationApi"
import { fetchUnreadCount } from "../../services/notificationCenter"
import "./wallet.css"

type WalletTab = "Home" | "Health" | "Doctor Chat" | "Stress Relief" | "Wallet"

const tabs: Array<{ id: WalletTab; icon: "home" | "health" | "chat" | "stress" | "wallet" }> = [
  { id: "Home", icon: "home" },
  { id: "Health", icon: "health" },
  { id: "Doctor Chat", icon: "chat" },
  { id: "Stress Relief", icon: "stress" },
  { id: "Wallet", icon: "wallet" },
]

const tabRoutes: Record<WalletTab, string> = {
  Home: "/home",
  Health: "/health",
  "Doctor Chat": "/ai-chat",
  "Stress Relief": "/stress-relief",
  Wallet: "/wallet",
}

function tabIcon(icon: (typeof tabs)[number]["icon"]) {
  if (icon === "home") return <FiHome />
  if (icon === "health") return <FiActivity />
  if (icon === "chat") return <FiMessageCircle />
  if (icon === "stress") return <FiSmile />
  return <FiCreditCard />
}

export default function MyWallet() {
  const navigate = useNavigate()
  const location = useLocation()
  const [isMenuDocked, setIsMenuDocked] = useState(false)
  const [leaderboard, setLeaderboard] = useState<Array<{ employeeId: string; coins: number; completedDays: number }>>([])
  const [rank, setRank] = useState<number | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [summary, setSummary] = useState<{
    coins: number
    streak: number
    level: number
    badgesUnlocked: number
    milestones: Array<{ label: string; badge: string; progress: number; claimed: boolean }>
    transactions: Array<{ title: string; meta: string; value: number }>
  } | null>(null)

  const activeTab: WalletTab = useMemo(() => {
    if (location.pathname.startsWith("/home")) return "Home"
    if (location.pathname.startsWith("/health")) return "Health"
    if (location.pathname.startsWith("/ai-chat")) return "Doctor Chat"
    if (location.pathname.startsWith("/stress-relief")) return "Stress Relief"
    return "Wallet"
  }, [location.pathname])

  function onPageScroll(e: React.UIEvent<HTMLElement>) {
    const nextDocked = e.currentTarget.scrollTop > 40
    setIsMenuDocked((prev) => (prev === nextDocked ? prev : nextDocked))
  }

  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const data = await getSugarLeaderboard()
        if (!active) return
        setLeaderboard(data.leaderboard ?? [])
        setRank(data.rank ?? null)
      } catch {
        // ignore
      }
    })()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true
    void fetchGamificationSummary()
      .then((data) => {
        if (active) setSummary(data)
      })
      .catch(() => undefined)
    void fetchUnreadCount()
      .then((count) => active && setUnreadCount(count))
      .catch(() => undefined)
    const onUpdate = () => {
      void fetchUnreadCount()
        .then((count) => active && setUnreadCount(count))
        .catch(() => undefined)
    }
    window.addEventListener("app-notification", onUpdate as EventListener)
    return () => {
      active = false
      window.removeEventListener("app-notification", onUpdate as EventListener)
    }
  }, [])

  return (
    <main className="wallet-page app-page-enter" onScroll={onPageScroll}>
      <header className="wallet-header app-fade-stagger">
        <button className="wallet-back app-pressable" type="button" onClick={() => navigate(-1)} aria-label="Back">
          <FiArrowLeft />
        </button>
        <div>
          <h1 className="wallet-title">My Wallet</h1>
          <p className="wallet-subtitle">Earn coins, unlock rewards</p>
        </div>
        <button className="wallet-notif app-pressable" type="button" aria-label="Notifications" onClick={() => navigate("/notifications")}>
          <FiBell />
          {unreadCount > 0 && <span>{unreadCount}</span>}
        </button>
      </header>

      <nav className={`wallet-menu app-fade-stagger ${isMenuDocked ? "docked" : ""}`}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`wallet-menu-item app-pressable ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => navigate(tabRoutes[tab.id])}
            type="button"
          >
            <span className="wallet-menu-icon">{tabIcon(tab.icon)}</span>
            <span>{tab.id}</span>
          </button>
        ))}
      </nav>

      <section className="wallet-content app-content-slide">
        <div className="wallet-balance-card app-fade-stagger">
          <div className="wallet-balance-main">
            <div className="wallet-balance-label">Available Balance</div>
            <div className="wallet-balance-amount">{summary?.coins ?? 0}</div>
          </div>
          <div className="wallet-balance-meta">
            <div className="wallet-balance-pill">{summary?.streak ?? 0} day streak</div>
          </div>
          <div className="wallet-balance-stats">
            <div className="wallet-stat card-float">
              <div className="wallet-stat-label">Total Earned</div>
              <div className="wallet-stat-value">{summary?.coins ?? 0}</div>
            </div>
            <div className="wallet-stat card-float">
              <div className="wallet-stat-label">Rank</div>
              <div className="wallet-stat-value">#{rank ?? "--"}</div>
            </div>
          </div>
        </div>

        <section className="wallet-section app-fade-stagger">
          <div className="wallet-section-head">
            <h3 className="wallet-section-title">Quick Earn Coins</h3>
            <button className="wallet-link app-pressable" type="button">View All Tasks</button>
          </div>

          <div className="wallet-earn-grid">
            <button className="wallet-earn-card blue app-pressable" type="button">Complete Daily Tasks <span>+50</span></button>
            <button className="wallet-earn-card purple app-pressable" type="button">Weekend Challenge <span>+500</span></button>
            <button className="wallet-earn-card yellow app-pressable" type="button">Quick Health Check <span>+25</span></button>
            <button className="wallet-earn-card pink app-pressable" type="button">Share Progress <span>+30</span></button>
          </div>
        </section>

        <section className="wallet-section wallet-card-section app-fade-stagger">
          <h3 className="wallet-section-title">Milestones &amp; Rewards</h3>

          {(summary?.milestones ?? []).map((milestone) => (
            <Milestone
              key={milestone.label}
              label={milestone.label}
              badge={milestone.badge}
              progress={milestone.progress}
              claimed={milestone.claimed}
            />
          ))}
        </section>

        <section className="wallet-section wallet-card-section app-fade-stagger">
          <h3 className="wallet-section-title">Recent Transactions</h3>

          {(summary?.transactions ?? []).map((txn, index) => (
            <Transaction key={`${txn.title}-${index}`} title={txn.title} meta={txn.meta} value={txn.value} />
          ))}
        </section>

        <section className="wallet-section wallet-card-section app-fade-stagger">
          <div className="wallet-section-head">
            <h3 className="wallet-section-title">No-Sugar Challenge Leaderboard</h3>
            <span className="wallet-rank">Your rank: {rank ?? "--"}</span>
          </div>
          <div className="wallet-leaderboard">
            {leaderboard.length === 0 && <p>No leaderboard yet.</p>}
            {leaderboard.map((row, index) => (
              <div key={`${row.employeeId}-${index}`} className="wallet-leader-row">
                <span className="leader-rank">#{index + 1}</span>
                <span className="leader-name">{row.employeeId}</span>
                <span className="leader-score">{row.coins} coins • {row.completedDays} days</span>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  )
}

function Milestone({ label, badge, progress, claimed }: { label: string; badge: string; progress: number; claimed?: boolean }) {
  return (
    <div className="wallet-milestone">
      <div className="wallet-row">
        <span>{label}</span>
        <span className={claimed ? "claimed" : "progress"}>{claimed ? "Claimed" : `${progress}%`}</span>
      </div>
      <div className="wallet-bar">
        <div className="wallet-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="wallet-badge">{badge}</div>
    </div>
  )
}

function Transaction({ title, meta, value }: { title: string; meta: string; value: number }) {
  return (
    <div className="wallet-txn">
      <div>
        <div className="wallet-txn-title">{title}</div>
        <div className="wallet-txn-meta">{meta}</div>
      </div>
      <div className={value > 0 ? "wallet-pos" : "wallet-neg"}>{value > 0 ? `+${value}` : value}</div>
    </div>
  )
}
