import { apiPost } from "./api"
import { getEmployeeAuthSession, getEmployeeCompanySession } from "./authApi"

export type HealthProfile = {
  bloodGroup?: string | null
  heightCm?: number | null
  heightFt?: number | null
  heightIn?: number | null
  weightKg?: number | null
  waistIn?: number | null
  allergies?: string
  conditions?: string
  medications?: string
  notes?: string
  updatedAt?: string
}

export async function getHealthProfile() {
  const auth = getEmployeeAuthSession()
  const company = getEmployeeCompanySession()
  if (!auth?.userId || !company?.companyId) {
    throw new Error("Missing employee session")
  }
  return apiPost<{ profile: HealthProfile | null }, { companyId: string; employeeId: string }>(
    "/health/profile/get",
    {
      companyId: company.companyId,
      employeeId: auth.userId,
    },
  )
}

export async function saveHealthProfile(profile: HealthProfile) {
  const auth = getEmployeeAuthSession()
  const company = getEmployeeCompanySession()
  if (!auth?.userId || !company?.companyId) {
    throw new Error("Missing employee session")
  }
  return apiPost<{ stored: boolean }, HealthProfile & { companyId: string; employeeId: string }>(
    "/health/profile/save",
    {
      companyId: company.companyId,
      employeeId: auth.userId,
      ...profile,
    },
  )
}
