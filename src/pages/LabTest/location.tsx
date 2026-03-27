import { FiArrowLeft, FiHome, FiMapPin } from "react-icons/fi"
import { MdOutlineBusinessCenter } from "react-icons/md"
import { useEffect, useMemo, useRef, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { getEmployeeAuthSession, getEmployeeCompanySession } from "../../services/authApi"
import { fetchEmployeeProfile } from "../../services/employeeApi"
import { getAddressProfile } from "../../services/addressApi"
import "./labtest.css"

type LabTestItem = {
  id: string
  color: "red" | "blue" | "gray" | "green" | "outline"
  name: string
  desc: string
  tag: string
  duration: string
  fasting: string
  quick?: string
  code?: string
}

export default function LabLocationStep2() {
  const navigate = useNavigate()
  const { state } = useLocation() as {
    state?: {
      selectedTest?: LabTestItem
      readinessQuestions?: Array<{ id: string; question: string; options: Array<{ value: string; label: string }> }>
      readiness?: Record<string, "yes" | "no">
    }
  }
  const selectedTest = state?.selectedTest
  const [collectionType, setCollectionType] = useState<"home" | "office">("home")
  const [homeAddress, setHomeAddress] = useState("")
  const [officeAddress, setOfficeAddress] = useState("")
  const [etaByType, setEtaByType] = useState<{ home: number | null; office: number | null }>({
    home: null,
    office: null,
  })
  const [pageReady, setPageReady] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const originMarkerRef = useRef<mapboxgl.Marker | null>(null)
  const destinationMarkerRef = useRef<mapboxgl.Marker | null>(null)

  const mapboxTokenRaw = (import.meta as any).env?.VITE_MAPBOX_TOKEN
  const mapboxToken =
    typeof mapboxTokenRaw === "string" && mapboxTokenRaw.trim() && mapboxTokenRaw !== "undefined" && mapboxTokenRaw !== "null"
      ? mapboxTokenRaw
      : ""
  const NIRAMAYA_DELHI_ADDRESS =
    "NirAmaya PathLabs Private Limited, B-4, New Multan Nagar, Near Paschim Vihar Metro, Pillor No. 233, New Delhi-110056"

  const address =
    collectionType === "home"
      ? homeAddress || "Add your home address to calculate ETA"
      : officeAddress || "Office address on file"

  const mapOriginAddress = collectionType === "home" ? homeAddress : officeAddress
  const hasAddress = Boolean(mapOriginAddress && mapOriginAddress.trim().length > 0)
  const employeeSession = getEmployeeAuthSession()
  const userName = employeeSession?.fullName?.trim() || "Home"
  const userAvatar = employeeSession?.avatarUrl ?? ""

  const canRenderMap = useMemo(() => mapboxToken.trim().length > 0, [mapboxToken])

  function formatDuration(minutes: number | null) {
    if (!minutes || minutes <= 0) return "ETA"
    const hrs = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hrs > 0) return `${hrs} hr ${mins} min`
    return `${mins} min`
  }

  const displayEta = useMemo(() => {
    const base = etaByType[collectionType]
    if (!base) return null
    return Math.max(1, Math.round(base / 2))
  }, [etaByType, collectionType])

  useEffect(() => {
    const raw = localStorage.getItem("lab_eta_cache")
    if (!raw) return
    try {
      const cached = JSON.parse(raw) as { home?: number; office?: number }
      setEtaByType((prev) => ({
        home: prev.home ?? cached.home ?? null,
        office: prev.office ?? cached.office ?? null,
      }))
      if (cached[collectionType]) {
        setPageReady(true)
      }
    } catch {
      // ignore cache errors
    }
  }, [])

  function formatAddress(input?: Record<string, unknown> | null) {
    if (!input) return ""
    const safe = input as Record<string, unknown>
    const parts = [
      safe.line1,
      safe.line2,
      safe.street,
      safe.area,
      safe.city,
      safe.state,
      safe.pincode,
      safe.country,
    ]
      .filter((item) => typeof item === "string" && item.trim().length > 0)
      .map((item) => String(item).trim())
    if (parts.length) return parts.join(", ")
    if (typeof safe.full === "string") return safe.full
    return ""
  }

  async function geocodeAddress(query: string, signal?: AbortSignal) {
    if (!query.trim()) return null
    const url =
      "https://api.mapbox.com/geocoding/v5/mapbox.places/" +
      encodeURIComponent(query) +
      `.json?limit=1&country=IN&access_token=${mapboxToken}`
    const response = await fetch(url, { signal })
    if (!response.ok) return null
    const data = (await response.json()) as {
      features?: Array<{ center?: [number, number] }>
    }
    const coords = data.features?.[0]?.center
    if (!coords) return null
    return { lon: coords[0], lat: coords[1] }
  }

  async function fetchRoute(origin: { lon: number; lat: number }, destination: { lon: number; lat: number }) {
    const url =
      "https://api.mapbox.com/directions/v5/mapbox/driving-traffic/" +
      `${origin.lon},${origin.lat};${destination.lon},${destination.lat}` +
      `?geometries=geojson&overview=full&access_token=${mapboxToken}`
    const response = await fetch(url)
    if (!response.ok) throw new Error("Unable to fetch route")
    const data = (await response.json()) as {
      routes?: Array<{ geometry?: { coordinates: [number, number][] }; distance?: number; duration?: number }>
    }
    const route = data.routes?.[0]
    if (!route?.geometry?.coordinates) throw new Error("No route available")
    return route
  }

  async function fetchEtaMinutes(addressText: string) {
    const origin = await geocodeAddress(addressText)
    const destination = await geocodeAddress(NIRAMAYA_DELHI_ADDRESS)
    if (!origin || !destination) return null
    const route = await fetchRoute(origin, destination)
    if (typeof route.duration !== "number") return null
    return Math.max(1, Math.round(route.duration / 60))
  }

  useEffect(() => {
    const session = getEmployeeAuthSession()
    const company = getEmployeeCompanySession()
    const fallbackOffice = company?.companyName ? `${company.companyName} Campus` : ""
    setOfficeAddress(fallbackOffice)

    let active = true
    async function loadProfile() {
      if (!session?.userId) return
      try {
        const [addressResp, profile] = await Promise.all([
          getAddressProfile().catch(() => ({ address: null })),
          fetchEmployeeProfile(session.userId),
        ])
        if (!active) return
        const fromProfile = formatAddress(profile?.address_json ?? undefined)
        const stored = localStorage.getItem("employee_home_address") ?? ""
        const storedOffice = localStorage.getItem("employee_office_address") ?? ""
        const dbHome = addressResp?.address?.homeAddress ?? ""
        const dbOffice = addressResp?.address?.officeAddress ?? ""
        setHomeAddress(dbHome || fromProfile || stored)
        setOfficeAddress(dbOffice || storedOffice || fallbackOffice)
      } catch {
        const stored = localStorage.getItem("employee_home_address") ?? ""
        const storedOffice = localStorage.getItem("employee_office_address") ?? ""
        if (active) {
          setHomeAddress(stored)
          setOfficeAddress(storedOffice || fallbackOffice)
        }
      }
    }
    loadProfile()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!canRenderMap || !mapContainerRef.current || mapRef.current) {
      return
    }

    mapboxgl.accessToken = mapboxToken
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/standard",
      center: [77.209, 28.6139],
      zoom: 11.6,
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
      setMapLoaded(true)
      map.addSource("mapbox-dem", {
        type: "raster-dem",
        url: "mapbox://mapbox.mapbox-terrain-dem-v1",
        tileSize: 512,
        maxzoom: 14,
      })
      map.setTerrain({ source: "mapbox-dem", exaggeration: 1.4 })

      if (!map.getLayer("3d-buildings") && map.getSource("composite")) {
        map.addLayer({
          id: "3d-buildings",
          source: "composite",
          "source-layer": "building",
          filter: ["==", "extrude", "true"],
          type: "fill-extrusion",
          minzoom: 14,
          paint: {
            "fill-extrusion-color": "#d5dbe6",
            "fill-extrusion-height": ["get", "height"],
            "fill-extrusion-base": ["get", "min_height"],
            "fill-extrusion-opacity": 0.85,
          },
        })
      }

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

    mapRef.current = map
  }, [canRenderMap, mapboxToken, pageReady])

  useEffect(() => {
    if (!canRenderMap || !hasAddress) {
      return
    }
    if (!mapboxToken) return

    const controller = new AbortController()
    let interval: number | undefined

    async function updateRoute() {
      try {
        const origin = await geocodeAddress(mapOriginAddress, controller.signal)
        const destination = await geocodeAddress(NIRAMAYA_DELHI_ADDRESS, controller.signal)
        if (!origin || !destination) {
          console.warn("Mapbox geocode failed for address")
          return
        }
        const route = await fetchRoute(origin, destination)
        const map = mapRef.current
        if (!map) return

        const geojson: GeoJSON.Feature<GeoJSON.LineString> = {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: route.geometry?.coordinates ?? [],
          },
        }

        if (map.getSource("route")) {
          const source = map.getSource("route") as mapboxgl.GeoJSONSource
          source.setData(geojson)
        } else {
          map.addSource("route", {
            type: "geojson",
            data: geojson,
          })
          map.addLayer({
            id: "route-line",
            type: "line",
            source: "route",
            paint: {
              "line-color": "#5b8cff",
              "line-width": 5,
              "line-opacity": 0.88,
            },
          })
        }

        if (originMarkerRef.current) originMarkerRef.current.remove()
        if (destinationMarkerRef.current) destinationMarkerRef.current.remove()
        const userEl = document.createElement("div")
        userEl.className = "map-marker map-marker--user"
        if (userAvatar) {
          userEl.style.backgroundImage = `url(${userAvatar})`
        } else {
          userEl.textContent = userName.slice(0, 1).toUpperCase()
        }
        originMarkerRef.current = new mapboxgl.Marker({ element: userEl })
          .setLngLat([origin.lon, origin.lat])
          .addTo(map)

        const labEl = document.createElement("div")
        labEl.className = "map-marker map-marker--lab"
        labEl.innerHTML = "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M9 3h6v2l-1 1v4.3l4.6 7.7A3 3 0 0 1 15.9 22H8.1a3 3 0 0 1-2.7-4.5L10 10.3V6L9 5V3zm2 6.7L7.1 18a1 1 0 0 0 .9 1.5h7.8a1 1 0 0 0 .9-1.5L13 9.7V6h-2v3.7z\"/></svg>"
        destinationMarkerRef.current = new mapboxgl.Marker({ element: labEl })
          .setLngLat([destination.lon, destination.lat])
          .addTo(map)

        const bounds = new mapboxgl.LngLatBounds()
        bounds.extend([origin.lon, origin.lat])
        bounds.extend([destination.lon, destination.lat])
        map.fitBounds(bounds, { padding: 60, maxZoom: 14 })

        if (typeof route.duration === "number") {
          const minutes = Math.max(1, Math.round(route.duration / 60))
          setEtaByType((prev) => {
            const next = { ...prev, [collectionType]: minutes }
            localStorage.setItem("lab_eta_cache", JSON.stringify(next))
            return next
          })
          setPageReady(true)
        }
      } catch (error) {
        console.error("Mapbox route error", error)
      }
    }

    updateRoute()
    interval = window.setInterval(updateRoute, 60000)

    return () => {
      controller.abort()
      if (interval) window.clearInterval(interval)
    }
  }, [NIRAMAYA_DELHI_ADDRESS, canRenderMap, mapOriginAddress, mapboxToken, collectionType])

  useEffect(() => {
    if (etaByType[collectionType] || mapLoaded) {
      setPageReady(true)
      return
    }
    const timer = window.setTimeout(() => setPageReady(true), 2500)
    return () => window.clearTimeout(timer)
  }, [collectionType, etaByType, mapLoaded])

  useEffect(() => {
    let active = true
    async function warmOtherEta() {
      if (!mapboxToken) return
      if (collectionType === "home" && officeAddress) {
        const eta = await fetchEtaMinutes(officeAddress)
        if (active && eta) {
          setEtaByType((prev) => ({ ...prev, office: prev.office ?? eta }))
        }
      }
      if (collectionType === "office" && homeAddress) {
        const eta = await fetchEtaMinutes(homeAddress)
        if (active && eta) {
          setEtaByType((prev) => ({ ...prev, home: prev.home ?? eta }))
        }
      }
    }
    warmOtherEta()
    return () => {
      active = false
    }
  }, [collectionType, homeAddress, mapboxToken, officeAddress])

  useEffect(() => {
    if (!mapboxToken.trim()) {
      console.error("Mapbox token missing")
    }
  }, [mapboxToken])

  return (
    <div className="lab-page">
      {!pageReady ? (
        <div className="page-loading">
          <span className="lab-loading-spinner" />
          <p>Preparing your booking experience...</p>
        </div>
      ) : (
        <>
      <div className="lab-header">
        <button className="lab-back" onClick={() => navigate(-1)} type="button" aria-label="Back">
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
        <div className="step active">2. Location</div>
        <span>-</span>
        <div className="step pending">3. Schedule</div>
        <span>-</span>
        <div className="step pending">4. Confirm</div>
      </div>

      <section className="location-block">
        <h2>Choose Collection Type</h2>

        <div className="collection-grid">
          <button
            className={`collection-card ${collectionType === "home" ? "active" : ""}`}
            type="button"
            onClick={() => setCollectionType("home")}
          >
            <div className="collection-icon"><FiHome /></div>
            <h3>Home Collection</h3>
            <p>Sample collected at your doorstep</p>
            <span className="mini-pill green">
              {hasAddress ? (displayEta ? `in ${formatDuration(displayEta)}` : "in a few mins") : "Add address"}
            </span>
          </button>

          <button
            className={`collection-card ${collectionType === "office" ? "active" : ""}`}
            type="button"
            onClick={() => setCollectionType("office")}
          >
            <div className="collection-icon"><MdOutlineBusinessCenter /></div>
            <h3>Office Collection</h3>
            <p>Sample collected at your doorstep</p>
            <span className="mini-pill blue">
              {hasAddress ? (displayEta ? `~${formatDuration(displayEta + 10)}` : "a few mins") : "Add address"}
            </span>
          </button>
        </div>
      </section>

      <div className="map-box live-map">
        {!canRenderMap && <div className="mapbox-fallback">Map unavailable right now.</div>}
        {canRenderMap && <div ref={mapContainerRef} className="mapbox-container" />}
      </div>

      <div className="address-line">
        <FiMapPin /> {collectionType === "home" ? "Home Address :" : "Office Address :"} {address}
      </div>
      {!hasAddress && (
        <button className="address-link app-pressable" type="button" onClick={() => navigate("/address")}>
          Add address
        </button>
      )}


      <div className="bottom-buttons single">
        <button
          className="btn-primary"
          onClick={() =>
            navigate("/lab-tests/book-now", {
              state: {
                selectedTest,
                collectionType,
                address: mapOriginAddress,
                readinessQuestions: state?.readinessQuestions,
                readiness: state?.readiness,
              },
            })
          }
          type="button"
          disabled={!hasAddress}
        >
          Continue
        </button>
      </div>
        </>
      )}
    </div>
  )
}

