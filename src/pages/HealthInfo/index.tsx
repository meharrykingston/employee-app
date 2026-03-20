import { useEffect, useMemo, useRef, useState } from "react"
import { FiActivity, FiArrowLeft, FiDroplet, FiHeart } from "react-icons/fi"
import { useNavigate } from "react-router-dom"
import { getHealthProfile, saveHealthProfile } from "../../services/healthProfileApi"
import "./health-info.css"

export default function HealthInfo() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [bloodGroup, setBloodGroup] = useState("B+")
  const [heightFt, setHeightFt] = useState("")
  const [heightIn, setHeightIn] = useState("")
  const [weightKg, setWeightKg] = useState("")
  const [waistIn, setWaistIn] = useState("")
  const [allergies, setAllergies] = useState("")
  const [conditions, setConditions] = useState("")
  const [medications, setMedications] = useState("")
  const [notes, setNotes] = useState("")
  const autosaveRef = useRef<number | null>(null)
  const loadedRef = useRef(false)

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      setError("")
      try {
        const { profile } = await getHealthProfile()
        if (!active || !profile) {
          setLoading(false)
          return
        }
        setBloodGroup(profile.bloodGroup ?? "B+")
        setHeightFt(profile.heightFt ? String(profile.heightFt) : "")
        setHeightIn(profile.heightIn ? String(profile.heightIn) : "")
        setWeightKg(profile.weightKg ? String(profile.weightKg) : "")
        setWaistIn(profile.waistIn ? String(profile.waistIn) : "")
        setAllergies(profile.allergies ?? "")
        setConditions(profile.conditions ?? "")
        setMedications(profile.medications ?? "")
        setNotes(profile.notes ?? "")
        loadedRef.current = true
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Unable to load profile")
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!loadedRef.current) return
    if (autosaveRef.current) {
      window.clearTimeout(autosaveRef.current)
    }
    autosaveRef.current = window.setTimeout(async () => {
      setSaving(true)
      setError("")
      try {
        await saveHealthProfile({
          bloodGroup,
          heightFt: heightFt ? Number(heightFt) : null,
          heightIn: heightIn ? Number(heightIn) : null,
          weightKg: weightKg ? Number(weightKg) : null,
          waistIn: waistIn ? Number(waistIn) : null,
          allergies,
          conditions,
          medications,
          notes,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to save profile")
      } finally {
        setSaving(false)
      }
    }, 900)

    return () => {
      if (autosaveRef.current) {
        window.clearTimeout(autosaveRef.current)
      }
    }
  }, [bloodGroup, heightFt, heightIn, weightKg, waistIn, allergies, conditions, medications, notes])

  const bmi = useMemo(() => {
    const ft = Number(heightFt)
    const inch = Number(heightIn)
    const kg = Number(weightKg)
    if (!ft && !inch) return null
    const totalIn = ft * 12 + inch
    if (!totalIn || !kg) return null
    const cm = totalIn * 2.54
    const m = cm / 100
    const value = kg / (m * m)
    return Math.round(value * 10) / 10
  }, [heightFt, heightIn, weightKg])

  const bmiStatus = useMemo(() => {
    if (!bmi) return "Add height & weight to see BMI"
    if (bmi < 18.5) return "Underweight range"
    if (bmi < 25) return "Healthy range"
    if (bmi < 30) return "Overweight range"
    return "High BMI range"
  }, [bmi])

  return (
    <main className="health-info-page app-page-enter">
      <header className="health-info-header app-fade-stagger">
        <button className="health-info-back app-pressable" onClick={() => navigate(-1)} type="button" aria-label="Back">
          <FiArrowLeft />
        </button>
        <div>
          <h1>Health Information</h1>
          <p>Keep your profile updated for better recommendations.</p>
        </div>
      </header>

      <section className="health-info-shell app-content-slide">
        {loading && <div className="health-loading">Loading health profile...</div>}
        {error && <div className="health-error">{error}</div>}

        <article className="health-card health-bmi card-rise">
          <div>
            <h2>{bmi ? bmi : "--"} <small>BMI</small></h2>
            <p>{bmiStatus}</p>
          </div>
          <div className="health-icons">
            <span><FiHeart /></span>
            <span><FiActivity /></span>
            <span><FiDroplet /></span>
          </div>
        </article>

        <article className="health-card card-rise">
          <div className="health-section-title">
            <h3>Vitals</h3>
            <span>Update once a week</span>
          </div>
          <div className="health-grid">
            <label>
              <span>Blood Group</span>
              <select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)}>
                <option>B+</option>
                <option>A+</option>
                <option>O+</option>
                <option>AB+</option>
                <option>B-</option>
                <option>A-</option>
                <option>O-</option>
                <option>AB-</option>
              </select>
            </label>
            <label>
              <span>Height (ft)</span>
              <input value={heightFt} onChange={(e) => setHeightFt(e.target.value.replace(/[^0-9]/g, ""))} placeholder="5" />
            </label>
            <label>
              <span>Height (in)</span>
              <input value={heightIn} onChange={(e) => setHeightIn(e.target.value.replace(/[^0-9]/g, ""))} placeholder="7" />
            </label>
            <label>
              <span>Weight (kg)</span>
              <input value={weightKg} onChange={(e) => setWeightKg(e.target.value.replace(/[^0-9]/g, ""))} placeholder="68" />
            </label>
            <label>
              <span>Waist (in)</span>
              <input value={waistIn} onChange={(e) => setWaistIn(e.target.value.replace(/[^0-9]/g, ""))} placeholder="32" />
            </label>
          </div>
        </article>

        <article className="health-card card-rise">
          <div className="health-section-title">
            <h3>Health Notes</h3>
            <span>Shared with your care team</span>
          </div>
          <div className="health-text-grid">
            <label>
              <span>Allergies</span>
              <textarea rows={3} value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="No known allergies" />
            </label>
            <label>
              <span>Conditions</span>
              <textarea rows={3} value={conditions} onChange={(e) => setConditions(e.target.value)} placeholder="Hypertension, asthma, etc." />
            </label>
            <label>
              <span>Medications</span>
              <textarea rows={3} value={medications} onChange={(e) => setMedications(e.target.value)} placeholder="Current medicines" />
            </label>
            <label>
              <span>Additional Notes</span>
              <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything else your doctor should know" />
            </label>
          </div>
        </article>
      </section>
    </main>
  )
}
