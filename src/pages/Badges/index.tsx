import { useState } from "react"
import {
  FiArrowLeft,
  FiAward,
  FiCheckCircle,
  FiClock,
  FiLock,
  FiShield,
  FiTarget,
  FiTrendingDown,
  FiTrendingUp,
  FiStar,
  FiZap,
} from "react-icons/fi"
import { useNavigate } from "react-router-dom"
import "./badges.css"

type Tab = "leaderboard" | "badges"

type TopRank = {
  initials: string
  name: string
  coins: number
  badges: number
  tone: "silver" | "gold" | "bronze"
}

type RankItem = {
  rank: number
  initials: string
  name: string
  level: number
  streak: number
  coins: number
  badges: number
  trend: -1 | 0 | 1 | 3
  isYou?: boolean
}

type BadgeCard = {
  title: string
  subtitle: string
  rarity: "Common" | "Rare" | "Epic" | "Legendary"
  unlocked: boolean
  progress?: number
}

const topRanks: TopRank[] = [
  { initials: "MC", name: "Michael Chen", coins: 5620, badges: 22, tone: "silver" },
  { initials: "SJ", name: "Sarah Johnson", coins: 5840, badges: 24, tone: "gold" },
  { initials: "ER", name: "Emily Rodriguez", coins: 5480, badges: 21, tone: "bronze" },
]

const rankings: RankItem[] = [
  { rank: 1, initials: "SJ", name: "Sarah Johnson", level: 28, streak: 45, coins: 5840, badges: 24, trend: 0 },
  { rank: 2, initials: "MC", name: "Michael Chen", level: 26, streak: 38, coins: 5620, badges: 22, trend: 1 },
  { rank: 3, initials: "ER", name: "Emily Rodriguez", level: 25, streak: 42, coins: 5480, badges: 21, trend: -1 },
  { rank: 4, initials: "DK", name: "David Kim", level: 23, streak: 30, coins: 4920, badges: 19, trend: 1 },
  { rank: 5, initials: "JT", name: "Jessica Taylor", level: 22, streak: 28, coins: 4750, badges: 18, trend: -1 },
  { rank: 42, initials: "YU", name: "You (You)", level: 12, streak: 12, coins: 1250, badges: 8, trend: 3, isYou: true },
]

const badgeCollection: BadgeCard[] = [
  { title: "Early Bird", subtitle: "Complete 30 morning tasks", rarity: "Common", unlocked: true },
  { title: "Meditation Master", subtitle: "100 meditation sessions", rarity: "Rare", unlocked: true },
  { title: "Step Champion", subtitle: "Walk 1 million steps", rarity: "Epic", unlocked: true },
  { title: "Health Legend", subtitle: "Complete 365 daily tasks", rarity: "Legendary", unlocked: false, progress: 42 },
  { title: "Hydration Hero", subtitle: "Meet water goal for 50 days", rarity: "Common", unlocked: true },
  { title: "Stress Warrior", subtitle: "Complete 200 stress relief sessions", rarity: "Rare", unlocked: false, progress: 65 },
  { title: "Fitness Freak", subtitle: "500 workout sessions", rarity: "Epic", unlocked: false, progress: 28 },
  { title: "Weekend Warrior", subtitle: "Complete all weekend tasks for 20 weeks", rarity: "Legendary", unlocked: false, progress: 15 },
]

