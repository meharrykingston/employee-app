import { useEffect, useState } from "react"
import { FiAlertCircle, FiArrowLeft, FiCalendar, FiCheck, FiFileText, FiMapPin } from "react-icons/fi"
import { RiTestTubeLine } from "react-icons/ri"
import { useLocation, useNavigate } from "react-router-dom"
import { ensureEmployeeActor } from "../../services/actorsApi"
import { getEmployeeCompanySession } from "../../services/authApi"
import { bookLabOrder } from "../../services/labApi"
import { addNotification, pushBrowserNotification } from "../../services/notificationCenter"
import { goBackOrFallback } from "../../utils/navigation"
import { playAppSound } from "../../utils/sound"
import "./labtest.css"

type LabTestItem = {
  id?: string
  code?: string
  name: string
}

type LabBooking = {
  id: string
  bookingId: string
  status: string
  testName: string
  collectionType: string
  scheduledAt: string
  createdAt: string
  etaMinutes?: number
  etaStartAt?: string
}

const LAB_BOOKINGS_KEY = "lab_bookings"

function storeLabBooking(input: LabBooking) {
  const raw = localStorage.getItem(LAB_BOOKINGS_KEY)
  let existing: LabBooking[] = []
  if (raw) {
    try {
      existing = JSON.parse(raw) as LabBooking[]
    } catch {
      existing = []
    }
  }
  const next = [input, ...existing.filter((item) => item.id !== input.id)].slice(0, 50)
  localStorage.setItem(LAB_BOOKINGS_KEY, JSON.stringify(next))
}

