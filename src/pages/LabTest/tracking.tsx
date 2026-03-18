import { FiArrowLeft, FiCheckCircle, FiClock, FiMapPin } from "react-icons/fi"
import { RiTestTubeLine } from "react-icons/ri"
import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { addNotification } from "../../services/notificationCenter"
import { ensureEmployeeActor } from "../../services/actorsApi"
import { getLabOrderById, subscribeLabOrderUpdates } from "../../services/labApi"
import "./labtest.css"

type LabBooking = {
  id: string
  bookingId: string
  status: string
  testName: string
  collectionType: string
  scheduledAt: string
  etaMinutes?: number
  etaStartAt?: string
}

const LAB_BOOKINGS_KEY = "lab_bookings"
const STATUS_STEPS = [
  { id: "pending", label: "Pending registration" },
  { id: "phlebo", label: "Phlebo assigned" },
  { id: "sample", label: "Sample collected" },
  { id: "lab", label: "Received in lab" },
  { id: "reported", label: "Reported" },
]

function mapStatusToStep(status: string) {
  const normalized = status.toLowerCase()
  if (normalized.includes("sample")) return "sample"
  if (normalized.includes("report") || normalized.includes("complete")) return "reported"
  if (normalized.includes("process") || normalized.includes("lab")) return "lab"
  if (normalized.includes("assign")) return "phlebo"
  return "pending"
}

