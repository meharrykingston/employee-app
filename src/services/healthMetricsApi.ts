import { apiPost } from "./api"
import { getEmployeeAuthSession, getEmployeeCompanySession } from "./authApi"

export type HealthMetricsPayload = {
  heightCm?: number
  weightKg?: number
  waistCm?: number
}

export type HealthMetricsRecord = {
  heightCm?: number | null
  weightKg?: number | null
  waistCm?: number | null
  updatedAt?: string | null
}

export async function getHealthMetrics() {
  const auth = getEmployeeAuthSession()
  const company = getEmployeeCompanySession()
  if (!auth?.userId || !company?.companyId) {
    throw new Error("Missing employee session")
  }

  return apiPost<{ metrics: HealthMetricsRecord | null }, { companyId: string; employeeId: string }>(
    "/health/metrics/get",
    {
      companyId: company.companyId,
      employeeId: auth.userId,
    },
  )
}

export async function saveHealthMetrics(payload: HealthMetricsPayload) {
  const auth = getEmployeeAuthSession()
  const company = getEmployeeCompanySession()
  if (!auth?.userId || !company?.companyId) {
    throw new Error("Missing employee session")
  }

  return apiPost<{ employeeId: string }, { companyId: string; employeeId: string } & HealthMetricsPayload>(
    "/health/metrics",
    {
      companyId: company.companyId,
      employeeId: auth.userId,
      ...payload,
    },
  )
}
