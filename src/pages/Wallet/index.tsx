import { useNavigate } from "react-router-dom"
import "./wallet.css"

export default function MyWallet() {
  const navigate = useNavigate()

  return (
    <div className="wallet-page">
      {/* Header */}
      <div className="wallet-header">
        <button className="back-btn" onClick={() => navigate(-1)}>←</button>
        <div>
          <div className="title">My Wallet</div>
          <div className="subtitle">Earn coins, unlock rewards</div>
        </div>
        <div className="notif">3</div>
      </div>

      {/* Balance Card */}
      <div className="balance-card">
        <div className="balance-main">
          <div className="label">Available Balance</div>
          <div className="amount">1,250</div>
        </div>
        <div className="balance-meta">
          <div className="pill">⚡ 12 day streak</div>
        </div>
        <div className="balance-stats">
          <div className="stat">
            <div className="stat-label">Total Earned</div>
            <div className="stat-value">3,480</div>
          </div>
          <div className="stat">
            <div className="stat-label">Rank</div>
            <div className="stat-value">🏆 #42</div>
          </div>
        </div>
      </div>

      {/* Quick Earn */}
      <div className="section">
        <div className="section-head">
          <div className="section-title">Quick Earn Coins</div>
          <button className="link">View All Tasks</button>
        </div>

        <div className="earn-grid">
          <div className="earn-card blue">Complete Daily Tasks <span>+50</span></div>
          <div className="earn-card purple">Weekend Challenge <span>+500</span></div>
          <div className="earn-card yellow">Quick Health Check <span>+25</span></div>
          <div className="earn-card pink">Share Progress <span>+30</span></div>
        </div>
      </div>

      {/* Milestones */}
      <div className="section card-section">
        <div className="section-title">Milestones & Rewards</div>

        <Milestone label="500 coins" badge="Bronze Badge" progress={100} claimed />
        <Milestone label="1000 coins" badge="Silver Badge" progress={100} claimed />
        <Milestone label="2000 coins" badge="Gold Badge" progress={63} />
        <Milestone label="5000 coins" badge="Platinum Badge" progress={25} />
      </div>

      {/* Transactions */}
      <div className="section card-section">
        <div className="section-title">Recent Transactions</div>

        <Transaction title="Completed Weekend Challenge" meta="Weekend Task" value={+500} />
        <Transaction title="Daily Meditation - 7 day" meta="Mental Health" value={+350} />
        <Transaction title="10,000 Steps Achievement" meta="Physical Health" value={+200} />
        <Transaction title="Hydration Goal Met" meta="Health Goal" value={+100} />
        <Transaction title="Premium Health Report" meta="Service" value={-300} />
      </div>
    </div>
  )
}

function Milestone({ label, badge, progress, claimed }: any) {
  return (
    <div className="milestone">
      <div className="row">
        <span>{label}</span>
        <span className={claimed ? "claimed" : "progress"}>{claimed ? "Claimed" : `${progress}%`}</span>
      </div>
      <div className="bar">
        <div className="fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="badge">{badge}</div>
    </div>
  )
}

function Transaction({ title, meta, value }: any) {
  return (
    <div className="txn">
      <div>
        <div className="txn-title">{title}</div>
        <div className="txn-meta">{meta}</div>
      </div>
      <div className={value > 0 ? "pos" : "neg"}>{value > 0 ? `+${value}` : value}</div>
    </div>
  )
}
