import { useMemo, useRef, useState } from "react"
import {
  FiArrowLeft,
  FiCamera,
  FiCheck,
  FiClock,
  FiHome,
  FiMapPin,
  FiMinus,
  FiPackage,
  FiPlus,
  FiShoppingCart,
  FiTruck,
  FiUpload,
} from "react-icons/fi"
import { useNavigate } from "react-router-dom"
import "./pharmacy.css"

type Medicine = {
  id: string
  name: string
  dose: string
  kind: string
  brand: string
  inStock: boolean
  rxRequired?: boolean
}

const medicines: Medicine[] = [
  { id: "paracetamol", name: "Paracetamol", dose: "500mg", kind: "Tablet", brand: "Generic Pharma", inStock: true },
  { id: "ibuprofen", name: "Ibuprofen", dose: "400mg", kind: "Tablet", brand: "HealthCare Ltd", inStock: true },
  { id: "amoxicillin", name: "Amoxicillin", dose: "250mg", kind: "Capsule", brand: "MediCare", inStock: true, rxRequired: true },
  { id: "vitamin-d3", name: "Vitamin D3", dose: "60000 IU", kind: "Capsule", brand: "Wellness Co", inStock: true },
  { id: "cetirizine", name: "Cetirizine", dose: "10mg", kind: "Tablet", brand: "AllergyCare", inStock: true },
  { id: "metformin", name: "Metformin", dose: "500mg", kind: "Tablet", brand: "DiabetesCare", inStock: false, rxRequired: true },
]

export default function Pharmacy() {
  const navigate = useNavigate()
  const [view, setView] = useState<"browse" | "cart" | "placed">("browse")
  const [query, setQuery] = useState("")
  const [uploadStatus, setUploadStatus] = useState("Upload and we'll prepare your order")
  const [cart, setCart] = useState<Record<string, number>>({
    paracetamol: 3,
    amoxicillin: 5,
    "vitamin-d3": 2,
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return medicines
    return medicines.filter((item) => `${item.name} ${item.dose} ${item.kind} ${item.brand}`.toLowerCase().includes(q))
  }, [query])

  const cartCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0)
  const cartItems = medicines.filter((item) => (cart[item.id] ?? 0) > 0)

  function addToCart(id: string) {
    const item = medicines.find((x) => x.id === id)
    if (!item || !item.inStock) return
    setCart((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }))
  }

  function changeQty(id: string, delta: number) {
    setCart((prev) => {
      const next = Math.max(0, (prev[id] ?? 0) + delta)
      if (next === 0) {
        const { [id]: _removed, ...rest } = prev
        return rest
      }
      return { ...prev, [id]: next }
    })
  }

  function onPrescriptionPicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadStatus(`Uploaded: ${file.name}`)
    e.target.value = ""
  }

  return (
    <main className="pharmacy-page app-page-enter">
      <header className="pharma-header app-fade-stagger">
        <button className="pharma-back app-pressable" onClick={() => navigate("/home")} type="button" aria-label="Back">
          <FiArrowLeft />
        </button>

        <div className="pharma-title">
          <h1>Medicine Delivery</h1>
          <p>Order medicines & get Office Delivered</p>
        </div>

        {view !== "placed" && (
          <button className="cart-btn app-pressable" type="button" onClick={() => setView("cart")}>
            <FiShoppingCart />
            Cart
            <span>{cartCount}</span>
          </button>
        )}
      </header>

      <section className="pharma-address app-fade-stagger">
        <FiMapPin />
        <p>Delivering to: <strong>HCL - Tech , B- 45 , Near ES...</strong></p>
        <button className="app-pressable" type="button">Change</button>
      </section>

      <section className="pharma-content app-content-slide">
        {view === "browse" && (
          <>
            <article className="rx-card app-fade-stagger">
              <div>
                <h2>Have a Prescription?</h2>
                <p>{uploadStatus}</p>
              </div>
              <FiPackage className="rx-badge" />
              <div className="rx-actions">
                <button className="app-pressable" type="button" onClick={() => photoInputRef.current?.click()}>
                  <FiCamera />
                  Take Photo
                </button>
                <button className="app-pressable" type="button" onClick={() => fileInputRef.current?.click()}>
                  <FiUpload />
                  Upload File
                </button>
              </div>
            </article>

            <div className="medicine-search app-fade-stagger">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for medicines.."
              />
            </div>

            <section className="medicine-list app-fade-stagger">
              <h3>Popular Medicines</h3>
              {filtered.map((item) => (
                <article key={item.id} className="medicine-card">
                  <div className="pill-icon">◠</div>
                  <div className="medicine-info">
                    <h4>{item.name} {item.dose}</h4>
                    <p>{item.kind} • {item.brand}</p>
                    <div className="medicine-tags">
                      <span className={item.inStock ? "stock" : "out"}>{item.inStock ? "In Stock" : "Out of Stock"}</span>
                      {item.rxRequired && <span className="rx">Rx Required</span>}
                    </div>
                    {item.inStock && (
                      <button className="add-cart app-pressable" type="button" onClick={() => addToCart(item.id)}>
                        <FiPlus />
                        Add to Cart
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </section>
          </>
        )}

        {view === "cart" && (
          <>
            <section className="cart-section app-fade-stagger">
              <h3>Your Cart</h3>
              <div className="cart-list">
                {cartItems.map((item) => (
                  <article key={item.id} className="cart-card">
                    <div className="pill-icon">◠</div>
                    <div className="cart-info">
                      <h4>{item.name} {item.dose}</h4>
                      <p>{item.brand.toUpperCase()}</p>
                    </div>
                    <div className="qty-box">
                      <button type="button" onClick={() => changeQty(item.id, -1)}><FiMinus /></button>
                      <span>{cart[item.id]}</span>
                      <button type="button" onClick={() => changeQty(item.id, 1)}><FiPlus /></button>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <div className="cart-actions app-fade-stagger">
              <button type="button" className="add-more app-pressable" onClick={() => setView("browse")}>Add More Item</button>
              <button type="button" className="place-order app-pressable" onClick={() => setView("placed")}>
                <FiTruck />
                Place Order
              </button>
            </div>

            <article className="delivery-banner app-fade-stagger">
              <h4>Medicine delivered in 10 minutes</h4>
            </article>
          </>
        )}

        {view === "placed" && (
          <section className="placed-view app-fade-stagger">
            <div className="placed-icon"><FiCheck /></div>
            <h2>Order Placed</h2>
            <p>Your medicines will be delivered soon</p>

            <article className="order-detail">
              <div className="order-head">
                <div>
                  <span>Order ID</span>
                  <strong>#MED1234567</strong>
                </div>
                <em>Processing</em>
              </div>

              <div className="order-row">
                <FiClock />
                <div>
                  <span>Estimated Delivery</span>
                  <strong>20-30 minutes</strong>
                </div>
              </div>

              <div className="order-row">
                <FiHome />
                <div>
                  <span>Delivery Address</span>
                  <strong>Home - 123 Main St</strong>
                </div>
              </div>
            </article>

            <article className="partner-card">
              <FiTruck />
              <h3>Delivery Partner Assigned</h3>
              <p>Tracking will update shortly</p>
            </article>

            <button className="track-btn app-pressable" type="button">Track Order</button>
          </section>
        )}
      </section>

      <input ref={fileInputRef} type="file" accept=".pdf,image/*" className="pharma-file" onChange={onPrescriptionPicked} />
      <input ref={photoInputRef} type="file" accept="image/*" capture="environment" className="pharma-file" onChange={onPrescriptionPicked} />
    </main>
  )
}