export default function Badges() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>("leaderboard")

  return (
    <main className="badges-page">
      <div className="badges-header">
        <button className="badges-back-btn" type="button" onClick={() => navigate(-1)} aria-label="Back">
          <FiArrowLeft />
        </button>
        <div>
          <div className="badges-title">Rankings &amp; Achievements</div>
          <div className="badges-subtitle">Compete and earn badges</div>
        </div>
      </div>

      <div className="badges-tabs">
        <button
          type="button"
          className={`badges-tab ${activeTab === "leaderboard" ? "active" : ""}`}
          onClick={() => setActiveTab("leaderboard")}
        >
          <FiStar />
          Leaderboard
        </button>
        <button
          type="button"
          className={`badges-tab ${activeTab === "badges" ? "active" : ""}`}
          onClick={() => setActiveTab("badges")}
        >
          <FiAward />
          My Badges
        </button>
      </div>

      {activeTab === "leaderboard" && (
        <>
          <section className="badges-hero-card">
            <div className="badges-hero-left">
              <div className="badges-rank-bubble">#42</div>
              <div>
                <p className="badges-hero-label">Your Rank</p>
                <h2>You</h2>
                <div className="badges-hero-pills">
                  <span>Level 12</span>
                  <span>12 days</span>
                </div>
              </div>
            </div>
            <div className="badges-hero-right">
              <p>Total Coins</p>
              <strong>1250</strong>
            </div>
          </section>

          <section className="badges-kpi-strip">
            <article className="badges-kpi-card">
              <span>
                <FiZap />
                Streak
              </span>
              <strong>12 Days</strong>
            </article>
            <article className="badges-kpi-card">
              <span>
                <FiAward />
                Badges
              </span>
              <strong>8 Unlocked</strong>
            </article>
            <article className="badges-kpi-card">
              <span>
                <FiTarget />
                Next Goal
              </span>
              <strong>Top 30</strong>
            </article>
          </section>

          <section className="badges-podium">
            {topRanks.map((item, idx) => (
              <article
                key={item.initials}
                className={`badges-podium-card ${item.tone}`}
                style={{ animationDelay: `${idx * 90}ms` }}
              >
                <FiTarget className="badges-podium-medal" />
                <div className="badges-podium-avatar">{item.initials}</div>
                <h3>{item.name}</h3>
                <p>{item.coins} coins</p>
                <span>{item.badges} badges</span>
              </article>
            ))}
          </section>

          <section className="badges-list-section">
            <h3>Top Rankings</h3>
            <div className="badges-rank-list">
              {rankings.map((item, idx) => (
                <article
                  key={item.rank}
                  className={`badges-rank-item ${item.isYou ? "you" : ""}`}
                  style={{ animationDelay: `${idx * 70}ms` }}
                >
                  <div className="badges-rank-index">{item.rank}</div>
                  <div className="badges-rank-avatar">{item.initials}</div>
                  <div className="badges-rank-main">
                    <h4>{item.name}</h4>
                    <p>Level {item.level} • {item.streak} day streak</p>
                  </div>
                  <div className="badges-rank-score">
                    <strong>{item.coins}</strong>
                    <span>{item.badges} badges</span>
                  </div>
                  <div className={`badges-rank-trend ${item.trend > 0 ? "up" : item.trend < 0 ? "down" : "flat"}`}>
                    {item.trend > 0 && <FiTrendingUp />}
                    {item.trend < 0 && <FiTrendingDown />}
                    {item.trend === 0 && <span>-</span>}
                    <b>{item.trend > 0 ? `+${item.trend}` : item.trend}</b>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </>
      )}

      {activeTab === "badges" && (
        <>
          <section className="badges-hero-card badges-hero-badges-card">
            <div>
              <p className="badges-hero-label">Badge Collection</p>
              <h2>4 / 8</h2>
              <div className="badges-hero-pills">
                <span>Next unlock: 15%</span>
                <span>Weekly challenge live</span>
              </div>
            </div>
            <FiAward className="badges-hero-award" />
          </section>

          <section className="badges-grid">
            {badgeCollection.map((badge, idx) => (
              <article
                key={badge.title}
                className={`badges-card ${badge.rarity.toLowerCase()} ${badge.unlocked ? "unlocked" : "locked"}`}
                style={{ animationDelay: `${idx * 80}ms` }}
              >
                <div className="badges-card-top">
                  <div className="badges-status-icon">
                    {badge.unlocked ? <FiCheckCircle /> : <FiLock />}
                  </div>
                  <h3>{badge.title}</h3>
                  <p>{badge.subtitle}</p>
                </div>
                <span className="badges-pill">{badge.rarity}</span>
                {!badge.unlocked && typeof badge.progress === "number" && (
                  <div className="badges-progress-wrap">
                    <div className="badges-progress-top">
                      <small>Progress</small>
                      <small>{badge.progress}%</small>
                    </div>
                    <div className="badges-progress-track">
                      <div className="badges-progress-fill" style={{ width: `${badge.progress}%` }} />
                    </div>
                  </div>
                )}
                {badge.unlocked && (
                  <div className="badges-unlocked-row">
                    <FiShield />
                    <span>Unlocked</span>
                  </div>
                )}
                {!badge.unlocked && (
                  <div className="badges-unlocked-row pending">
                    <FiClock />
                    <span>In progress</span>
                  </div>
                )}
              </article>
            ))}
          </section>
        </>
      )}
    </main>
  )
}
