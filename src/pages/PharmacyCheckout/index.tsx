import { useMemo, useState } from "react"
import { FiArrowLeft, FiCheckCircle, FiMapPin, FiShield, FiTruck } from "react-icons/fi"
import { useNavigate } from "react-router-dom"
import { useCart } from "../../app/cart"
import { ensureEmployeeActor } from "../../services/actorsApi"
import { getEmployeeCompanySession } from "../../services/authApi"
import { createPharmacyOrder } from "../../services/pharmacyApi"
import { playAppSound } from "../../utils/sound"
import "./pharmacy-checkout.css"

const HOME_ADDRESS_KEY = "employee_home_address"

type Step = "address" | "review" | "confirm"

export default function PharmacyCheckout() {
  const navigate = useNavigate()
  const { items, totalItems, clearCart } = useCart()
  const companySession = getEmployeeCompanySession()
  const [step, setStep] = useState<Step>("address")
  const [selectedAddress, setSelectedAddress] = useState<"home" | "office" | "">("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const homeAddress = useMemo(() => localStorage.getItem(HOME_ADDRESS_KEY) ?? "", [])
  const officeAddress = `${companySession?.companyName ?? "Company"} Campus, Madhapur, Hyderabad - 500084`

  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0)

  if (items.length === 0) {
    return (
      <main className="checkout-page app-page-enter">
        <header className="checkout-header">
          <button className="checkout-back app-pressable" type="button" onClick={() => navigate(-1)}>
            <FiArrowLeft />
          </button>
          <h1>Checkout</h1>
        </header>
        <section className="checkout-shell">
          <div className="checkout-empty">
            <FiTruck />
            <h2>Your cart is empty</h2>
            <p>Add medicines to start checkout.</p>
            <button className="app-pressable" type="button" onClick={() => navigate("/pharmacy")}>Browse Pharmacy</button>
          </div>
        </section>
      </main>
    )
  }

  async function placeOrder() {
    setSubmitting(true)
    setError("")
    playAppSound("notify")
    try {
      const employee = await ensureEmployeeActor({
        companyReference: "astikan-demo-company",
        companyName: companySession?.companyName ?? "Astikan",
        fullName: "Astikan Employee",
        handle: "astikan-employee",
        email: "employee@astikan.local",
      })
      await createPharmacyOrder({
        companyReference: employee.companyId,
        companyName: companySession?.companyName ?? "Astikan",
        employee: {
          email: employee.email,
          fullName: "Astikan Employee",
          handle: employee.employeeCode,
          employeeCode: employee.employeeCode,
        },
        orderSource: "employee_store",
        subtotalInr: subtotal,
        walletUsedInr: 0,
        onlinePaymentInr: subtotal,
        items: items.map((item) => ({
          productId: item.id,
          sku: item.id,
          name: item.name,
          category: item.kind,
          description: `${item.dose} • ${item.kind}`,
          price: item.price,
          quantity: item.qty,
          imageUrls: [item.image],
        })),
      })
      clearCart()
      navigate("/pharmacy/booking-success", { state: { orderedItems: totalItems } })
    } catch {
      setError("We could not place the order. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="checkout-page app-page-enter">
      <header className="checkout-header">
        <button className="checkout-back app-pressable" type="button" onClick={() => navigate(-1)}>
          <FiArrowLeft />
        </button>
        <h1>Checkout</h1>
      </header>

      <section className="checkout-shell">
        <div className="checkout-steps">
          <div className={`checkout-step ${step !== "address" ? "done" : "active"}`}>
            <span>1</span>
            <p>Address</p>
          </div>
          <div className={`checkout-step ${step === "review" ? "active" : step === "confirm" ? "done" : ""}`}>
            <span>2</span>
            <p>Review</p>
          </div>
          <div className={`checkout-step ${step === "confirm" ? "active" : ""}`}>
            <span>3</span>
            <p>Confirm</p>
          </div>
          <div className={`checkout-track ${step}`} />
        </div>

        {step === "address" && (
          <section className="checkout-card">
            <h2>Select delivery address</h2>
            <div className="address-grid">
              <button
                type="button"
                className={`address-card app-pressable ${selectedAddress === "home" ? "active" : ""}`}
                onClick={() => setSelectedAddress("home")}
              >
                <FiMapPin />
                <div>
                  <h3>Home</h3>
                  <p>{homeAddress || "Add your home address in Settings."}</p>
                </div>
              </button>
              <button
                type="button"
                className={`address-card app-pressable ${selectedAddress === "office" ? "active" : ""}`}
                onClick={() => setSelectedAddress("office")}
              >
                <FiShield />
                <div>
                  <h3>Office</h3>
                  <p>{officeAddress}</p>
                </div>
              </button>
            </div>
            <button
              type="button"
              className="checkout-primary app-pressable"
              disabled={!selectedAddress}
              onClick={() => setStep("review")}
            >
              Continue to review
            </button>
          </section>
        )}

        {step === "review" && (
          <section className="checkout-card">
            <h2>Review your order</h2>
            <div className="review-list">
              {items.map((item) => (
                <div key={item.id} className="review-row">
                  <img src={item.image} alt={item.name} loading="lazy" />
                  <div>
                    <h4>{item.name}</h4>
                    <p>{item.qty} × ₹{item.price}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="review-summary">
              <div><span>Items</span><strong>{totalItems}</strong></div>
              <div><span>Subtotal</span><strong>₹{subtotal.toFixed(0)}</strong></div>
              <div><span>Delivery</span><strong>Free</strong></div>
            </div>
            <button type="button" className="checkout-primary app-pressable" onClick={() => setStep("confirm")}>
              Confirm & pay
            </button>
            <button type="button" className="checkout-link" onClick={() => setStep("address")}>
              Change address
            </button>
          </section>
        )}

        {step === "confirm" && (
          <section className="checkout-card confirm-card">
            <div className="confirm-hero">
              <FiTruck />
              <div>
                <h2>Final confirmation</h2>
                <p>We will deliver in 10 minutes to your {selectedAddress} address.</p>
              </div>
            </div>
            {error && <div className="checkout-error">{error}</div>}
            <button
              type="button"
              className="checkout-primary app-pressable"
              onClick={placeOrder}
              disabled={submitting}
            >
              {submitting ? "Placing order..." : "Place order"}
            </button>
            {!submitting && (
              <div className="confirm-safe">
                <FiCheckCircle />
                Secure checkout & verified pharmacy
              </div>
            )}
          </section>
        )}
      </section>
    </main>
  )
}
