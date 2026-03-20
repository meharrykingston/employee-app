import { apiGet, apiPost } from "./api"
import { getEmployeeAuthSession, getEmployeeCompanySession } from "./authApi"

export type SugarChallengeState = Record<string, unknown>

export async function getSugarChallengeState() {
  const auth = getEmployeeAuthSession()
  const company = getEmployeeCompanySession()
  if (!auth?.userId) {
    throw new Error("Missing employee session")
  }
  const params = new URLSearchParams({
    employeeId: auth.userId,
  })
  if (company?.companyId) params.set("companyId", company.companyId)
  return apiGet<{ state: SugarChallengeState | null }>(`/challenges/sugar?${params.toString()}`)
}

export async function saveSugarChallengeState(state: SugarChallengeState) {
  const auth = getEmployeeAuthSession()
  const company = getEmployeeCompanySession()
  if (!auth?.userId) {
    throw new Error("Missing employee session")
  }
  return apiPost<{ stored: boolean }, { employeeId: string; companyId?: string; state: SugarChallengeState }>(
    "/challenges/sugar/save",
    {
      employeeId: auth.userId,
      companyId: company?.companyId,
      state,
    },
  )
}

export async function getSugarCoachReply(payload: {
  day: number
  sugarTotal: number
  limit: number
  meals: Array<{ title?: string; sugar?: number }>
  question?: string
}) {
  const auth = getEmployeeAuthSession()
  if (!auth?.userId) {
    throw new Error("Missing employee session")
  }
  return apiPost<{ reply: string }, { employeeId: string } & typeof payload>("/challenges/sugar/coach", {
    employeeId: auth.userId,
    ...payload,
  })
}

export async function getSugarLeaderboard() {
  const auth = getEmployeeAuthSession()
  const company = getEmployeeCompanySession()
  const params = new URLSearchParams({ type: "sugar" })
  if (auth?.userId) params.set("employeeId", auth.userId)
  if (company?.companyId) params.set("companyId", company.companyId)
  return apiGet<{ leaderboard: Array<{ employeeId: string; coins: number; completedDays: number }>; rank: number | null }>(
    `/challenges/leaderboard?${params.toString()}`,
  )
}
