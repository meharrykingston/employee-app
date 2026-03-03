import { useCallback, useEffect, useMemo, useRef, useState } from "react"
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
import { askAiChat, getAiLabReadinessQuestions, type ReadinessQuestion } from "../../services/aiApi"
import { useProcessLoading } from "../../app/process-loading"
import { getCachedLabCatalog, getLabCatalog, preloadLabCatalog, type LabCatalogTest } from "../../services/labApi"
import "./labtest.css"

type TestIcon = "blood" | "heart" | "hormone" | "sugar" | "vitamin" | "liver"

type LabTestItem = {
  id: string
  code?: string
  color: "red" | "blue" | "gray" | "green" | "outline"
  name: string
  desc: string
  tag: string
  duration: string
  fasting: string
  icon: TestIcon
  quick?: string
}

const SYMPTOM_CHIPS = ["Typhoid", "High Sugar", "High BP", "Thyroid", "Fever"]
const SYMPTOM_KEYWORDS: Record<string, string[]> = {
  Typhoid: ["typhoid", "widal", "salmonella", "fever profile"],
  "High Sugar": ["hba1c", "blood sugar", "glucose", "diabetes"],
  "High BP": ["lipid", "kidney", "creatinine", "electrolyte", "ecg"],
  Thyroid: ["thyroid", "tsh", "t3", "t4"],
  Fever: ["cbc", "crp", "esr", "dengue", "malaria", "fever"],
}

const INTENT_KEYWORD_HINTS: Array<{ trigger: RegExp; keywords: string[] }> = [
  { trigger: /\b(?:tyfoid|tifoid|taifoid|typhoid)\b/i, keywords: ["typhoid", "widal", "cbc"] },
  {
    trigger: /\b(?:suger|sugr|diabit|diabet|sugar|glucose)\b/i,
    keywords: ["hba1c", "glucose", "diabetes"],
  },
  {
    trigger: /\b(?:bp|blood pressure|hypert|high pressure)\b/i,
    keywords: ["lipid", "creatinine", "kidney"],
  },
  { trigger: /\b(?:thyriod|thyrod|thyroid|tsh)\b/i, keywords: ["thyroid", "tsh", "t3", "t4"] },
  { trigger: /\b(?:fever|viral|infection|dengu|malaria)\b/i, keywords: ["cbc", "crp", "esr", "dengue"] },
  { trigger: /\b(?:fatigue|weak|low energy|tired)\b/i, keywords: ["cbc", "vitamin b12", "vitamin d", "thyroid"] },
  { trigger: /\b(?:hair fall|hairfall|hair)\b/i, keywords: ["ferritin", "vitamin d", "thyroid", "b12"] },
  { trigger: /\b(?:paracetamol|crocin|dolo)\b/i, keywords: ["cbc", "crp", "liver function"] },
  { trigger: /\b(?:metformin|insulin|glimepiride)\b/i, keywords: ["hba1c", "glucose", "kidney"] },
  { trigger: /\b(?:atorvastatin|rosuvastatin|statin)\b/i, keywords: ["lipid profile", "liver function"] },
]

function normalizeForMatch(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim()
}

function words(value: string) {
  return normalizeForMatch(value).split(" ").filter(Boolean)
}

function editDistance(a: string, b: string) {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length

  const dp = Array.from({ length: a.length + 1 }, (_, i) => {
    const row = new Array<number>(b.length + 1).fill(0)
    row[0] = i
    return row
  })

  for (let j = 0; j <= b.length; j += 1) {
    dp[0][j] = j
  }

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost)
    }
  }

  return dp[a.length][b.length]
}

function tokenLooksLikeMatch(queryToken: string, candidateToken: string) {
  if (!queryToken || !candidateToken) return false
  if (candidateToken.includes(queryToken) || queryToken.includes(candidateToken)) return true

  if (queryToken.length <= 3 || candidateToken.length <= 3) {
    return false
  }

  const distance = editDistance(queryToken, candidateToken)
  const maxLen = Math.max(queryToken.length, candidateToken.length)
  return distance <= (maxLen >= 8 ? 2 : 1)
}

