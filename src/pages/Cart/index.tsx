import { FiArrowLeft, FiGift, FiMinus, FiPlus, FiShoppingBag, FiTrash2, FiTruck } from "react-icons/fi"
import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useCart } from "../../app/cart"
import { fetchPharmacyProducts, lookupPharmacyProducts } from "../../services/pharmacyApi"
import { mapProductToMedicine, medicines, type MedicineItem } from "../Pharmacy/medicineData"
import { playAppSound } from "../../utils/sound"
import "./cart.css"

export default function CartPage() {
  const navigate = useNavigate()
  const { items, totalItems, removeItem, updateQty, addItem, syncItems } = useCart()
  const primaryAddress = localStorage.getItem("employee_primary_address") ?? "Home"
  const [catalog, setCatalog] = useState<MedicineItem[]>([])
  const idsKey = useMemo(() => items.map((item) => item.id).sort().join("|"), [items])
  const hasOutOfStock = items.some((item) => !item.inStock)

  const upsells = useMemo(() => {
    const ids = new Set(items.map((item) => item.id))
    const source = catalog.length ? catalog : medicines
    return source.filter((item) => !ids.has(item.id)).slice(0, 3)
  }, [items, catalog])


  useEffect(() => {
    let active = true
    async function loadCatalog() {
      try {
        const rows = await fetchPharmacyProducts({ limit: 24, audience: "employee" })
        if (!active || !rows?.length) return
        setCatalog(rows.map((row, index) => mapProductToMedicine(row, index)))
      } catch {
        if (active) setCatalog([])
      }
    }
    loadCatalog()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true
    async function syncCart() {
      if (!idsKey) return
      try {
        const rows = await lookupPharmacyProducts(idsKey.split("|").filter(Boolean), "employee")
        if (!active || !rows?.length) return
        const mapped = rows.map((row, index) => mapProductToMedicine(row, index))
        syncItems(
          mapped.map((item) => ({
            id: item.id,
            name: item.name,
            dose: item.dose,
            kind: item.kind,
            image: item.image,
            inStock: item.inStock,
            price: item.price ?? 0,
          }))
        )
      } catch {
      // keep local cart if sync fails
      }
    }
    syncCart()
    return () => {
      active = false
    }
  }, [idsKey, syncItems])

  return (
    <main className="cart-page app-page-enter">
      <header className="cart-header app-fade-stagger">
        <button className="cart-back app-pressable" type="button" onClick={() => navigate(-1)} aria-label="Back">
          <FiArrowLeft />
        </button>
        <div>
          <h1>Your Cart</h1>
          <p>{totalItems} items â€¢ delivery in 10 mins</p>
        </div>
      </header>

      <section className="cart-content app-content-slide">
        <article className="cart-banner app-fade-stagger">
          <FiTruck />
          <div>
            <strong>Fast doorstep delivery</strong>
            <p>On-time fulfillment with verified pharmacy handling</p>
          </div>
        </article>

        {items.length === 0 && (
          <article className="cart-empty app-fade-stagger">
            <FiShoppingBag />
            <h2>Your cart is empty</h2>
            <p>Add medicines and health essentials to continue.</p>
            <button
              className="app-pressable"
              type="button"
              onClick={() => {
                playAppSound("tap")
                navigate("/pharmacy")
              }}
            >
              Browse Pharmacy
            </button>
          </article>
        )}

        {items.length > 0 && (
          <section className="cart-list app-fade-stagger">
            {items.map((item) => (
              <article key={item.id} className="cart-item">
                <button type="button" className="cart-item-main app-pressable" onClick={() => navigate(`/pharmacy/medicine/${item.id}`)}>
                  <img src={item.image} alt={item.name} loading="lazy" />
                  <div>
                    <h3>{item.name}</h3>
                    <p>{item.dose} • {item.kind}</p>
                    <span className={`stock-pill ${item.inStock ? "in" : "out"}`}>
                      {item.inStock ? "Doctor-trusted care essential" : "Out of stock — replace item"}
                    </span>
                  </div>
                </button>

                <div className="cart-item-right">
                  <button
                    type="button"
                    className="cart-remove app-pressable"
                    onClick={() => {
                      playAppSound("error")
                      removeItem(item.id)
                    }}
                    aria-label={`Remove ${item.name}`}
                  >
                    <FiTrash2 />
                  </button>
                  <div className="qty-box">
                    <button
                      type="button"
                      className="app-pressable"
                      onClick={() => {
                        playAppSound("tap")
                        updateQty(item.id, item.qty - 1)
                      }}
                      aria-label={`Decrease ${item.name}`}
                    >
                      <FiMinus />
                    </button>
                    <strong>{item.qty}</strong>
                    <button
                      type="button"
                      className="app-pressable"
                      onClick={() => {
                        playAppSound("tap")
                        updateQty(item.id, item.qty + 1)
                      }}
                      aria-label={`Increase ${item.name}`}
                    >
                      <FiPlus />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}

        <section className="cart-upsells app-fade-stagger">
          <div className="upsells-head">
            <h3>Add More Essentials</h3>
            <p>Frequently added together</p>
          </div>
          <div className="upsells-grid">
            {upsells.map((item) => (
              <article key={item.id} className="upsell-row">
                <button type="button" className="upsell-link app-pressable" onClick={() => navigate(`/pharmacy/medicine/${item.id}`)}>
                  <img src={item.image} alt={item.name} loading="lazy" />
                  <div>
                    <h4>{item.name}</h4>
                    <p>{item.dose}</p>
                  </div>
                </button>
                <button
                  type="button"
                  className="upsell-add app-pressable"
                  onClick={() => {
                    addItem(item)
                    playAppSound("success")
                  }}
                  disabled={!item.inStock}
                >
                  {item.inStock ? "Add" : "Out"}
                </button>
              </article>
            ))}
          </div>
        </section>
      </section>

      {items.length > 0 && (
        <footer className="cart-footer app-fade-stagger">
          <div className="coupon">
            <FiGift />
            <span>Priority dispatch and secure packaging enabled</span>
          </div>
          {hasOutOfStock && (
            <div className="cart-stock-alert">
              Some items are out of stock. Remove or replace them to continue.
            </div>
          )}
          <div className="bill">
            <div className="cart-delivery-banner">
              <div>
                <h4>Delivery in 15 mins</h4>
                <p>Delivering to {primaryAddress}</p>
              </div>
              <span className="delivery-badge">Fast</span>
            </div>
          </div>
          <button
            type="button"
            className="checkout-btn app-pressable"
            disabled={hasOutOfStock}
            onClick={() => {
              playAppSound("notify")
              navigate("/pharmacy/checkout")
            }}
          >
            Proceed to checkout
          </button>
        </footer>
      )}
    </main>
  )
}

