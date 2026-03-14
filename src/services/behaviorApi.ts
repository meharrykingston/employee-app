import { apiPost } from "./api"
import { getEmployeeAuthSession, getEmployeeCompanySession } from "./authApi"

export type BehaviorSignalPayload = {
  type: string
  label?: string
  tags?: string[]
  meta?: Record<string, unknown>
}

export async function logBehaviorSignal(payload: BehaviorSignalPayload) {
  const auth = getEmployeeAuthSession()
  const company = getEmployeeCompanySession()
  try {
    return await apiPost("/behavior/signal", {
      type: payload.type,
      label: payload.label,
      tags: payload.tags ?? [],
      meta: payload.meta ?? {},
      source: "employee-app",
      userId: auth?.userId ?? null,
      companyId: company?.companyId ?? null,
    })
  } catch {
    return null
  }
}
