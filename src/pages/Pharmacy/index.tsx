import { useEffect, useMemo, useRef, useState } from "react"
import {
  FiActivity,
  FiArrowLeft,
  FiCamera,
  FiHeart,
  FiHome,
  FiPackage,
  FiSearch,
  FiShoppingCart,
  FiUpload,
  FiUser,
} from "react-icons/fi"
import { useLocation, useNavigate } from "react-router-dom"
import { fetchPharmacyCategories, fetchPharmacyProducts } from "../../services/pharmacyApi"
import { parsePrescriptionImage } from "../../services/aiApi"
import { mapProductToMedicine, medicines, type MedicineItem } from "./medicineData"
import { goBackOrFallback } from "../../utils/navigation"
import { useCart } from "../../app/cart"
import { playAppSound } from "../../utils/sound"
import "./pharmacy.css"

const fallbackCategories = [
  { name: "Nutritional Drinks", icon: "🥤" },
  { name: "Ayurveda", icon: "🌿" },
  { name: "Vitamins & Supplement", icon: "💊" },
  { name: "Devices", icon: "🩺" },
  { name: "Skin Care", icon: "🧴" },
  { name: "Personal Care", icon: "🧼" },
  { name: "Pain Relief", icon: "🩹" },
  { name: "Cold & Flu", icon: "🤧" },
  { name: "Diabetes Care", icon: "🧪" },
  { name: "Heart Health", icon: "❤️" },
  { name: "Digestive", icon: "🍽️" },
  { name: "Baby Care", icon: "🍼" },
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
  const { state } = useLocation() as { state?: { selectedCategory?: string } }
  const { totalItems } = useCart()
  const [query, setQuery] = useState("")
  const [uploadStatus, setUploadStatus] = useState("Upload a Prescription and tell us what you need. We do the rest.")
  const [isMenuDocked, setIsMenuDocked] = useState(false)
  const [catalog, setCatalog] = useState<MedicineItem[]>([])
  const [loadingCatalog, setLoadingCatalog] = useState(true)
  const [activeCategory, setActiveCategory] = useState(state?.selectedCategory ?? "")
  const [liveCategories, setLiveCategories] = useState<Array<{ name: string; icon?: string }>>([])
  const [isProcessingRx, setIsProcessingRx] = useState(false)
  const [rxProcessingNote, setRxProcessingNote] = useState("Reading prescription...")
  const [rxMatches, setRxMatches] = useState<MedicineItem[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

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
    let active = true
    async function loadCategories() {
      try {
        const rows = await fetchPharmacyCategories("employee")
        if (!active) return
        const normalized = rows.map((row) => ({ name: row.name, icon: "💊" }))
        setLiveCategories(normalized)
      } catch {
        if (active) setLiveCategories([])
      }
    }
    loadCategories()
    return () => {
      active = false
    }
  }, [])

  const sourceItems = catalog.length ? catalog : medicines
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return sourceItems.filter((item) => {
      const matchesQuery = !q || `${item.name} ${item.dose} ${item.kind}`.toLowerCase().includes(q)
      const matchesCategory = !activeCategory || item.kind === activeCategory
      return matchesQuery && matchesCategory
    })
  }, [query, sourceItems, activeCategory])

  async function onPrescriptionPicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ""

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
    const isImage = file.type.startsWith("image/")
    if (!isPdf && !isImage) {
      setUploadStatus("Please upload a PDF or image file only.")
      return
    }

    if (isPdf) {
      setUploadStatus(`Uploaded: ${file.name}. Use a photo for instant AI detection.`)
      return
    }

    setUploadStatus(`Processing: ${file.name}`)
    setRxProcessingNote("Reading prescription...")
    setIsProcessingRx(true)
    setRxMatches([])

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result || ""))
        reader.onerror = () => reject(new Error("Unable to read file"))
        reader.readAsDataURL(file)
      })

      setRxProcessingNote("Analyzing with AI...")
      const parsed = await parsePrescriptionImage({
        imageBase64: dataUrl,
        fileName: file.name,
        mimeType: file.type,
      })

      const names = parsed.medicines
        .map((item) => item.name?.trim())
        .filter((name): name is string => !!name)
        .slice(0, 8)

      if (names.length === 0) {
        setUploadStatus("We could not detect medicines. Please upload a clearer photo.")
        return
      }

      setRxProcessingNote("Matching medicines in inventory...")
      const matches = await Promise.all(
        names.map(async (name) => {
          try {
            const rows = await fetchPharmacyProducts({ search: name, limit: 1, audience: "employee" })
            if (rows?.[0]) {
              return mapProductToMedicine(rows[0], 0)
            }
            return null
          } catch {
            return null
          }
        })
      )

      const unique = new Map<string, MedicineItem>()
      matches.forEach((item) => {
        if (item && !unique.has(item.id)) {
          unique.set(item.id, item)
        }
      })

      const list = Array.from(unique.values())
      if (list.length === 0) {
        setUploadStatus("Prescription detected, but no matching inventory found.")
        return
      }

      setRxMatches(list)
      setUploadStatus(`Prescription processed. Found ${list.length} medicines.`)
      setQuery("")
      setActiveCategory("")
    } catch {
      setUploadStatus("Unable to process prescription right now. Please retry.")
    } finally {
      setIsProcessingRx(false)
    }
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
        {activeCategory && (
          <div className="active-category-pill app-fade-stagger">
            <span>{activeCategory}</span>
            <button type="button" className="app-pressable" onClick={() => setActiveCategory("")}>Clear</button>
          </div>
        )}

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

        {rxMatches.length > 0 && (
          <section className="rx-results app-fade-stagger">
            <div className="section-row">
              <h3>Prescription Results</h3>
              <button type="button" className="see-all app-pressable" onClick={() => navigate("/cart")}>
                View Cart
              </button>
            </div>
            <div className="medicine-grid">
              {rxMatches.map((item) => (
                <button
                  key={item.id}
                  className="medicine-card app-pressable"
                  type="button"
                  onClick={() => navigate(`/pharmacy/medicine/${item.id}`)}
                >
                  <div className="medicine-thumb">
                    <img src={item.image} alt={item.name} loading="lazy" />
                  </div>
                  <div className="medicine-info">
                    <h4>{item.name} {item.dose}</h4>
                    <p>{item.kind}</p>
                    <div className="medicine-tags">
                      <span className="eta">In 5 mins</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

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
            {(liveCategories.length ? liveCategories : fallbackCategories).slice(0, 6).map((item) => (
              <button
                key={item.name}
                className="category-card app-pressable"
                type="button"
                onClick={() => {
                  setActiveCategory(item.name)
                }}
              >
                <div className="category-thumb">{item.icon}</div>
                <h4>{item.name}</h4>
              </button>
            ))}
          </div>
        </section>

        <section className="medicine-list app-fade-stagger">
          <h3>Popular Medicines</h3>
          {loadingCatalog && (
            <div className="pharmacy-loading">Loading live pharmacy catalog...</div>
          )}
          <div className="medicine-grid">
            {filtered.map((item) => (
              <button
                key={item.id}
                className="medicine-card app-pressable"
                type="button"
                onClick={() => navigate(`/pharmacy/medicine/${item.id}`)}
              >
                <div className="medicine-thumb">
                  <img src={item.image} alt={item.name} loading="lazy" />
                </div>
                <div className="medicine-info">
                  <h4>{item.name} {item.dose}</h4>
                  <p>{item.kind}</p>
                  <div className="medicine-tags">
                    <span className="eta">In 5 mins</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      </section>

      <input ref={fileInputRef} type="file" accept=".pdf,image/*" className="pharma-file" onChange={onPrescriptionPicked} />
      <input ref={photoInputRef} type="file" accept="image/*" capture="environment" className="pharma-file" onChange={onPrescriptionPicked} />

      {isProcessingRx && (
        <div className="rx-processing-overlay">
          <div className="rx-processing-card app-page-enter">
            <div className="rx-spinner" aria-hidden="true" />
            <h4>Analyzing prescription</h4>
            <p>{rxProcessingNote}</p>
          </div>
        </div>
      )}
    </main>
  )
}
