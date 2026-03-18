import { apiPost } from "./api"
import { getEmployeeAuthSession, getEmployeeCompanySession } from "./authApi"

type VitalPayload = {
  metric: "heart_rate"
  value: number
  unit: string
  source: "camera" | "device" | "manual"
  signalQuality?: number
}

export async function saveVitalReading(payload: VitalPayload) {
  const auth = getEmployeeAuthSession()
  const company = getEmployeeCompanySession()
  if (!auth?.userId || !company?.companyId) {
    throw new Error("Missing employee session")
  }

  return apiPost<
    { status: string },
    { companyId: string; employeeId: string } & VitalPayload
  >("/health/vitals", {
    companyId: company.companyId,
    employeeId: auth.userId,
    ...payload,
  })
}
