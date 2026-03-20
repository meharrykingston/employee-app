import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { getEmployeeCompanySession } from "../../services/authApi"
import { getAddressProfile, saveHomeAddress } from "../../services/addressApi"
import "../Settings/settings.css"

const HOME_ADDRESS_KEY = "employee_home_address"

export default function Address() {
  const navigate = useNavigate()
  const companySession = getEmployeeCompanySession()
  const [homeAddress, setHomeAddress] = useState("")
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState("")
  const coordsRef = useRef<{ lat: number; lon: number } | null>(null)
  const saveTimerRef = useRef<number | null>(null)

  useEffect(() => {
    const raw = localStorage.getItem(HOME_ADDRESS_KEY)
    if (raw) setHomeAddress(raw)
    let active = true
    void (async () => {
      try {
        const { address } = await getAddressProfile()
        if (!active || !address?.homeAddress) return
        setHomeAddress(address.homeAddress)
        if (typeof address.homeLat === "number" && typeof address.homeLon === "number") {
          coordsRef.current = { lat: address.homeLat, lon: address.homeLon }
        }
      } catch {
        // keep local cache
      }
    })()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current)
    saveTimerRef.current = window.setTimeout(async () => {
      const trimmed = homeAddress.trim()
      if (!trimmed) return
      setSaving(true)
      setError("")
      try {
        await saveHomeAddress({
          homeAddress: trimmed,
          homeLat: coordsRef.current?.lat ?? null,
          homeLon: coordsRef.current?.lon ?? null,
        })
        localStorage.setItem(HOME_ADDRESS_KEY, trimmed)
        setSaved(true)
        window.setTimeout(() => setSaved(false), 1400)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to save address")
      } finally {
        setSaving(false)
      }
    }, 800)
    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current)
    }
  }, [homeAddress])

  async function suggestFromGps() {
    if (!navigator.geolocation) {
      setError("GPS not available")
      return
    }
    setLocating(true)
    setError("")
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lon = pos.coords.longitude
        coordsRef.current = { lat, lon }
        try {
          const url = new URL("https://nominatim.openstreetmap.org/reverse")
          url.searchParams.set("format", "json")
          url.searchParams.set("lat", String(lat))
          url.searchParams.set("lon", String(lon))
          url.searchParams.set("zoom", "18")
          url.searchParams.set("addressdetails", "1")
          const res = await fetch(url.toString(), {
            headers: { "User-Agent": "AstikanApp/1.0" },
          })
          const data = await res.json()
          const display = data?.display_name as string | undefined
          if (display) {
            setSuggestions([display])
            setHomeAddress(display)
          }
        } catch {
          setError("Unable to fetch address suggestion")
        } finally {
          setLocating(false)
        }
      },
      () => {
        setLocating(false)
        setError("Location permission denied")
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  return (
    <main className="account-page app-page-enter">
      <header className="account-header app-fade-stagger">
        <button className="account-back app-pressable" onClick={() => navigate(-1)} type="button" aria-label="Back">&lt;</button>
        <h1>Address</h1>
      </header>
      <section className="account-shell app-content-slide">
        <article className="account-card app-fade-stagger">
          <h3>Home Address</h3>
          <div className="field-grid">
            <label htmlFor="homeAddress">Your personal address</label>
            <textarea
              id="homeAddress"
              rows={3}
              placeholder="Enter your home address"
              value={homeAddress}
              onChange={(event) => setHomeAddress(event.target.value)}
            />
            <button className="setting-item app-pressable" type="button" onClick={suggestFromGps} disabled={locating}>
              {locating ? "Detecting location..." : "Use GPS suggestion"}
              <small>Auto fill</small>
            </button>
            {suggestions.length > 0 && (
              <div className="address-suggestions">
                {suggestions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className="address-suggestion app-pressable"
                    onClick={() => setHomeAddress(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
            <button className="setting-item app-pressable" type="button" disabled>
              {saving ? "Saving..." : saved ? "Saved" : "Auto-saving"}
              <small>Personal</small>
            </button>
            {error && <p className="address-note">{error}</p>}
          </div>
        </article>
        <article className="account-card app-fade-stagger">
          <h3>Office Address</h3>
          <p>{companySession?.companyName ?? "Company"} Campus, Madhapur, Hyderabad - 500084</p>
          <p className="address-note">Provided by your corporate admin</p>
        </article>
      </section>
    </main>
  )
}
