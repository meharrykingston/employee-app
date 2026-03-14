const API_BASE_URL = "/api";

type ApiEnvelope<T> = {
  status: "ok" | "error";
  data?: T;
  message?: string;
};

async function parseEnvelope<T>(response: Response): Promise<ApiEnvelope<T> | null> {
  const raw = await response.text();
  if (!raw.trim()) {
    return null;
  }

  try {
    return JSON.parse(raw) as ApiEnvelope<T>;
  } catch {
    return null;
  }
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
    ...init,
  });

  const payload = await parseEnvelope<T>(response);
  if (!response.ok) {
    throw new Error(payload?.message || response.statusText || `Request failed: ${response.status}`);
  }
  if (!payload || payload.status !== "ok" || typeof payload.data === "undefined") {
    throw new Error("Service temporarily unavailable. Please retry.");
  }

  return payload.data;
}

export async function apiGet<T>(path: string, _signal?: AbortSignal): Promise<T> {
  return request<T>(path, { method: "GET" });
}

export async function apiPost<T, B>(path: string, body: B): Promise<T> {
  return request<T>(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function apiPut<T, B>(path: string, body: B): Promise<T> {
  return request<T>(path, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}
