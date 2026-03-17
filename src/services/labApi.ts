import { apiGet, apiPost } from './api'

export type LabCatalogTest = {
  id: string
  code: string
  name: string
  reportingTime: string
  price: number | null
  category: string
}

type LabCatalogResponse = {
  keyword: string
  total: number
  categories: Array<{ name: string; count: number }>
  tests: LabCatalogTest[]
}

const CACHE_PREFIX = 'lab-catalog:'

function cacheKey(keyword = '', limit = 10, offset = 0) {
  return `${CACHE_PREFIX}${keyword.trim().toLowerCase() || '__all__'}:${limit}:${offset}`
}

function readCache(keyword = '', limit = 10, offset = 0) {
  const raw = sessionStorage.getItem(cacheKey(keyword, limit, offset))
  if (!raw) return null
  try {
    return JSON.parse(raw) as LabCatalogResponse
  } catch {
    sessionStorage.removeItem(cacheKey(keyword, limit, offset))
    return null
  }
}

function writeCache(keyword: string, limit: number, offset: number, payload: LabCatalogResponse) {
  sessionStorage.setItem(cacheKey(keyword, limit, offset), JSON.stringify(payload))
}

export function getCachedLabCatalog(keyword = '', limit = 10, offset = 0) {
  return readCache(keyword, limit, offset)
}

export async function getLabCatalog(keyword = '', limit = 10, offset = 0, _signal?: AbortSignal) {
  const data = await apiGet<LabCatalogResponse>(`/lab/catalog?keyword=${encodeURIComponent(keyword)}&limit=${limit}&offset=${offset}`)
  writeCache(keyword, limit, offset, data)
  return data
}

export async function preloadLabCatalog(keyword = '', limit = 10, offset = 0) {
  const cached = readCache(keyword, limit, offset)
  if (cached) return cached
  return getLabCatalog(keyword, limit, offset)
}

export async function warmLabCatalogSearchIndex() {
  await Promise.all([
    preloadLabCatalog('', 10, 0),
    preloadLabCatalog('cbc', 10, 0),
    preloadLabCatalog('thyroid', 10, 0),
    preloadLabCatalog('glucose', 10, 0),
  ])
}

export async function bookLabOrder(input: Record<string, unknown>) {
  return apiPost<Record<string, unknown>, Record<string, unknown>>('/lab/book-order', input)
}

export type LabOrder = {
  id: string
  providerOrderReference: string | null
  status: string
  slotAt: string | null
  createdAt: string
  testName: string
  reportKey: string | null
}

type LabOrdersResponse = {
  status: string
  data: Array<{
    id: string
    provider_order_reference: string | null
    status: string
    slot_at: string | null
    created_at: string
    report_storage_key: string | null
    lab_test_catalog?: {
      name?: string | null
      provider_test_code?: string | null
    } | null
  }>
}

export async function getLabOrders(employeeId: string) {
  const data = await apiGet<LabOrdersResponse>(`/lab/orders?employeeId=${encodeURIComponent(employeeId)}`)
  return (data?.data ?? []).map((item) => ({
    id: item.id,
    providerOrderReference: item.provider_order_reference ?? null,
    status: item.status ?? "created",
    slotAt: item.slot_at ?? null,
    createdAt: item.created_at,
    reportKey: item.report_storage_key ?? null,
    testName: item.lab_test_catalog?.name ?? "Lab Test",
  })) as LabOrder[]
}

export async function getLabOrderById(orderId: string) {
  const data = await apiGet<{ status: string; data: LabOrdersResponse["data"][0] }>(`/lab/orders/${orderId}`)
  const item = data?.data
  if (!item) return null
  return {
    id: item.id,
    providerOrderReference: item.provider_order_reference ?? null,
    status: item.status ?? "created",
    slotAt: item.slot_at ?? null,
    createdAt: item.created_at,
    reportKey: item.report_storage_key ?? null,
    testName: item.lab_test_catalog?.name ?? "Lab Test",
  } as LabOrder
}

export async function getLabReportLink(orderId: string, employeeId: string) {
  const data = await apiGet<{ status: string; data: { url: string } }>(
    `/lab/orders/${orderId}/report-link?employeeId=${encodeURIComponent(employeeId)}`
  )
  return data?.data?.url ?? null
}

export function buildReportDownloadName(testName: string, createdAt: string) {
  const date = new Date(createdAt)
  const formatted = date.toLocaleDateString("en-CA")
  const safeName = testName.replace(/[^a-z0-9]+/gi, "-").replace(/(^-|-$)/g, "")
  return `${safeName || "lab-report"}-${formatted}.pdf`
}

export function subscribeLabOrderUpdates(
  employeeId: string,
  onUpdate: (updates: Array<{ id: string; status: string; testName: string; reportReady: boolean }>) => void
) {
  const source = new EventSource(`/api/lab/orders/stream?employeeId=${encodeURIComponent(employeeId)}`)
  const handler = (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data) as Array<{ id: string; status: string; testName: string; reportReady: boolean }>
      onUpdate(data)
    } catch {
      // ignore
    }
  }
  source.addEventListener("lab-order-update", handler)
  source.addEventListener("error", () => {
    // keep open, browser will retry
  })

  return () => {
    source.removeEventListener("lab-order-update", handler)
    source.close()
  }
}
