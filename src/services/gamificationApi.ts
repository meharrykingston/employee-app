import { apiGet } from "./api"
import { getEmployeeAuthSession, getEmployeeCompanySession } from "./authApi"

export type GamificationSummary = {
  coins: number
  streak: number
  level: number
  rank: number | null
  badgesUnlocked: number
  milestones: Array<{ label: string; badge: string; progress: number; claimed: boolean }>
  transactions: Array<{ title: string; meta: string; value: number }>
}

export type GamificationBadges = {
  yourRank: number
  level: number
  streak: number
  coins: number
  badgesUnlocked: number
  topRanks: Array<{ initials: string; name: string; coins: number; badges: number; tone: string }>
  rankings: Array<{ rank: number; initials: string; name: string; level: number; streak: number; coins: number; badges: number; trend: number; isYou?: boolean }>
  badgeCollection: Array<{ title: string; subtitle: string; rarity: string; unlocked: boolean; progress: number }>
}

function buildParams() {
  const auth = getEmployeeAuthSession()
  const company = getEmployeeCompanySession()
  if (!auth?.userId) throw new Error("Missing employee session")
  const params = new URLSearchParams({ employeeId: auth.userId })
  if (company?.companyId) params.set("companyId", company.companyId)
  return params
}

export async function fetchGamificationSummary() {
  const params = buildParams()
  return apiGet<GamificationSummary>(`/gamification/summary?${params.toString()}`)
}

export async function fetchGamificationBadges() {
  const params = buildParams()
  return apiGet<GamificationBadges>(`/gamification/badges?${params.toString()}`)
}
