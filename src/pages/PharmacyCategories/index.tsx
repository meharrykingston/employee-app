import { FiArrowLeft, FiChevronRight } from "react-icons/fi"
import { useLocation, useNavigate } from "react-router-dom"
import "./pharmacy-categories.css"

const categories = [
  { id: "nutritional", name: "Nutritional Drinks", icon: "🥤", desc: "Protein, immunity and recovery drinks" },
  { id: "ayurveda", name: "Ayurveda", icon: "🌿", desc: "Herbal and traditional wellness products" },
  { id: "vitamins", name: "Vitamins & Supplement", icon: "💊", desc: "Daily nutrition and support capsules" },
  { id: "devices", name: "Devices", icon: "🩺", desc: "BP monitor, thermometer and glucometer" },
  { id: "skincare", name: "Skin Care", icon: "🧴", desc: "Creams, gels and treatment essentials" },
  { id: "personal", name: "Personal Care", icon: "🧼", desc: "Daily hygiene and self-care products" },
]

export default function PharmacyCategories() {
  const navigate = useNavigate()
  const { state } = useLocation() as { state?: { selectedCategory?: string } }
  const selected = state?.selectedCategory

  return (
    <main className="pharma-cat-page app-page-enter">
      <header className="pharma-cat-header app-fade-stagger">
        <button className="pharma-cat-back app-pressable" type="button" aria-label="Back" onClick={() => navigate(-1)}>
          <FiArrowLeft />
        </button>
        <div>
          <h1>Popular Categories</h1>
          <p>Browse all top medicine categories</p>
        </div>
      </header>

      <section className="pharma-cat-shell app-content-slide">
        <div className="pharma-cat-list">
          {categories.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`pharma-cat-item app-pressable ${selected === item.name ? "active" : ""}`}
            >
              <span className="pharma-cat-icon">{item.icon}</span>
              <div className="pharma-cat-copy">
                <h3>{item.name}</h3>
                <p>{item.desc}</p>
              </div>
              <FiChevronRight />
            </button>
          ))}
        </div>
      </section>
    </main>
  )
}
