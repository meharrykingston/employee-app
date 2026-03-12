import { useEffect, useMemo, useState } from "react"
import {
  FiArrowLeft,
  FiCheckCircle,
  FiChevronDown,
  FiChevronUp,
  FiMessageCircle,
  FiShield,
  FiShoppingCart,
  FiStar,
  FiZap,
} from "react-icons/fi"
import { useNavigate, useParams } from "react-router-dom"
import { fetchPharmacyProducts } from "../../services/pharmacyApi"
import { mapProductToMedicine, medicines, type MedicineItem } from "../Pharmacy/medicineData"
import { useCart } from "../../app/cart"
import { playAppSound } from "../../utils/sound"
import "./medicine-detail.css"

type PanelId = "about" | "uses" | "dose" | "safety"

export default function MedicineDetail() {
  const navigate = useNavigate()
  const { medicineId } = useParams()
  const [catalog, setCatalog] = useState<MedicineItem[]>([])
  const [loadingCatalog, setLoadingCatalog] = useState(true)
  const medicine = useMemo(() => {
    const source = catalog.length ? catalog : medicines
    return source.find((item) => item.id === medicineId)
  }, [catalog, medicineId])
  const [openPanel, setOpenPanel] = useState<PanelId>("about")
  const [showCartPopup, setShowCartPopup] = useState(false)
  const [lastAddedName, setLastAddedName] = useState("")
  const { addItem, totalItems } = useCart()

  const safetyScore = useMemo(() => 92, [])
  const upsells = useMemo(() => {
    const source = catalog.length ? catalog : medicines
    return source.filter((item) => item.id !== medicineId).slice(0, 3)
  }, [medicineId, catalog])

  useEffect(() => {
    let active = true
    async function loadCatalog() {
      setLoadingCatalog(true)
      try {
        const rows = await fetchPharmacyProducts({ limit: 40, audience: "employee" })
        if (!active) return
        if (rows?.length) {
          setCatalog(rows.map((row, index) => mapProductToMedicine(row, index)))
        } else {
          setCatalog([])
        }
      } catch {
        if (active) setCatalog([])
      } finally {
        if (active) setLoadingCatalog(false)
      }
    }
    loadCatalog()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!showCartPopup) return
    const timer = window.setTimeout(() => setShowCartPopup(false), 1800)
    return () => window.clearTimeout(timer)
  }, [showCartPopup])

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
            <h2>{loadingCatalog ? "Loading medicine..." : "Medicine not found"}</h2>
            {!loadingCatalog && (
              <button type="button" className="cta-primary app-pressable" onClick={() => navigate("/pharmacy")}>Back to Medicines</button>
            )}
          </article>
        </section>
      </main>
    )
  }

  const currentMedicine = medicine

  function togglePanel(id: PanelId) {
    setOpenPanel((prev) => (prev === id ? "about" : id))
  }

  function addToCart(item: MedicineItem) {
    if (!item.inStock) return
    addItem(item)
    playAppSound("success")
    setLastAddedName(item.name)
    setShowCartPopup(true)
  }

  function handleBuyNow() {
    if (!currentMedicine.inStock) return
    addItem(currentMedicine)
    playAppSound("notify")
    navigate("/cart")
  }

  return (
    <main className="medicine-detail-page app-page-enter">
      <header className="medicine-detail-header app-fade-stagger">
        <button className="medicine-detail-back app-pressable" onClick={() => navigate(-1)} type="button" aria-label="Back">
          <FiArrowLeft />
        </button>
        <h1>Product Overview</h1>
        <button
          className="medicine-cart-btn app-pressable"
          type="button"
          aria-label="Open cart"
          onClick={() => {
            playAppSound("tap")
            navigate("/cart")
          }}
        >
          <FiShoppingCart />
          {totalItems > 0 && <span>{totalItems}</span>}
        </button>
      </header>

      <section className="medicine-detail-shell app-content-slide">
        <article className="medicine-hero-card app-fade-stagger">
          <div className="medicine-hero-media">
            <img src={currentMedicine.image} alt={currentMedicine.name} />
            <span className="hero-pill"><FiStar /> Trusted medicine</span>
          </div>
          <div className="medicine-hero-copy">
            <h2>{currentMedicine.name}</h2>
            <p>{currentMedicine.dose} • {currentMedicine.kind}</p>
            <span className={currentMedicine.inStock ? "availability in" : "availability out"}>
              {currentMedicine.inStock ? "Currently available" : "Currently unavailable"}
            </span>

            <div className="hero-facts">
              <article>
                <small>Form</small>
                <strong>{currentMedicine.kind}</strong>
              </article>
              <article>
                <small>Dose</small>
                <strong>{currentMedicine.dose}</strong>
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
          {openPanel === "about" && <p>{currentMedicine.overview}</p>}
        </article>

        <article className={`medicine-section app-fade-stagger ${openPanel === "uses" ? "expanded" : "collapsed"}`}>
          <button className="section-toggle app-pressable" type="button" onClick={() => togglePanel("uses")}>
            <h3>Common Uses</h3>
            {openPanel === "uses" ? <FiChevronUp /> : <FiChevronDown />}
          </button>
          {openPanel === "uses" && (
            <ul>
              {currentMedicine.uses.map((item) => (
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
              {currentMedicine.doseGuide.map((item) => (
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
                {currentMedicine.cautions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <div className="medical-note">
                <FiShield /> Always confirm dose and duration with your doctor.
              </div>
            </>
          )}
        </article>

        <section className="upsell-section app-fade-stagger">
          <div className="upsell-head">
            <h3>You may also need</h3>
            <p>Frequently bought with this medicine</p>
          </div>
          <div className="upsell-list">
            {upsells.map((item) => (
              <article key={item.id} className="upsell-card">
                <button type="button" className="upsell-main app-pressable" onClick={() => navigate(`/pharmacy/medicine/${item.id}`)}>
                  <img src={item.image} alt={item.name} loading="lazy" />
                  <div>
                    <h4>{item.name}</h4>
                    <p>{item.dose} • {item.kind}</p>
                  </div>
                </button>
                <button type="button" className="upsell-add app-pressable" onClick={() => addToCart(item)} disabled={!item.inStock}>
                  {item.inStock ? "Add" : "Out of stock"}
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="medicine-action-grid app-fade-stagger">
          <button
            className="cta-secondary app-pressable"
            type="button"
            onClick={() =>
              navigate("/ai-chat", {
                state: { prefill: `Can you explain ${currentMedicine.name} ${currentMedicine.dose} dose schedule and precautions for me?` },
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

      {showCartPopup && (
        <button
          type="button"
          className="cart-added-popup app-page-enter"
          onClick={() => {
            playAppSound("tap")
            navigate("/cart")
          }}
        >
          {lastAddedName} added to cart
        </button>
      )}

      <footer className="buy-bar app-fade-stagger">
        <button
          type="button"
          className="buy-bar-cart app-pressable"
          onClick={() => addToCart(currentMedicine)}
          disabled={!currentMedicine.inStock}
        >
          Add to Cart
        </button>
        <button
          type="button"
          className="buy-bar-buy app-pressable"
          onClick={handleBuyNow}
          disabled={!currentMedicine.inStock}
        >
          Buy Now
        </button>
      </footer>
    </main>
  )
}
