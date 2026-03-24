import { useEffect, useMemo, useState } from "react"
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
import { fetchGamificationBadges } from "../../services/gamificationApi"
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


export default function Badges() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>("leaderboard")

  const [topRanks, setTopRanks] = useState<TopRank[]>([])
  const [rankings, setRankings] = useState<RankItem[]>([])
  const [badgeCollection, setBadgeCollection] = useState<BadgeCard[]>([])
  const [summary, setSummary] = useState<{
    yourRank: number
    level: number
    streak: number
    coins: number
    badgesUnlocked: number
  } | null>(null)

  const badgeStats = useMemo(() => {
    const unlocked = summary?.badgesUnlocked ?? 0
    const total = badgeCollection.length
    const nextLocked = badgeCollection.find((badge) => !badge.unlocked && typeof badge.progress === "number")
    return {
      unlocked,
      total,
      nextUnlock: typeof nextLocked?.progress === "number" ? `${nextLocked.progress}%` : "0%",
    }
  }, [badgeCollection, summary?.badgesUnlocked])

  const nextGoal = useMemo(() => {
    const rank = summary?.yourRank ?? null
    if (!rank) return "Top 30"
    if (rank > 30) return "Top 30"
    if (rank > 10) return "Top 10"
    if (rank > 5) return "Top 5"
    return "Top 3"
  }, [summary?.yourRank])

  useEffect(() => {
    let active = true
    void fetchGamificationBadges()
      .then((data) => {
        if (!active) return
        setSummary({
          yourRank: data.yourRank ?? 0,
          level: data.level ?? 0,
          streak: data.streak ?? 0,
          coins: data.coins ?? 0,
          badgesUnlocked: data.badgesUnlocked ?? 0,
        })
        setTopRanks(
          (data.topRanks ?? []).map((item) => ({
            initials: item.initials,
            name: item.name,
            coins: item.coins,
            badges: item.badges,
            tone: (item.tone as TopRank["tone"]) || "silver",
          })),
        )
        setRankings(
          (data.rankings ?? []).map((item) => ({
            rank: item.rank,
            initials: item.initials,
            name: item.name,
            level: item.level,
            streak: item.streak,
            coins: item.coins,
            badges: item.badges,
            trend: (item.trend as RankItem["trend"]) ?? 0,
            isYou: item.isYou,
          })),
        )
        setBadgeCollection(
          (data.badgeCollection ?? []).map((item) => ({
            title: item.title,
            subtitle: item.subtitle,
            rarity: (item.rarity as BadgeCard["rarity"]) || "Common",
            unlocked: item.unlocked,
            progress: item.progress ?? undefined,
          })),
        )
      })
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [])

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
              <div className="badges-rank-bubble">#{summary?.yourRank ?? "--"}</div>
              <div>
                <p className="badges-hero-label">Your Rank</p>
                <h2>You</h2>
                <div className="badges-hero-pills">
                  <span>Level {summary?.level ?? 0}</span>
                  <span>{summary?.streak ?? 0} days</span>
                </div>
              </div>
            </div>
            <div className="badges-hero-right">
              <p>Total Coins</p>
              <strong>{summary?.coins ?? 0}</strong>
            </div>
          </section>

          <section className="badges-kpi-strip">
            <article className="badges-kpi-card">
              <span>
                <FiZap />
                Streak
              </span>
              <strong>{summary?.streak ?? 0} Days</strong>
            </article>
            <article className="badges-kpi-card">
              <span>
                <FiAward />
                Badges
              </span>
              <strong>{summary?.badgesUnlocked ?? 0} Unlocked</strong>
            </article>
            <article className="badges-kpi-card">
              <span>
                <FiTarget />
                Next Goal
              </span>
              <strong>{nextGoal}</strong>
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
              <h2>{badgeStats.unlocked} / {badgeStats.total}</h2>
              <div className="badges-hero-pills">
                <span>Next unlock: {badgeStats.nextUnlock}</span>
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