function getIntentKeywords(query: string) {
  const normalized = normalizeForMatch(query)
  const keywordSet = new Set<string>([normalized])
  for (const item of INTENT_KEYWORD_HINTS) {
    if (item.trigger.test(normalized)) {
      for (const keyword of item.keywords) {
        keywordSet.add(keyword)
      }
    }
  }
  return Array.from(keywordSet).filter(Boolean)
}

function getFuzzyLocalMatches(tests: LabTestItem[], query: string) {
  const queryTokens = words(query)
  if (queryTokens.length === 0) return []

  return tests.filter((test) => {
    const testTokens = words(`${test.name} ${test.desc} ${test.tag} ${test.code ?? ""}`)
    return queryTokens.some((queryToken) =>
      testTokens.some((candidateToken) => tokenLooksLikeMatch(queryToken, candidateToken))
    )
  })
}

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

function mapCategoryToIcon(tag: string): TestIcon {
  const value = tag.toLowerCase()
  if (value.includes("blood")) return "blood"
  if (value.includes("liver")) return "liver"
  if (value.includes("vitamin")) return "vitamin"
  if (value.includes("hormone") || value.includes("thyroid")) return "hormone"
  if (value.includes("lipid") || value.includes("heart")) return "heart"
  if (value.includes("diabetes") || value.includes("sugar")) return "sugar"
  return "blood"
}

function mapCategoryToColor(tag: string): LabTestItem["color"] {
  const value = tag.toLowerCase()
  if (value.includes("blood")) return "red"
  if (value.includes("liver")) return "green"
  if (value.includes("vitamin")) return "outline"
  if (value.includes("hormone") || value.includes("thyroid")) return "gray"
  if (value.includes("lipid") || value.includes("heart")) return "blue"
  if (value.includes("diabetes") || value.includes("sugar")) return "green"
  return "outline"
}

function toLabTestItem(item: LabCatalogTest): LabTestItem {
  const subtitle = item.code ? `Test Code: ${item.code}` : "Comprehensive health test"

  return {
    id: item.id,
    code: item.code,
    color: mapCategoryToColor(item.category),
    name: item.name,
    desc: subtitle,
    tag: item.category,
    duration: item.reportingTime || "Not available",
    fasting: "Preparation details available in test description",
    icon: mapCategoryToIcon(item.category),
    quick: item.reportingTime.toLowerCase().includes("same day") ? "Same day" : undefined,
  }
}

