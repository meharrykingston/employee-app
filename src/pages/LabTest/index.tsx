import { useMemo, useState } from "react"
import {
  FiActivity,
  FiArrowLeft,
  FiArrowRight,
  FiClock,
  FiDroplet,
  FiFileText,
  FiFilter,
  FiHeart,
  FiSearch,
  FiShield,
  FiSun,
  FiZap,
} from "react-icons/fi"
import { useNavigate } from "react-router-dom"
import "./labtest.css"

type TestIcon = "blood" | "heart" | "hormone" | "sugar" | "vitamin" | "liver"

type LabTestItem = {
  id: string
  color: "red" | "blue" | "gray" | "green" | "outline"
  name: string
  desc: string
  tag: string
  duration: string
  fasting: string
  icon: TestIcon
  quick?: string
}

const TESTS: LabTestItem[] = [
  {
    id: "cbc",
    color: "red",
    name: "Complete Blood Count (CBC)",
    desc: "Comprehensive blood analysis",
    tag: "Blood Test",
    duration: "4-6 hours",
    fasting: "No fasting required",
    icon: "blood",
    quick: "in 5 Mins",
  },
  {
    id: "lipid",
    color: "blue",
    name: "Lipid Profile",
    desc: "Cholesterol and triglycerides check",
    tag: "Blood Test",
    duration: "6-8 hours",
    fasting: "12 hours fasting required",
    icon: "heart",
  },
  {
    id: "thyroid",
    color: "gray",
    name: "Thyroid Profile",
    desc: "Complete thyroid function test",
    tag: "Hormone Test",
    duration: "8-12 hours",
    fasting: "No special preparation",
    icon: "hormone",
  },
  {
    id: "diabetes",
    color: "green",
    name: "Diabetes Screening",
    desc: "HbA1c and blood sugar levels",
    tag: "Blood Test",
    duration: "6-8 hours",
    fasting: "8 hours fasting",
    icon: "sugar",
  },
  {
    id: "vitaminD",
    color: "outline",
    name: "Vitamin D Test",
    desc: "Check vitamin D levels",
    tag: "Vitamin Test",
    duration: "12-24 hours",
    fasting: "No fasting required",
    icon: "vitamin",
  },
  {
    id: "liver",
    color: "outline",
    name: "Liver Function Test",
    desc: "Complete liver health assessment",
    tag: "Blood Test",
    duration: "6-8 hours",
    fasting: "8 hours fasting",
    icon: "liver",
  },
]

const SYMPTOM_CHIPS = ["Fatigue", "Weight gain", "Low energy", "Hair fall", "High sugar"]

function renderTestIcon(icon: TestIcon) {
  switch (icon) {
    case "blood":
      return <FiDroplet />
    case "heart":
      return <FiHeart />
    case "hormone":
      return <FiActivity />
    case "sugar":
      return <FiZap />
    case "vitamin":
      return <FiSun />
    case "liver":
      return <FiShield />
    default:
      return <FiActivity />
  }
}

