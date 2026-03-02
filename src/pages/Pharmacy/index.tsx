import { useMemo, useRef, useState } from "react"
import {
  FiActivity,
  FiArrowLeft,
  FiCamera,
  FiChevronRight,
  FiHeart,
  FiHome,
  FiPackage,
  FiSearch,
  FiShoppingCart,
  FiUpload,
  FiUser,
} from "react-icons/fi"
import { useNavigate } from "react-router-dom"
import { medicines } from "./medicineData"
import { goBackOrFallback } from "../../utils/navigation"
import { useCart } from "../../app/cart"
import { playAppSound } from "../../utils/sound"
import "./pharmacy.css"

const categories = [
  { name: "Nutritional Drinks", icon: "🥤" },
  { name: "Ayurveda", icon: "🌿" },
  { name: "Vitamins & Supplement", icon: "💊" },
  { name: "Devices", icon: "🩺" },
  { name: "Skin Care", icon: "🧴" },
  { name: "Personal Care", icon: "🧼" },
]

const pharmaTabs = [
  { id: "Home", route: "/home", icon: <FiHome /> },
  { id: "Medicines", route: "/pharmacy", icon: <FiPackage /> },
  { id: "Doctor", route: "/teleconsultation", icon: <FiActivity /> },
  { id: "Stress Relief", route: "/stress-relief", icon: <FiHeart /> },
  { id: "Profile", route: "/settings", icon: <FiUser /> },
] as const

export default function Pharmacy() {
  const navigate = useNavigate()
  const { totalItems } = useCart()
  const [query, setQuery] = useState("")
  const [uploadStatus, setUploadStatus] = useState("Upload a Prescription and tell us what you need. We do the rest.")
  const [isMenuDocked, setIsMenuDocked] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return medicines
    return medicines.filter((item) => `${item.name} ${item.dose} ${item.kind}`.toLowerCase().includes(q))
  }, [query])

  function onPrescriptionPicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadStatus(`Uploaded: ${file.name}`)
    e.target.value = ""
  }

  function onPageScroll(e: React.UIEvent<HTMLElement>) {
    const nextDocked = e.currentTarget.scrollTop > 40
    setIsMenuDocked((prev) => (prev === nextDocked ? prev : nextDocked))
  }

  return (
    <main className="pharmacy-page app-page-enter" onScroll={onPageScroll}>
      <header className="pharma-header app-fade-stagger">
        <button className="pharma-back app-pressable" onClick={() => goBackOrFallback(navigate)} type="button" aria-label="Back">
          <FiArrowLeft />
        </button>

        <h1>MEDICINE</h1>

        <button
          className="cart-btn app-pressable"
          type="button"
          aria-label="Cart"
          onClick={() => {
            playAppSound("tap")
            navigate("/cart")
          }}
        >
          <FiShoppingCart />
          {totalItems > 0 && <span>{totalItems}</span>}
        </button>
      </header>

      <nav className={`pharma-menu app-fade-stagger ${isMenuDocked ? "docked" : ""}`}>
        {pharmaTabs.map((tab) => (
          <button
            key={tab.id}
            className={`pharma-menu-item app-pressable ${tab.id === "Medicines" ? "active" : ""}`}
            onClick={() => navigate(tab.route)}
            type="button"
          >
            <span className="pharma-menu-icon">{tab.icon}</span>
            <span>{tab.id}</span>
          </button>
        ))}
      </nav>

      <section className="pharma-content app-content-slide">
        <div className="medicine-search app-fade-stagger">
          <FiSearch />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Medicine & Health Products"
          />
        </div>

        <article className="rx-card app-fade-stagger">
          <h2>UPLOAD PRESCRIPTION</h2>
          <p>{uploadStatus}</p>
          <div className="rx-actions">
            <button className="app-pressable" type="button" onClick={() => photoInputRef.current?.click()}>
              <FiCamera />
              Camera
            </button>
            <button className="app-pressable" type="button" onClick={() => fileInputRef.current?.click()}>
              <FiUpload />
              Upload
            </button>
          </div>
        </article>

        <section className="category-section app-fade-stagger">
          <div className="section-row">
            <h3>Popular Categories</h3>
            <button
              type="button"
              className="see-all app-pressable"
              onClick={() => navigate("/pharmacy/categories")}
            >
              SEE ALL
            </button>
          </div>
          <div className="category-grid">
            {categories.map((item) => (
              <button
                key={item.name}
                className="category-card app-pressable"
                type="button"
                onClick={() => navigate("/pharmacy/categories", { state: { selectedCategory: item.name } })}
              >
                <div className="category-thumb">{item.icon}</div>
                <h4>{item.name}</h4>
              </button>
            ))}
          </div>
        </section>

        <section className="medicine-list app-fade-stagger">
          <h3>Popular Medicines</h3>
          {filtered.map((item) => (
            <button
              key={item.id}
              className="medicine-card app-pressable"
              type="button"
              onClick={() => navigate(`/pharmacy/medicine/${item.id}`)}
            >
              <div className="pill-icon">💊</div>
              <div className="medicine-info">
                <h4>{item.name} {item.dose}</h4>
                <p>{item.kind}</p>
                <div className="medicine-tags">
                  <span className={item.inStock ? "stock" : "out"}>{item.inStock ? "In Stock" : "Out of Stock"}</span>
                </div>
                <span className="medicine-open">
                  Product Overview
                  <FiChevronRight />
                </span>
              </div>
            </button>
          ))}
        </section>
      </section>

      <input ref={fileInputRef} type="file" accept=".pdf,image/*" className="pharma-file" onChange={onPrescriptionPicked} />
      <input ref={photoInputRef} type="file" accept="image/*" capture="environment" className="pharma-file" onChange={onPrescriptionPicked} />
    </main>
  )
}
