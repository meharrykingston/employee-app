import { apiPost } from "./api"

export type EmployeeCompanyAuth = {
  companyId: string
  companyCode: string
  companyName: string
  companySlug?: string | null
  hrPhone?: string | null
}

export type EmployeeLoginResponse = {
  userId: string
  role: string
  fullName?: string | null
  email?: string | null
  phone?: string | null
  avatarUrl?: string | null
  companyId?: string | null
  companyName?: string | null
  companySlug?: string | null
}

const EMPLOYEE_AUTH_KEY = "astikan_employee_auth"
const EMPLOYEE_COMPANY_KEY = "astikan_employee_company"

export function saveEmployeeCompanySession(payload: EmployeeCompanyAuth) {
  localStorage.setItem(EMPLOYEE_COMPANY_KEY, JSON.stringify(payload))
}

export function getEmployeeCompanySession(): EmployeeCompanyAuth | null {
  const raw = localStorage.getItem(EMPLOYEE_COMPANY_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as EmployeeCompanyAuth
  } catch {
    return null
  }
}

export function saveEmployeeAuthSession(payload: EmployeeLoginResponse) {
  localStorage.setItem(EMPLOYEE_AUTH_KEY, JSON.stringify(payload))
}

export function getEmployeeAuthSession(): EmployeeLoginResponse | null {
  const raw = localStorage.getItem(EMPLOYEE_AUTH_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as EmployeeLoginResponse
  } catch {
    return null
  }
}

export function clearEmployeeAuthSession() {
  localStorage.removeItem(EMPLOYEE_AUTH_KEY)
}

export function clearEmployeeCompanySession() {
  localStorage.removeItem(EMPLOYEE_COMPANY_KEY)
}

export function authorizeEmployeeCompany(companyCode: string) {
  return apiPost<EmployeeCompanyAuth, { companyCode: string }>("/auth/employee/company-authorize", { companyCode })
}

export function loginEmployee(email: string, password: string) {
  return apiPost<EmployeeLoginResponse, { email: string; password: string }>("/auth/employee/login", { email, password })
}