export default function LabTestsStep1() {
  const navigate = useNavigate()
  const [query, setQuery] = useState("")
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [activeFilter, setActiveFilter] = useState<"All" | LabTestItem["tag"]>("All")
  const [modalTag, setModalTag] = useState<"All" | LabTestItem["tag"]>("All")
  const [onlyQuick, setOnlyQuick] = useState(false)
  const [modalQuick, setModalQuick] = useState(false)

  const filteredTests = useMemo(() => {
    return TESTS.filter((test) => {
      const tagMatch = activeFilter === "All" || test.tag === activeFilter
      const textMatch =
        test.name.toLowerCase().includes(query.toLowerCase()) ||
        test.desc.toLowerCase().includes(query.toLowerCase())
      const quickMatch = !onlyQuick || !!test.quick
      return tagMatch && textMatch && quickMatch
    })
  }, [activeFilter, onlyQuick, query])

  const aiPrefill = useMemo(() => {
    const base = query.trim() ? `I have ${query.trim()}.` : "Help me choose the right lab test."
    const tagHint = activeFilter !== "All" ? ` Focus on ${activeFilter.toLowerCase()} options.` : ""
    const quickHint = onlyQuick ? " Prioritize quick report tests." : ""
    return `${base}${tagHint}${quickHint} Suggest top 3 tests with reason and preparation.`
  }, [activeFilter, onlyQuick, query])

  return (
    <div className="lab-page lab-page--catalog">
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
        <div className="step active">1. Tests</div>
        <span>-</span>
        <div className="step pending">2. Location</div>
        <span>-</span>
        <div className="step pending">3. Schedule</div>
        <span>-</span>
        <div className="step pending">4. Confirm</div>
      </div>

      <section className="lab-ai-finder">
        <div className="lab-ai-finder-top">
          <span className="finder-badge">AI smart finder</span>
          <button
            type="button"
            className="finder-btn"
            onClick={() => navigate("/ai-chat", { state: { prefill: aiPrefill } })}
          >
            Find best test <FiArrowRight />
          </button>
        </div>
        <h2>Not sure which test to book?</h2>
        <p>Tell symptoms and AI suggests suitable tests with preparation guidance.</p>
        <div className="lab-symptom-chips">
          {SYMPTOM_CHIPS.map((chip) => (
            <button key={chip} type="button" onClick={() => setQuery(chip)}>
              {chip}
            </button>
          ))}
        </div>
      </section>

      <div className="lab-search-box lab-search-box--rich">
        <FiSearch className="search-icon" />
        <input
          placeholder="Search test, condition, or symptom"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="lab-section-head">
        <h2>Popular Tests</h2>
        <button
          className="filter-btn"
          type="button"
          onClick={() => {
            setModalTag(activeFilter)
            setModalQuick(onlyQuick)
            setShowFilterModal(true)
          }}
        >
          <FiFilter /> Filter
        </button>
      </div>

      <div className="active-filter-line">
        <span>Filter: {activeFilter}</span>
        <span>{filteredTests.length} results</span>
        {onlyQuick && <span className="active-quick">Quick only</span>}
      </div>

      <div className="lab-list">
        {filteredTests.map((test) => (
          <button
            key={test.id}
            className="lab-test-card"
            onClick={() => navigate("/lab-tests/readiness", { state: { selectedTest: test } })}
            type="button"
          >
            <div className={`lab-icon ${test.color}`}>{renderTestIcon(test.icon)}</div>

            <div className="lab-info">
              <h3>{test.name}</h3>
              <p>{test.desc}</p>

              <div className="lab-meta-row">
                <span className="pill">{test.tag}</span>
                <span>
                  <FiClock /> {test.duration}
                </span>
              </div>

              <div className="lab-meta-row muted">
                <span>
                  <FiFileText /> {test.fasting}
                </span>
              </div>
            </div>

            <div className="lab-card-right">
              {test.quick && <span className="quick-chip">{test.quick}</span>}
              <span className="go-chip">
                <FiArrowRight />
              </span>
            </div>
          </button>
        ))}

        {filteredTests.length === 0 && (
          <div className="empty-state">
            <p>No tests found for this filter.</p>
            <button
              type="button"
              onClick={() => {
                setActiveFilter("All")
                setQuery("")
                setOnlyQuick(false)
              }}
            >
              Reset Filters
            </button>
            <button type="button" onClick={() => navigate("/ai-chat", { state: { prefill: aiPrefill } })}>
              Ask AI to suggest tests
            </button>
          </div>
        )}
      </div>

      {showFilterModal && (
        <div className="filter-modal-overlay" onClick={() => setShowFilterModal(false)}>
          <div className="filter-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Filter Tests</h3>

            <div className="modal-section">
              <p>Category</p>
              <div className="filter-row">
                {(["All", "Blood Test", "Hormone Test", "Vitamin Test"] as const).map((tag) => (
                  <button
                    key={tag}
                    className={`filter-chip ${modalTag === tag ? "active" : ""}`}
                    type="button"
                    onClick={() => setModalTag(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <label className="quick-toggle">
              <input
                type="checkbox"
                checked={modalQuick}
                onChange={(e) => setModalQuick(e.target.checked)}
              />
              Show only quick tests
            </label>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setModalTag("All")
                  setModalQuick(false)
                }}
              >
                Reset
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  setActiveFilter(modalTag)
                  setOnlyQuick(modalQuick)
                  setShowFilterModal(false)
                }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