export default function LabConfirm() {
  const navigate = useNavigate()
  const [phase, setPhase] = useState<"processing" | "confirmed" | "failed">("processing")
  const [bookingId, setBookingId] = useState<string>("")
  const [errorMessage, setErrorMessage] = useState<string>("")
  const { state } = useLocation() as {
    state?: {
      selectedTest?: LabTestItem
      collectionType?: string
      date?: string
      time?: string
      etaMinutes?: number
      etaStartAt?: string
      readiness?: Record<string, "yes" | "no">
    }
  }

  const dateTime = state?.date ? `${state.date}${state?.time ? ` ${state.time}` : ""}` : "Arriving in 5 mins"
  const companySession = getEmployeeCompanySession()
  const collectionType = state?.collectionType === "office" ? "Office Collection" : "Home Collection"
  const selectedTest = state?.selectedTest?.name ?? "Complete Blood Count (CBC)"

  useEffect(() => {
    let active = true

    void (async () => {
      try {
        const employee = await ensureEmployeeActor({
          companyReference: "astikan-demo-company",
          companyName: companySession?.companyName ?? "Astikan",
          fullName: "Astikan Employee",
          handle: "astikan-employee",
          email: "employee@astikan.local",
        })

        const response = await bookLabOrder({
          companyReference: employee.companyId,
          companyName: companySession?.companyName ?? "Astikan",
          email: employee.email,
          customer_name: "Astikan Employee",
          mobile: "9999999999",
          test_name: selectedTest,
          test_id: state?.selectedTest?.id,
          testid: state?.selectedTest?.id,
          test_code: state?.selectedTest?.code,
          test_parameter: state?.selectedTest?.name,
          amount: 999,
          date: state?.date,
          time: state?.time,
          collection_type: collectionType,
          readiness: state?.readiness ?? {},
        })
        const ref =
          (response?.providerReference as string | undefined) ??
          (response?.reference_id as string | undefined) ??
          (response?.order_id as string | undefined) ??
          (response?.localOrderId as string | undefined)
        if (response?.success && ref) {
          const bookingIdValue = String(ref)
          const localOrderId =
            (response?.localOrderId as string | undefined) ?? bookingIdValue
          const status = String(response?.providerStatus ?? "created")
          const scheduledAtValue = state?.date
            ? new Date(dateTime).toISOString()
            : new Date().toISOString()
          storeLabBooking({
            id: localOrderId,
            bookingId: bookingIdValue,
            status,
            testName: selectedTest,
            collectionType,
            scheduledAt: scheduledAtValue,
            createdAt: new Date().toISOString(),
            etaMinutes: state?.etaMinutes,
            etaStartAt: state?.etaStartAt,
          })
          await addNotification({
            title: "Lab booking confirmed",
            body: `${selectedTest} scheduled for ${collectionType}.`,
            channel: "health",
            cta: { label: "Track Status", route: `/lab-tests/track/${localOrderId}` },
          })
          await pushBrowserNotification(
            "Lab booking confirmed",
            `${selectedTest} scheduled for ${collectionType}.`,
          )
          playAppSound("success")
          setBookingId(bookingIdValue)
          if (active) setPhase("confirmed")
        } else {
          setErrorMessage("Booking could not be confirmed yet.")
          await addNotification({
            title: "Lab booking pending",
            body: "We are verifying your booking with the lab partner.",
            channel: "health",
            cta: { label: "View Booking", route: "/bookings" },
          })
          if (active) setPhase("failed")
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Booking failed."
        setErrorMessage(message)
        if (active) setPhase("failed")
      }
    })()

    return () => {
      active = false
    }
  }, [])

  return (
    <div className="lab-page">
      <div className="lab-header">
        <button className="lab-back" onClick={() => goBackOrFallback(navigate)} type="button" aria-label="Back">
          <FiArrowLeft />
        </button>
        <div>
          <h1>Lab Test Booking</h1>
          <p>Book tests & get reports online</p>
        </div>
      </div>

      <div className="lab-steps">
        <div className="step done">1. Tests</div>
        <span>-</span>
        <div className="step done">2. Location</div>
        <span>-</span>
        <div className="step done">3. Schedule</div>
        <span>-</span>
        <div className="step active">4. Confirm</div>
      </div>

      {phase === "processing" ? (
        <div className="confirm-top processing">
          <div className="processing-ring">
            <span />
          </div>
          <h2>Processing Booking...</h2>
          <p>Please wait while we confirm your lab appointment</p>
        </div>
      ) : phase === "confirmed" ? (
        <>
          <div className="confirm-top">
            <div className="confirm-check confirm-check--success">
              <span className="confirm-check-inner">
                <FiCheck />
              </span>
            </div>
            <h2>Booking Confirmed!</h2>
            <p>Your lab test has been booked successfully</p>
          </div>

          <div className="detail-box">
            <h3>Booking Detail</h3>

            <div className="detail-item">
              <FiCalendar />
              <div>
                <span>Date & Time</span>
                <strong>{dateTime}</strong>
              </div>
            </div>

            <div className="detail-item">
              <FiMapPin />
              <div>
                <span>Collection Type</span>
                <strong>{collectionType}</strong>
              </div>
            </div>

          <div className="detail-item">
            <RiTestTubeLine />
            <div>
              <span>Tests Selected</span>
              <strong>{selectedTest}</strong>
            </div>
          </div>

          {bookingId && (
            <div className="detail-item">
              <FiFileText />
              <div>
                <span>Booking ID</span>
                <strong>{bookingId}</strong>
              </div>
            </div>
          )}
        </div>

          <div className="bottom-buttons single">
            <button className="btn-primary" onClick={() => navigate("/home")} type="button">
              Return Home
            </button>
          </div>
        </>
      ) : (
        <div className="confirm-top">
          <div className="confirm-check confirm-check--pending">
            <span className="confirm-check-inner">
              <FiAlertCircle />
            </span>
          </div>
          <h2>Booking Pending</h2>
          <p>{errorMessage || "We couldn't confirm the booking yet. Please try again in a moment."}</p>
          <p>We are retrying this booking automatically and will update your status.</p>
        </div>
      )}
    </div>
  )
}
