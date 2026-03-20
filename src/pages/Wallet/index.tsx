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
import "./wallet.css"

type WalletTab = "Home" | "Health" | "AI Chat" | "Stress Relief" | "Wallet"

const tabs: Array<{ id: WalletTab; icon: "home" | "health" | "chat" | "stress" | "wallet" }> = [
  { id: "Home", icon: "home" },
  { id: "Health", icon: "health" },
  { id: "AI Chat", icon: "chat" },
  { id: "Stress Relief", icon: "stress" },
  { id: "Wallet", icon: "wallet" },
]

const tabRoutes: Record<WalletTab, string> = {
  Home: "/home",
  Health: "/health",
  "AI Chat": "/ai-chat",
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

  const activeTab: WalletTab = useMemo(() => {
    if (location.pathname.startsWith("/home")) return "Home"
    if (location.pathname.startsWith("/health")) return "Health"
    if (location.pathname.startsWith("/ai-chat")) return "AI Chat"
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
          <span>3</span>
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
            <div className="wallet-balance-amount">1,250</div>
          </div>
          <div className="wallet-balance-meta">
            <div className="wallet-balance-pill">12 day streak</div>
          </div>
          <div className="wallet-balance-stats">
            <div className="wallet-stat card-float">
              <div className="wallet-stat-label">Total Earned</div>
              <div className="wallet-stat-value">3,480</div>
            </div>
            <div className="wallet-stat card-float">
              <div className="wallet-stat-label">Rank</div>
              <div className="wallet-stat-value">#42</div>
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

          <Milestone label="500 coins" badge="Bronze Badge" progress={100} claimed />
          <Milestone label="1000 coins" badge="Silver Badge" progress={100} claimed />
          <Milestone label="2000 coins" badge="Gold Badge" progress={63} />
          <Milestone label="5000 coins" badge="Platinum Badge" progress={25} />
        </section>

        <section className="wallet-section wallet-card-section app-fade-stagger">
          <h3 className="wallet-section-title">Recent Transactions</h3>

          <Transaction title="Completed Weekend Challenge" meta="Weekend Task" value={500} />
          <Transaction title="Daily Meditation - 7 day" meta="Mental Health" value={350} />
          <Transaction title="10,000 Steps Achievement" meta="Physical Health" value={200} />
          <Transaction title="Hydration Goal Met" meta="Health Goal" value={100} />
          <Transaction title="Premium Health Report" meta="Service" value={-300} />
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
