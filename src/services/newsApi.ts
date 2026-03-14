export type DailyTipPayload = {
  id: string
  title: string
  summary: string
  tags: string[]
  moodTags: string[]
  heroImage: string
  iconKey?: string
  sections: Array<{
    heading: string
    body: string
    coach: string
    question: { id: string; text: string; options: string[] }
  }>
}

export type DailyTipsResponse = {
  city: string
  topic: string
  tips: DailyTipPayload[]
}

export async function fetchDailyTips(input: { lat?: number; lon?: number; city?: string }) {
  const params = new URLSearchParams()
  if (typeof input.lat === "number") params.set("lat", input.lat.toString())
  if (typeof input.lon === "number") params.set("lon", input.lon.toString())
  if (input.city) params.set("city", input.city)
  const res = await fetch(`/api/news/daily?${params.toString()}`)
  const data = await res.json()
  if (!res.ok || data.status !== "ok") {
    throw new Error(data.message || "Daily tips unavailable")
  }
  return data.data as DailyTipsResponse
}
