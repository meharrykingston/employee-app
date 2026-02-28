import { FiArrowLeft, FiClock, FiFileText, FiFilter } from "react-icons/fi"
import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
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
  },
  {
    id: "thyroid",
    color: "gray",
    name: "Thyroid Profile",
    desc: "Complete thyroid function test",
    tag: "Hormone Test",
    duration: "8-12 hours",
    fasting: "No special preparation",
  },
  {
    id: "diabetes",
    color: "green",
    name: "Diabetes Screening",
    desc: "HbA1c and blood sugar levels",
    tag: "Blood Test",
    duration: "6-8 hours",
    fasting: "8 hours fasting",
  },
  {
    id: "vitaminD",
    color: "outline",
    name: "Vitamin D Test",
    desc: "Check vitamin D levels",
    tag: "Vitamin Test",
    duration: "12-24 hours",
    fasting: "No fasting required",
  },
  {
    id: "liver",
    color: "outline",
    name: "Liver Function Test",
    desc: "Complete liver health assessment",
    tag: "Blood Test",
    duration: "6-8 hours",
    fasting: "8 hours fasting",
  },
]

export default function LabTestsStep1() {
  const navigate = useNavigate()
  const [query, setQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [activeFilter, setActiveFilter] = useState<"All" | LabTestItem["tag"]>("All")

  const filteredTests = useMemo(() => {
    return TESTS.filter((test) => {
      const tagMatch = activeFilter === "All" || test.tag === activeFilter
      const textMatch =
        test.name.toLowerCase().includes(query.toLowerCase()) ||
        test.desc.toLowerCase().includes(query.toLowerCase())
      return tagMatch && textMatch
    })
  }, [activeFilter, query])

  return (
    <div className="lab-page">
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

      <div className="lab-search-box">
        <input
          placeholder="Search for tests.."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="lab-section-head">
        <h2>Popular Tests</h2>
        <button className="filter-btn" type="button" onClick={() => setShowFilters((prev) => !prev)}>
          <FiFilter /> Filter
        </button>
      </div>

      {showFilters && (
        <div className="filter-row">
          {(["All", "Blood Test", "Hormone Test", "Vitamin Test"] as const).map((tag) => (
            <button
              key={tag}
              className={`filter-chip ${activeFilter === tag ? "active" : ""}`}
              type="button"
              onClick={() => {
                setActiveFilter(tag)
                setShowFilters(false)
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      <div className="lab-list">
        {filteredTests.map((test) => (
          <button
            key={test.id}
            className="lab-test-card"
            onClick={() => navigate("/lab-tests/location", { state: { selectedTest: test } })}
            type="button"
          >
            <div className={`lab-icon ${test.color}`} />

            <div className="lab-info">
              <h3>{test.name}</h3>
              <p>{test.desc}</p>

              <div className="lab-meta-row">
                <span className="pill">{test.tag}</span>
                <span><FiClock /> {test.duration}</span>
              </div>

              <div className="lab-meta-row muted">
                <span><FiFileText /> {test.fasting}</span>
              </div>
            </div>

            {test.quick && <span className="quick-chip">{test.quick}</span>}
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
              }}
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
