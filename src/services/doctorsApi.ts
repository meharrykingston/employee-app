import { apiGet } from './api'

export type DirectoryDoctor = {
  user_id: string
  full_name?: string
  full_display_name?: string
  avatar_url?: string | null
  rating_avg?: number
  rating_count?: number
  consultation_fee_inr?: number
  practice_address?: string | null
  doctor_specializations?: Array<{ specialization_name?: string }>
  doctor_availability?: Array<DoctorAvailabilitySlot>
}

export type DoctorAvailabilitySlot = {
  availability_type: 'virtual' | 'physical'
  day_of_week: number
  start_time: string
  end_time: string
  slot_minutes?: number | null
  is_active?: boolean | null
}

export type DoctorProfile = DirectoryDoctor & {
  user_id: string
  email?: string | null
  mobile?: string | null
}

export async function fetchDoctors(query?: { search?: string; specialization?: string; verificationStatus?: string; limit?: number; offset?: number }) {
  const params = new URLSearchParams()
  if (query?.search) params.set('search', query.search)
  if (query?.specialization) params.set('specialization', query.specialization)
  if (query?.verificationStatus) params.set('verificationStatus', query.verificationStatus)
  if (query?.limit) params.set('limit', String(query.limit))
  if (query?.offset !== undefined) params.set('offset', String(query.offset))
  const suffix = params.toString() ? `?${params.toString()}` : ''
  return apiGet<DirectoryDoctor[]>(`/doctors${suffix}`)
}

export async function fetchDoctorProfile(userId: string) {
  return apiGet<DoctorProfile | null>(`/doctors/${userId}`)
}
