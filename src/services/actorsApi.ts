import { apiPost } from './api'

type EmployeeBootstrapResponse = {
  companyId: string
  employeeUserId: string
  employeeCode: string
  email: string
}

const EMPLOYEE_ACTOR_KEY = 'astikan_employee_actor'

export async function ensureEmployeeActor(input: {
  companyReference?: string
  companyName?: string
  email?: string
  phone?: string
  fullName?: string
  handle?: string
  employeeCode?: string
}) {
  const raw = localStorage.getItem(EMPLOYEE_ACTOR_KEY)
  if (raw) {
    try {
      return JSON.parse(raw) as EmployeeBootstrapResponse
    } catch {
      localStorage.removeItem(EMPLOYEE_ACTOR_KEY)
    }
  }

  const actor = await apiPost<EmployeeBootstrapResponse, typeof input>('/employees/bootstrap', input)
  localStorage.setItem(EMPLOYEE_ACTOR_KEY, JSON.stringify(actor))
  return actor
}

export async function ensureDoctorActor(input: {
  email?: string
  phone?: string
  fullName?: string
  handle?: string
  specialization?: string
}) {
  return apiPost<{ userId: string; email: string; fullName: string }, typeof input>('/doctors/bootstrap', input)
}
