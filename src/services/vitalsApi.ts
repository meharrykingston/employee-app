import { apiPost } from "./api"
import { getEmployeeAuthSession, getEmployeeCompanySession } from "./authApi"

type VitalPayload = {
  metric: "heart_rate"
  value: number
  unit: string
  source: "camera" | "device" | "manual"
  signalQuality?: number
}

const QUEUE_KEY = "employee_vitals_queue"

type QueuedVital = VitalPayload & {
  queuedAt: string
}

function readQueue(): QueuedVital[] {
  const raw = localStorage.getItem(QUEUE_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as QueuedVital[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeQueue(items: QueuedVital[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(items))
}

function enqueueVital(payload: VitalPayload) {
  const next: QueuedVital[] = [
    { ...payload, queuedAt: new Date().toISOString() },
    ...readQueue(),
  ].slice(0, 50)
  writeQueue(next)
}

export async function flushQueuedVitals() {
  const auth = getEmployeeAuthSession()
  const company = getEmployeeCompanySession()
  if (!auth?.userId || !company?.companyId) return
  const queue = readQueue()
  if (!queue.length) return
  const remaining: QueuedVital[] = []
  for (const item of queue) {
    try {
      await apiPost<
        { status: string },
        { companyId: string; employeeId: string } & VitalPayload
      >("/health/vitals", {
        companyId: company.companyId,
        employeeId: auth.userId,
        metric: item.metric,
        value: item.value,
        unit: item.unit,
        source: item.source,
        signalQuality: item.signalQuality,
      })
    } catch {
      remaining.push(item)
    }
  }
  writeQueue(remaining)
}

export async function saveVitalReading(payload: VitalPayload) {
  const auth = getEmployeeAuthSession()
  const company = getEmployeeCompanySession()
  if (!auth?.userId || !company?.companyId) {
    throw new Error("Missing employee session")
  }

  const attempt = async () =>
    apiPost<
      { status: string },
      { companyId: string; employeeId: string } & VitalPayload
    >("/health/vitals", {
      companyId: company.companyId,
      employeeId: auth.userId,
      ...payload,
    })

  try {
    return await attempt()
  } catch (error) {
    await new Promise((resolve) => window.setTimeout(resolve, 1200))
    try {
      return await attempt()
    } catch (retryError) {
      enqueueVital(payload)
      throw retryError
    }
  }
}
