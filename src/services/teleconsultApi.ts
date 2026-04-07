import { apiPost } from "./api"

export type TeleconsultRtcPayload = {
  channelName: string
  provider: "webrtc"
  iceServers: RTCIceServer[]
}

export type TeleconsultSessionCreateResponse = {
  sessionId: string
  status: "scheduled" | "live" | "completed" | "cancelled"
  provider: "webrtc"
  channelName: string
  rtc: TeleconsultRtcPayload
}

export type TeleconsultSessionJoinResponse = {
  sessionId: string
  sessionStatus: "scheduled" | "live" | "completed" | "cancelled"
  provider: "webrtc"
  failoverCount: number
  channelName: string
  rtc: TeleconsultRtcPayload
}

export async function createTeleconsultSession(input: {
  companyId: string
  employeeId: string
  doctorId: string
  appointmentId?: string
  scheduledAt?: string
}) {
  return apiPost<TeleconsultSessionCreateResponse, typeof input>("/teleconsult/sessions", input)
}

export async function joinTeleconsultSession(
  sessionId: string,
  input: {
    participantType: "employee" | "doctor"
    participantId: string
    allowEarlyJoin?: boolean
  }
) {
  return apiPost<TeleconsultSessionJoinResponse, typeof input>(`/teleconsult/sessions/${sessionId}/join`, input)
}