export default function LabTestsStep1() {
  const PAGE_SIZE = 10
  const navigate = useNavigate()
  const { start: startProcessLoading, stop: stopProcessLoading } = useProcessLoading()
  const [query, setQuery] = useState("")
  const [allTests, setAllTests] = useState<LabTestItem[]>([])
  const [allCategories, setAllCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [aiFiltering, setAiFiltering] = useState(false)
  const [queryResolving, setQueryResolving] = useState(false)
  const [queryResolvedTests, setQueryResolvedTests] = useState<LabTestItem[] | null>(null)
  const [loadError, setLoadError] = useState("")
  const [total, setTotal] = useState(0)
  const [nextOffset, setNextOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [activeFilter, setActiveFilter] = useState<"All" | LabTestItem["tag"]>("All")
  const [modalTag, setModalTag] = useState<"All" | string>("All")
  const [onlyQuick, setOnlyQuick] = useState(false)
  const [modalQuick, setModalQuick] = useState(false)
  const [aiFilteredTestIds, setAiFilteredTestIds] = useState<Set<string> | null>(null)
  const [selectingTestId, setSelectingTestId] = useState<string | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const searchCacheRef = useRef<Map<string, LabTestItem[]>>(new Map())

  const fetchPage = useCallback(
    async (offset: number, append: boolean) => {
      if (append) {
        setLoadingMore(true)
      } else {
        setLoading(true)
      }
      setLoadError("")

      try {
        const data =
          offset === 0
            ? await preloadLabCatalog("", PAGE_SIZE, 0)
            : await getLabCatalog("", PAGE_SIZE, offset)

        const mappedTests = data.tests.map(toLabTestItem)
        const categories = data.categories.map((item) => item.name)

        setTotal(data.total)
        setAllCategories(categories)
        setAllTests((prev) => (append ? [...prev, ...mappedTests] : mappedTests))
        setNextOffset(offset + mappedTests.length)
        setHasMore(offset + mappedTests.length < data.total && mappedTests.length > 0)
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unable to load tests"
        setLoadError(message)
      } finally {
        if (append) {
          setLoadingMore(false)
        } else {
          setLoading(false)
        }
      }
    },
    []
  )

  useEffect(() => {
    const cached = getCachedLabCatalog("", PAGE_SIZE, 0)
    if (cached) {
      const mappedTests = cached.tests.map(toLabTestItem)
      setAllTests(mappedTests)
      setAllCategories(cached.categories.map((item) => item.name))
      setTotal(cached.total)
      setNextOffset(mappedTests.length)
      setHasMore(mappedTests.length < cached.total)
      setLoading(false)
      return
    }
    void fetchPage(0, false)
  }, [fetchPage])

  const availableTags = useMemo(() => {
    return ["All", ...allCategories] as const
  }, [allCategories])

  const localQueryMatches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return allTests
    return allTests.filter((test) => {
      const hay = `${test.name} ${test.desc} ${test.tag}`.toLowerCase()
      return hay.includes(q)
    })
  }, [allTests, query])

  useEffect(() => {
    const q = query.trim()
    if (!q) {
      setQueryResolving(false)
      setQueryResolvedTests(null)
      return
    }

    const cacheKey = normalizeForMatch(q)
    const cached = searchCacheRef.current.get(cacheKey)
    if (cached) {
      setQueryResolving(false)
      setQueryResolvedTests(cached)
      return
    }

    if (localQueryMatches.length > 0) {
      setQueryResolving(false)
      setQueryResolvedTests(null)
      return
    }

    const fuzzyLocal = getFuzzyLocalMatches(allTests, q)
    if (fuzzyLocal.length > 0) {
      setQueryResolving(false)
      setQueryResolvedTests(fuzzyLocal)
      return
    }

    let active = true
    const controller = new AbortController()
    setQueryResolving(true)
    const timer = window.setTimeout(async () => {
      if (!active) return

      try {
        const matches = new Map<string, LabTestItem>()
        const direct = await getLabCatalog(q, 10, 0, controller.signal)
        if (!active) return

        if (direct.tests.length > 0) {
          const directResults = direct.tests.map(toLabTestItem)
          for (const item of directResults) {
            matches.set(item.id, item)
          }
          setQueryResolvedTests(directResults)
        }

        const intentKeywords = getIntentKeywords(q).slice(0, 8)
        await Promise.all(
          intentKeywords.map(async (keyword) => {
            try {
              const byIntent = await getLabCatalog(keyword, 3, 0, controller.signal)
              for (const item of byIntent.tests) {
                matches.set(item.id, toLabTestItem(item))
              }
            } catch {
              // Continue with other intent keywords.
            }
          })
        )

        if (matches.size > 0) {
          const intentResults = Array.from(matches.values())
          setQueryResolvedTests(intentResults)
        }

        if (q.length >= 3) {
          const ai = await askAiChat({
            message:
              `User typed this while searching lab tests: "${q}". ` +
              "Input may contain wrong spelling, symptom name, disease name, or medicine name. " +
              "Map it to relevant lab tests and suggest only test names.",
            history: [],
          })
          if (!active) return

          await Promise.all(
            (ai.suggestedTests ?? []).map(async (suggestion) => {
              const keyword = suggestion.name.trim()
              if (!keyword) return
              try {
                const bySuggestion = await getLabCatalog(keyword, 3, 0, controller.signal)
                for (const item of bySuggestion.tests) {
                  matches.set(item.id, toLabTestItem(item))
                }
              } catch {
                // Ignore one failed suggestion and continue.
              }
            })
          )
        }

        const finalResults = matches.size > 0 ? Array.from(matches.values()) : []
        searchCacheRef.current.set(cacheKey, finalResults)
        setQueryResolvedTests(finalResults)
      } catch {
        if (active) {
          searchCacheRef.current.set(cacheKey, [])
          setQueryResolvedTests([])
        }
      } finally {
        if (active) {
          setQueryResolving(false)
        }
      }
    }, 220)

    return () => {
      active = false
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [allTests, localQueryMatches.length, query])

  const baseDisplayTests = useMemo(() => {
    const q = query.trim()
    if (!q) return allTests
    if (localQueryMatches.length > 0) return allTests
    if (queryResolvedTests !== null) return queryResolvedTests
    return allTests
  }, [allTests, localQueryMatches.length, query, queryResolvedTests])

  const filteredTests = useMemo(() => {
    const q = query.trim().toLowerCase()
    const resolvedMode = !!q && localQueryMatches.length === 0 && queryResolvedTests !== null

    return baseDisplayTests.filter((test) => {
      const tagMatch = activeFilter === "All" || test.tag === activeFilter
      const textMatch =
        resolvedMode || !q
          ? true
          : test.name.toLowerCase().includes(q) || test.desc.toLowerCase().includes(q)
      const quickMatch = !onlyQuick || !!test.quick
      const aiMatch = !aiFilteredTestIds || aiFilteredTestIds.has(test.id)
      return tagMatch && textMatch && quickMatch && aiMatch
    })
  }, [
    activeFilter,
    aiFilteredTestIds,
    baseDisplayTests,
    localQueryMatches.length,
    onlyQuick,
    query,
    queryResolvedTests,
  ])

  const aiPrefill = useMemo(() => {
    const base = query.trim() ? `I have ${query.trim()}.` : "Help me choose the right lab test."
    const tagHint = activeFilter !== "All" ? ` Focus on ${activeFilter.toLowerCase()} options.` : ""
    const quickHint = onlyQuick ? " Prioritize quick report tests." : ""
    return `${base}${tagHint}${quickHint} Suggest top 3 tests with reason and preparation.`
  }, [activeFilter, onlyQuick, query])

  useEffect(() => {
    const target = loadMoreRef.current
    if (!target) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (!entry?.isIntersecting) {
          return
        }
        if (loading || loadingMore || !hasMore || !!loadError) {
          return
        }
        void fetchPage(nextOffset, true)
      },
      { rootMargin: "180px 0px" }
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [fetchPage, hasMore, loadError, loading, loadingMore, nextOffset])

  async function applyAiSymptomFilter(symptom: string) {
    setQuery("")
    setAiFiltering(true)

    try {
      const localKeywords = SYMPTOM_KEYWORDS[symptom] ?? [symptom]
      const locallyMatched = allTests.filter((test) => {
        const hay = `${test.name} ${test.desc} ${test.tag}`.toLowerCase()
        return localKeywords.some((k) => hay.includes(k.toLowerCase()))
      })
      const matchedIds = new Set<string>(locallyMatched.map((item) => item.id))

      const result = await askAiChat({
        message: `User symptom focus: ${symptom}. Suggest the most relevant lab tests.`,
        history: [],
      })

      const suggestions = result.suggestedTests ?? []
      await Promise.all(
        suggestions.map(async (s) => {
          const name = s.name.toLowerCase().trim()
          const match = allTests.find((test) =>
            test.name.toLowerCase().includes(name) || name.includes(test.name.toLowerCase())
          )
          if (match) {
            matchedIds.add(match.id)
            return
          }

          try {
            const remote = await getLabCatalog(s.name, 3, 0)
            for (const t of remote.tests) {
              matchedIds.add(t.id)
            }
          } catch {
            // Ignore per-suggestion failure.
          }
        })
      )

      setAiFilteredTestIds(matchedIds.size > 0 ? matchedIds : null)
    } catch {
      setAiFilteredTestIds(null)
    } finally {
      setAiFiltering(false)
    }
  }

  async function onSelectTest(test: LabTestItem) {
    setSelectingTestId(test.id)
    startProcessLoading()
    try {
      const readiness = await getAiLabReadinessQuestions({
        testName: test.name,
        fastingInfo: test.fasting,
      })
      navigate("/lab-tests/readiness", {
        state: {
          selectedTest: test,
          readinessQuestions: readiness.questions as ReadinessQuestion[],
        },
      })
    } catch {
      navigate("/lab-tests/readiness", { state: { selectedTest: test } })
    } finally {
      setSelectingTestId(null)
      stopProcessLoading()
    }
  }

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
            <button key={chip} type="button" onClick={() => void applyAiSymptomFilter(chip)}>
              {chip}
            </button>
          ))}
        </div>
      </section>

      <div className="lab-search-box lab-search-box--rich">
        <FiSearch className="search-icon" />
        <input
          placeholder="Search test or symptom (AI assisted)"
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
        <span>
          {loading
            ? "Loading..."
            : aiFiltering
              ? "AI filtering..."
              : queryResolving
                ? "Finding best matches..."
              : `${filteredTests.length} of ${total || filteredTests.length}`}
        </span>
        {onlyQuick && <span className="active-quick">Quick only</span>}
      </div>

      <div className="lab-list">
        {loadError && (
          <div className="empty-state">
            <p>{loadError}</p>
            <button type="button" onClick={() => window.location.reload()}>
              Retry
            </button>
          </div>
        )}

        {loading && !loadError && (
          <div className="lab-loading-wrap" aria-live="polite" aria-label="Loading tests">
            <span className="lab-loading-spinner" />
          </div>
        )}

        {aiFiltering && !loading && !loadError && (
          <div className="lab-loading-wrap" aria-live="polite" aria-label="Finding matching tests">
            <span className="lab-loading-spinner" />
          </div>
        )}

        {queryResolving && !loading && !loadError && !aiFiltering && (
          <div className="lab-loading-wrap" aria-live="polite" aria-label="Resolving search with AI">
            <span className="lab-loading-spinner" />
          </div>
        )}

        {filteredTests.map((test) => (
          <button
            key={test.id}
            className="lab-test-card"
            onClick={() => void onSelectTest(test)}
            type="button"
            disabled={selectingTestId === test.id}
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

        {!loading && !loadError && !aiFiltering && !queryResolving && filteredTests.length === 0 && (
          <div className="empty-state">
            <p>No tests found for this filter.</p>
            <button
              type="button"
              onClick={() => {
                setActiveFilter("All")
                setQuery("")
                setOnlyQuick(false)
                setAiFilteredTestIds(null)
                setQueryResolvedTests(null)
              }}
            >
              Reset Filters
            </button>
            <button
              type="button"
              onClick={() =>
                navigate("/ai-chat", {
                  state: { prefill: query.trim() || aiPrefill },
                })
              }
            >
              Ask AI about "{query.trim() || "symptoms"}"
            </button>
          </div>
        )}

        {!loading && !loadError && !aiFiltering && hasMore && filteredTests.length > 0 && (
          <div className="lab-load-more-sentinel" ref={loadMoreRef}>
            {loadingMore && <span className="lab-loading-spinner" aria-label="Loading more tests" />}
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
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    className={`filter-chip ${modalTag === tag ? "active" : ""}`}
                    type="button"
                    onClick={() => setModalTag(tag as "All" | LabTestItem["tag"])}
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
