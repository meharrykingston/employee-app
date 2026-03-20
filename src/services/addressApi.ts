import { apiPost } from "./api"
import { getEmployeeAuthSession, getEmployeeCompanySession } from "./authApi"

export type AddressRecord = {
  homeAddress?: string
  homeLat?: number | null
  homeLon?: number | null
  updatedAt?: string
}

export async function getAddressProfile() {
  const auth = getEmployeeAuthSession()
  const company = getEmployeeCompanySession()
  if (!auth?.userId || !company?.companyId) {
    throw new Error("Missing employee session")
  }
  return apiPost<{ address: AddressRecord | null }, { companyId: string; employeeId: string }>(
    "/health/address/get",
    { companyId: company.companyId, employeeId: auth.userId },
  )
}

export async function saveHomeAddress(payload: AddressRecord) {
  const auth = getEmployeeAuthSession()
  const company = getEmployeeCompanySession()
  if (!auth?.userId || !company?.companyId) {
    throw new Error("Missing employee session")
  }
  return apiPost<{ stored: boolean }, AddressRecord & { companyId: string; employeeId: string }>(
    "/health/address/save",
    { companyId: company.companyId, employeeId: auth.userId, ...payload },
  )
}
