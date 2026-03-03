const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") ?? "/api";

type ApiEnvelope<T> = {
  status: "ok" | "error";
  data?: T;
  message?: string;
};

export async function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    signal,
  });

  const payload = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok || payload.status !== "ok" || typeof payload.data === "undefined") {
    throw new Error(payload.message || `Request failed: ${response.status}`);
  }

  return payload.data;
}

export async function apiPost<T, B>(path: string, body: B): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const payload = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok || payload.status !== "ok" || typeof payload.data === "undefined") {
    throw new Error(payload.message || `Request failed: ${response.status}`);
  }

  return payload.data;
}
