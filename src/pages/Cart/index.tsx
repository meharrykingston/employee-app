import { FiArrowLeft, FiGift, FiMinus, FiPlus, FiShoppingBag, FiTrash2, FiTruck } from "react-icons/fi"
import { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useCart } from "../../app/cart"
import { medicines } from "../Pharmacy/medicineData"
import "./cart.css"

export default function CartPage() {
  const navigate = useNavigate()
  const { items, totalItems, removeItem, updateQty, addItem } = useCart()

  const upsells = useMemo(() => {
    const ids = new Set(items.map((item) => item.id))
    return medicines.filter((item) => !ids.has(item.id)).slice(0, 3)
  }, [items])

  return (
    <main className="cart-page app-page-enter">
      <header className="cart-header app-fade-stagger">
        <button className="cart-back app-pressable" type="button" onClick={() => navigate(-1)} aria-label="Back">
          <FiArrowLeft />
        </button>
        <div>
          <h1>Your Cart</h1>
          <p>{totalItems} items • delivery in 10 mins</p>
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
            <button className="app-pressable" type="button" onClick={() => navigate("/pharmacy")}>Browse Pharmacy</button>
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
                    <span>Doctor-trusted care essential</span>
                  </div>
                </button>

                <div className="cart-item-right">
                  <button type="button" className="cart-remove app-pressable" onClick={() => removeItem(item.id)} aria-label={`Remove ${item.name}`}>
                    <FiTrash2 />
                  </button>
                  <div className="qty-box">
                    <button type="button" className="app-pressable" onClick={() => updateQty(item.id, item.qty - 1)} aria-label={`Decrease ${item.name}`}>
                      <FiMinus />
                    </button>
                    <strong>{item.qty}</strong>
                    <button type="button" className="app-pressable" onClick={() => updateQty(item.id, item.qty + 1)} aria-label={`Increase ${item.name}`}>
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
                <button type="button" className="upsell-add app-pressable" onClick={() => addItem(item)} disabled={!item.inStock}>
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
          <div className="bill">
            <p><span>Prescription validation</span><strong>Included</strong></p>
            <p><span>Quality assurance check</span><strong>Included</strong></p>
            <p><span>Doorstep delivery</span><strong>Enabled</strong></p>
          </div>
          <button type="button" className="checkout-btn app-pressable" onClick={() => navigate("/wallet")}>
            Confirm Order
          </button>
        </footer>
      )}
    </main>
  )
}
