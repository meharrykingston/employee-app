import { apiPost } from "./api"

export type TeleconsultRtcPayload = {
  provider: "zego" | "agora"
  appId: string
  userId: string
  channelName: string
  token: string | null
}

export type TeleconsultSessionCreateResponse = {
  sessionId: string
  status: "scheduled" | "live" | "completed" | "cancelled"
  provider: "zego" | "agora"
  channelName: string
  rtc: TeleconsultRtcPayload
}

export type TeleconsultSessionJoinResponse = {
  sessionId: string
  sessionStatus: "scheduled" | "live" | "completed" | "cancelled"
  provider: "zego" | "agora"
  failoverCount: number
  channelName: string
  rtc: TeleconsultRtcPayload
}

export async function createTeleconsultSession(input: {
  companyId: string
  employeeId: string
  doctorId: string
  appointmentId?: string
  preferredProvider?: "zego" | "agora"
  scheduledAt?: string
}) {
  return apiPost<TeleconsultSessionCreateResponse, typeof input>("/teleconsult/sessions", input)
}

export async function joinTeleconsultSession(
  sessionId: string,
  input: {
    participantType: "employee" | "doctor"
    participantId: string
    preferredProvider?: "zego" | "agora"
    forceFailover?: boolean
  }
) {
  return apiPost<TeleconsultSessionJoinResponse, typeof input>(`/teleconsult/sessions/${sessionId}/join`, input)
}
