import { useMemo, useState } from "react"
import {
  FiArrowLeft,
  FiCheckCircle,
  FiChevronDown,
  FiChevronUp,
  FiMessageCircle,
  FiShield,
  FiStar,
  FiZap,
} from "react-icons/fi"
import { useNavigate, useParams } from "react-router-dom"
import { medicines } from "../Pharmacy/medicineData"
import "./medicine-detail.css"

type PanelId = "about" | "uses" | "dose" | "safety"

export default function MedicineDetail() {
  const navigate = useNavigate()
  const { medicineId } = useParams()
  const medicine = medicines.find((item) => item.id === medicineId)
  const [openPanel, setOpenPanel] = useState<PanelId>("about")

  const safetyScore = useMemo(() => 92, [])

  if (!medicine) {
    return (
      <main className="medicine-detail-page app-page-enter">
        <header className="medicine-detail-header app-fade-stagger">
          <button className="medicine-detail-back app-pressable" onClick={() => navigate(-1)} type="button" aria-label="Back">
            <FiArrowLeft />
          </button>
          <h1>Medicine Details</h1>
        </header>
        <section className="medicine-detail-shell">
          <article className="medicine-not-found">
            <h2>Medicine not found</h2>
            <button type="button" className="cta-primary app-pressable" onClick={() => navigate("/pharmacy")}>Back to Medicines</button>
          </article>
        </section>
      </main>
    )
  }

  function togglePanel(id: PanelId) {
    setOpenPanel((prev) => (prev === id ? "about" : id))
  }

  return (
    <main className="medicine-detail-page app-page-enter">
      <header className="medicine-detail-header app-fade-stagger">
        <button className="medicine-detail-back app-pressable" onClick={() => navigate(-1)} type="button" aria-label="Back">
          <FiArrowLeft />
        </button>
        <h1>Product Overview</h1>
      </header>

      <section className="medicine-detail-shell app-content-slide">
        <article className="medicine-hero-card app-fade-stagger">
          <div className="medicine-hero-media">
            <img src={medicine.image} alt={medicine.name} />
            <span className="hero-pill"><FiStar /> Trusted medicine</span>
          </div>
          <div className="medicine-hero-copy">
            <h2>{medicine.name}</h2>
            <p>{medicine.dose} • {medicine.kind}</p>
            <span className={medicine.inStock ? "availability in" : "availability out"}>
              {medicine.inStock ? "Currently available" : "Currently unavailable"}
            </span>

            <div className="hero-facts">
              <article>
                <small>Form</small>
                <strong>{medicine.kind}</strong>
              </article>
              <article>
                <small>Dose</small>
                <strong>{medicine.dose}</strong>
              </article>
              <article>
                <small>Safety</small>
                <strong>{safetyScore}%</strong>
              </article>
            </div>
          </div>
        </article>

        <section className="insight-strip app-fade-stagger">
          <span><FiZap /> Best with water after food</span>
          <span><FiShield /> Avoid self dose changes</span>
        </section>

        <article className={`medicine-section app-fade-stagger ${openPanel === "about" ? "expanded" : "collapsed"}`}>
          <button className="section-toggle app-pressable" type="button" onClick={() => togglePanel("about")}>
            <h3>About This Medicine</h3>
            {openPanel === "about" ? <FiChevronUp /> : <FiChevronDown />}
          </button>
          {openPanel === "about" && <p>{medicine.overview}</p>}
        </article>

        <article className={`medicine-section app-fade-stagger ${openPanel === "uses" ? "expanded" : "collapsed"}`}>
          <button className="section-toggle app-pressable" type="button" onClick={() => togglePanel("uses")}>
            <h3>Common Uses</h3>
            {openPanel === "uses" ? <FiChevronUp /> : <FiChevronDown />}
          </button>
          {openPanel === "uses" && (
            <ul>
              {medicine.uses.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </article>

        <article className={`medicine-section app-fade-stagger ${openPanel === "dose" ? "expanded" : "collapsed"}`}>
          <button className="section-toggle app-pressable" type="button" onClick={() => togglePanel("dose")}>
            <h3>Dose Guidance</h3>
            {openPanel === "dose" ? <FiChevronUp /> : <FiChevronDown />}
          </button>
          {openPanel === "dose" && (
            <ul>
              {medicine.doseGuide.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </article>

        <article className={`medicine-section app-fade-stagger ${openPanel === "safety" ? "expanded" : "collapsed"}`}>
          <button className="section-toggle app-pressable" type="button" onClick={() => togglePanel("safety")}>
            <h3>Safety Notes</h3>
            {openPanel === "safety" ? <FiChevronUp /> : <FiChevronDown />}
          </button>
          {openPanel === "safety" && (
            <>
              <ul>
                {medicine.cautions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <div className="medical-note">
                <FiShield /> Always confirm dose and duration with your doctor.
              </div>
            </>
          )}
        </article>

        <section className="medicine-action-grid app-fade-stagger">
          <button
            className="cta-secondary app-pressable"
            type="button"
            onClick={() =>
              navigate("/ai-chat", {
                state: { prefill: `Can you explain ${medicine.name} ${medicine.dose} dose schedule and precautions for me?` },
              })
            }
          >
            <FiMessageCircle /> Ask AI About This Medicine & Dose
          </button>
          <button className="cta-primary app-pressable" type="button" onClick={() => navigate("/teleconsultation")}>
            <FiCheckCircle /> Book Doctor Consultation
          </button>
        </section>
      </section>
    </main>
  )
}
