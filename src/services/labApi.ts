import { apiGet } from "./api";

export type LabCatalogTest = {
  id: string;
  code: string;
  name: string;
  reportingTime: string;
  price: number | null;
  category: string;
};

type LabCatalogResponse = {
  keyword: string;
  total: number;
  categories: Array<{ name: string; count: number }>;
  tests: LabCatalogTest[];
};

const catalogCache = new Map<string, LabCatalogResponse>();
const inFlightCatalog = new Map<string, Promise<LabCatalogResponse>>();
const warmupStarted = new Set<string>();

const getCatalogKey = (keyword: string, limit: number, offset: number) =>
  `${keyword}::${limit}::${offset}`;

export function getLabCatalog(
  keyword = "",
  limit = 10,
  offset = 0,
  signal?: AbortSignal
): Promise<LabCatalogResponse> {
  const params = new URLSearchParams();
  if (keyword) {
    params.set("keyword", keyword);
  }
  params.set("limit", String(limit));
  params.set("offset", String(offset));

  return apiGet<LabCatalogResponse>(`/lab/catalog?${params.toString()}`, signal);
}

export function getCachedLabCatalog(
  keyword = "",
  limit = 10,
  offset = 0
): LabCatalogResponse | null {
  return catalogCache.get(getCatalogKey(keyword, limit, offset)) ?? null;
}

export async function preloadLabCatalog(
  keyword = "",
  limit = 10,
  offset = 0
): Promise<LabCatalogResponse> {
  const key = getCatalogKey(keyword, limit, offset);
  const cached = catalogCache.get(key);
  if (cached) {
    return cached;
  }

  const existing = inFlightCatalog.get(key);
  if (existing) {
    return existing;
  }

  const promise = getLabCatalog(keyword, limit, offset)
    .then((data) => {
      catalogCache.set(key, data);
      return data;
    })
    .finally(() => {
      inFlightCatalog.delete(key);
    });

  inFlightCatalog.set(key, promise);
  return promise;
}

export async function warmLabCatalogSearchIndex(): Promise<void> {
  const warmupKey = "default";
  if (warmupStarted.has(warmupKey)) {
    return;
  }
  warmupStarted.add(warmupKey);

  const popularKeywords = [
    "",
    "cbc",
    "blood sugar",
    "hba1c",
    "thyroid",
    "tsh",
    "lipid profile",
    "liver function",
    "kidney function",
    "vitamin d",
    "vitamin b12",
    "crp",
    "esr",
    "widal",
    "typhoid",
    "fever profile",
    "urine routine",
    "creatinine",
    "ferritin",
    "cholesterol",
  ];

  await Promise.all(
    popularKeywords.map(async (keyword) => {
      try {
        await preloadLabCatalog(keyword, 50, 0);
      } catch {
        // Keep warmup best-effort.
      }
    })
  );
}