export default function LabTracking() {
  const navigate = useNavigate()
  const { id } = useParams()
  const mapboxTokenRaw = (import.meta as any).env?.VITE_MAPBOX_TOKEN
  const mapboxToken =
    typeof mapboxTokenRaw === "string" && mapboxTokenRaw.trim() && mapboxTokenRaw !== "undefined" && mapboxTokenRaw !== "null"
      ? mapboxTokenRaw
      : ""
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const [liveBooking, setLiveBooking] = useState<LabBooking | null>(null)
  const [etaRemaining, setEtaRemaining] = useState<number | null>(null)

  const booking = useMemo(() => {
    const raw = localStorage.getItem(LAB_BOOKINGS_KEY)
    if (!raw) return null
    try {
      const parsed = JSON.parse(raw) as LabBooking[]
      return parsed.find((item) => item.id === id) ?? null
    } catch {
      return null
    }
  }, [id])

  const resolvedBooking = liveBooking
    ? {
        ...booking,
        ...liveBooking,
        etaMinutes: booking?.etaMinutes ?? liveBooking.etaMinutes,
        etaStartAt: booking?.etaStartAt ?? liveBooking.etaStartAt,
      }
    : booking
  const statusStep = mapStatusToStep(resolvedBooking?.status ?? "pending")

  useEffect(() => {
    if (!resolvedBooking?.etaMinutes) {
      setEtaRemaining(null)
      return
    }
    const startAt = resolvedBooking.etaStartAt
      ? new Date(resolvedBooking.etaStartAt).getTime()
      : Date.now()
    const initial = resolvedBooking.etaMinutes
    const update = () => {
      const elapsedMin = Math.max(0, Math.floor((Date.now() - startAt) / 60000))
      const remaining = Math.max(1, initial - elapsedMin)
      setEtaRemaining(remaining)
    }
    update()
    const interval = window.setInterval(update, 10000)
    return () => window.clearInterval(interval)
  }, [resolvedBooking?.etaMinutes, resolvedBooking?.etaStartAt])

  useEffect(() => {
    if (!id) return
    let active = true
    let lastStatus = resolvedBooking?.status ?? ""
    let unsubscribe: (() => void) | null = null

    async function loadInitial() {
      try {
        if (!id) return
        await ensureEmployeeActor({ companyReference: "astikan-demo-company", companyName: "Astikan" })
        const order = await getLabOrderById(id)
        if (!active || !order) return
        const mapped: LabBooking = {
          id: order.id,
          bookingId: order.providerOrderReference ?? order.id,
          status: order.status,
          testName: order.testName,
          collectionType: "Home Collection",
          scheduledAt: order.slotAt ?? order.createdAt,
        }
        setLiveBooking(mapped)
        lastStatus = order.status
      } catch {
        // silent
      }
    }

    async function setupStream() {
      try {
        if (!id) return
        const actor = await ensureEmployeeActor({ companyReference: "astikan-demo-company", companyName: "Astikan" })
        unsubscribe = subscribeLabOrderUpdates(actor.employeeUserId, async (updates) => {
          const update = updates.find((item) => item.id === id)
          if (!update) return
          const nextStatus = update.status
          if (nextStatus && nextStatus !== lastStatus) {
            setLiveBooking((prev) =>
              prev
                ? { ...prev, status: nextStatus, testName: update.testName }
                : ({
                    id,
                    bookingId: id,
                    status: nextStatus,
                    testName: update.testName,
                    collectionType: "Home Collection",
                    scheduledAt: new Date().toISOString(),
                  } as LabBooking)
            )
            if (nextStatus.toLowerCase().includes("report")) {
              await addNotification({
                title: "Lab report ready",
                body: `${update.testName} report is now available.`,
                channel: "health",
                cta: { label: "View Report", route: "/reports" },
              })
            }
            lastStatus = nextStatus
          }
        })
      } catch {
        // silent
      }
    }

    void loadInitial()
    void setupStream()

    return () => {
      active = false
      if (unsubscribe) unsubscribe()
    }
  }, [id])

  useEffect(() => {
    if (!mapboxToken.trim()) {
      console.error("Mapbox token missing")
    }
  }, [mapboxToken])

  useEffect(() => {
    if (!mapboxToken || !mapContainerRef.current || mapRef.current) return
    mapboxgl.accessToken = mapboxToken
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/standard",
      center: [77.209, 28.6139],
      zoom: 11.2,
      pitch: 55,
      bearing: -25,
      antialias: true,
    })

    const hideLabels = () => {
      const style = map.getStyle()
      style.layers?.forEach((layer) => {
        const id = layer.id.toLowerCase()
        const hasText =
          layer.type === "symbol" && Boolean((layer.layout as any)?.["text-field"])
        const looksLikeLabel =
          id.includes("label") ||
          id.includes("place") ||
          id.includes("road") ||
          id.includes("highway") ||
          id.includes("poi") ||
          id.includes("airport")
        if (hasText || looksLikeLabel) {
          map.setLayoutProperty(layer.id, "visibility", "none")
        }
      })
    }

    map.on("load", () => {
      map.addSource("mapbox-dem", {
        type: "raster-dem",
        url: "mapbox://mapbox.mapbox-terrain-dem-v1",
        tileSize: 512,
        maxzoom: 14,
      })
      map.setTerrain({ source: "mapbox-dem", exaggeration: 1.35 })
      hideLabels()
    })

    map.on("styledata", hideLabels)
    map.on("error", (event) => {
      const err = (event as { error?: Error }).error
      console.error("Mapbox error", err ?? event)
    })
    map.scrollZoom.disable()
    map.boxZoom.disable()
    map.dragPan.disable()
    map.dragRotate.disable()
    map.keyboard.disable()
    map.doubleClickZoom.disable()
    map.touchZoomRotate.disable()

    const userEl = document.createElement("div")
    userEl.className = "map-marker map-marker--user"
    userEl.textContent = "U"
    new mapboxgl.Marker({ element: userEl }).setLngLat([77.209, 28.6139]).addTo(map)

    const labEl = document.createElement("div")
    labEl.className = "map-marker map-marker--lab"
    labEl.innerHTML =
      "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M9 3h6v2l-1 1v4.3l4.6 7.7A3 3 0 0 1 15.9 22H8.1a3 3 0 0 1-2.7-4.5L10 10.3V6L9 5V3zm2 6.7L7.1 18a1 1 0 0 0 .9 1.5h7.8a1 1 0 0 0 .9-1.5L13 9.7V6h-2v3.7z\"/></svg>"
    new mapboxgl.Marker({ element: labEl }).setLngLat([77.1706, 28.6723]).addTo(map)

    mapRef.current = map
  }, [mapboxToken])

  return (
    <main className="lab-page tracking-page app-page-enter">
      <header className="lab-header app-fade-stagger">
        <button className="lab-back" onClick={() => navigate(-1)} type="button" aria-label="Back">
          <FiArrowLeft />
        </button>
        <div>
          <h1>Lab Test Tracking</h1>
          <p>Track sample progress in real time</p>
        </div>
      </header>

      <section className="lab-test-card static-card tracking-card app-fade-stagger">
        <div className="lab-icon red"><RiTestTubeLine /></div>
        <div className="lab-info">
          <h3>{resolvedBooking?.testName ?? "Lab Test"}</h3>
          <div className="lab-meta-row">
            <span><FiMapPin /> {resolvedBooking?.collectionType ?? "Home Collection"}</span>
            <span><FiClock /> {resolvedBooking?.scheduledAt ? new Date(resolvedBooking.scheduledAt).toLocaleString() : "Pending"}</span>
          </div>
          <div className="lab-meta-row muted">
            <span><FiCheckCircle /> Booking ID {resolvedBooking?.bookingId ?? "Pending"}</span>
            {etaRemaining !== null && <span>{etaRemaining} mins away</span>}
          </div>
        </div>
      </section>

      <section className="lab-map-wrap app-fade-stagger">
        <div ref={mapContainerRef} className="lab-map" aria-label="Live tracking map" />
      </section>

      <section className="lab-status-list app-fade-stagger">
        {STATUS_STEPS.map((step) => {
          const isActive = step.id === statusStep
          const isDone = STATUS_STEPS.findIndex((item) => item.id === step.id) <
            STATUS_STEPS.findIndex((item) => item.id === statusStep)
          return (
            <article key={step.id} className={`lab-status-item ${isActive ? "active" : ""} ${isDone ? "done" : ""}`}>
              <span className="lab-status-dot" aria-hidden="true" />
              <div>
                <h4>{step.label}</h4>
                <p>{isActive ? "In progress" : isDone ? "Completed" : "Awaiting update"}</p>
              </div>
            </article>
          )
        })}
      </section>

      {statusStep === "reported" && (
        <div className="lab-actions app-fade-stagger">
          <button
            className="lab-primary-btn"
            type="button"
            onClick={() => navigate(`/lab-tests/report/${id}`)}
          >
            View Report
          </button>
        </div>
      )}
    </main>
  )
}
