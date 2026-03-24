import { useNavigate } from "react-router-dom"
import { FiActivity, FiBell, FiBookOpen, FiChevronRight, FiFileText, FiHome, FiSettings, FiUser } from "react-icons/fi"
import { getEmployeeAuthSession, getEmployeeCompanySession } from "../../services/authApi"
import "./profile-info.css"

const profileMenu = [
  { title: "Health Information", subtitle: "Vitals, history, wellness", icon: <FiActivity />, to: "/health-info" },
  { title: "Address", subtitle: "Home and office details", icon: <FiHome />, to: "/address" },
  { title: "Bookings", subtitle: "Consultations and labs", icon: <FiBookOpen />, to: "/bookings" },
  { title: "Reports", subtitle: "Medical reports and files", icon: <FiFileText />, to: "/reports" },
  { title: "Notifications", subtitle: "Alerts and reminders", icon: <FiBell />, to: "/notifications" },
  { title: "Settings", subtitle: "Preferences and controls", icon: <FiSettings />, to: "/settings" },
]

export default function ProfileInfo() {
  const navigate = useNavigate()
  const authSession = getEmployeeAuthSession()
  const companySession = getEmployeeCompanySession()
  const companyName = companySession?.companyName?.trim() || "Astikan"
  const emailDomain = (companySession?.companySlug || companyName)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
  const displayName = authSession?.fullName?.trim() || `${companyName} Employee`
  const displayEmail = authSession?.email?.trim() || `employee@${emailDomain || "astikan"}.com`

  return (
    <main className="profile-hub-page app-page-enter">
      <header className="profile-hub-header app-fade-stagger">
        <button className="profile-hub-back app-pressable" onClick={() => navigate(-1)} type="button" aria-label="Back">&lt;</button>
        <h1>My Profile</h1>
      </header>

      <section className="profile-hub-shell app-content-slide">
        <article className="profile-hero app-fade-stagger">
          <div className="profile-avatar" aria-hidden="true">
            <FiUser />
          </div>
          <div className="profile-identity">
            <h2>{displayName}</h2>
            <p>{displayEmail}</p>
          </div>
        </article>

        <section className="profile-menu app-fade-stagger" aria-label="Profile sections">
          {profileMenu.map((item, index) => (
            <button
              key={item.title}
              className="profile-menu-item app-pressable"
              type="button"
              onClick={() => navigate(item.to)}
              style={{ animationDelay: `${90 + index * 60}ms` }}
            >
              <span className="profile-menu-icon" aria-hidden="true">{item.icon}</span>
              <span className="profile-menu-copy">
                <strong>{item.title}</strong>
                <small>{item.subtitle}</small>
              </span>
              <span className="profile-menu-arrow" aria-hidden="true">
                <FiChevronRight />
              </span>
            </button>
          ))}
        </section>
      </section>
    </main>
  )
}
