export type MedicineItem = {
  id: string
  name: string
  dose: string
  kind: string
  inStock: boolean
  image: string
  price?: number
  overview: string
  uses: string[]
  doseGuide: string[]
  cautions: string[]
}

type PharmacyProduct = {
  id: string
  sku?: string | null
  name: string
  category?: string | null
  description?: string | null
  base_price_inr: number
  image_urls_json?: string[]
  available_qty?: number | null
  in_stock?: boolean
}

const fallbackImages = [
  "https://images.unsplash.com/photo-1585435557343-3b092031a831?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1626285861696-9f0bf5a49c6b?auto=format&fit=crop&w=900&q=80",
]

function extractDose(text?: string | null) {
  if (!text) return "Standard"
  const match = text.match(/(\d+\s?(mg|ml|g|mcg|iu|IU))/)
  if (match?.[0]) return match[0].replace("IU", "IU")
  return "Standard"
}

function buildFallbackUses(name: string) {
  return [
    `${name} daily support`,
    "Doctor-guided usage",
    "Symptom relief as advised",
  ]
}

export function mapProductToMedicine(product: PharmacyProduct, index = 0): MedicineItem {
  const image = product.image_urls_json?.[0] ?? fallbackImages[index % fallbackImages.length]
  const overview = product.description ?? `${product.name} is curated for daily health support.`
  const inStock = typeof product.in_stock === "boolean" ? product.in_stock : true

  return {
    id: product.id,
    name: product.name,
    dose: extractDose(product.description ?? product.name),
    kind: product.category ?? "Tablet",
    inStock,
    image,
    price: Number(product.base_price_inr ?? 0),
    overview,
    uses: buildFallbackUses(product.name),
    doseGuide: [
      "Follow the label directions or physician guidance.",
      "Take with water after meals unless advised otherwise.",
      "Do not exceed the recommended dosage.",
    ],
    cautions: [
      "Consult your doctor if you are pregnant or on other medication.",
      "Stop use and seek care if you notice unusual reactions.",
    ],
  }
}

export const medicines: MedicineItem[] = [
  {
    id: "paracetamol",
    name: "Paracetamol",
    dose: "500mg",
    kind: "Tablet",
    inStock: true,
    image: "https://images.unsplash.com/photo-1585435557343-3b092031a831?auto=format&fit=crop&w=900&q=80",
    overview: "Paracetamol is commonly used to reduce fever and relieve mild to moderate pain.",
    uses: ["Fever management", "Headache and body pain", "Post-viral discomfort"],
    doseGuide: [
      "Adults usually take 500mg to 650mg as advised by doctor.",
      "Keep a safe gap between doses.",
      "Do not exceed maximum daily dose without medical guidance.",
    ],
    cautions: ["Use carefully with liver conditions", "Avoid combining multiple paracetamol products"],
  },
  {
    id: "ibuprofen",
    name: "Ibuprofen",
    dose: "400mg",
    kind: "Tablet",
    inStock: true,
    image: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=900&q=80",
    overview: "Ibuprofen is an anti-inflammatory medicine often used for pain, swelling, and fever.",
    uses: ["Muscle and joint pain", "Dental pain", "Inflammatory pain"],
    doseGuide: [
      "Take with food or after meals to reduce stomach irritation.",
      "Use only for short-term symptom relief unless advised by doctor.",
      "Follow doctor recommendation for dose frequency.",
    ],
    cautions: ["Avoid in active stomach ulcer", "Use with caution in kidney conditions"],
  },
  {
    id: "amoxicillin",
    name: "Amoxicillin",
    dose: "250mg",
    kind: "Capsule",
    inStock: true,
    image: "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?auto=format&fit=crop&w=900&q=80",
    overview: "Amoxicillin is an antibiotic used for certain bacterial infections.",
    uses: ["Respiratory bacterial infections", "Ear and throat infections", "Skin infections"],
    doseGuide: [
      "Always complete the full prescribed course.",
      "Take doses at evenly spaced intervals.",
      "Use only when prescribed by doctor.",
    ],
    cautions: ["Not effective for viral flu/common cold", "Avoid if allergic to penicillin group"],
  },
  {
    id: "vitamin-d3",
    name: "Vitamin D3",
    dose: "60000 IU",
    kind: "Capsule",
    inStock: true,
    image: "https://images.unsplash.com/photo-1626285861696-9f0bf5a49c6b?auto=format&fit=crop&w=900&q=80",
    overview: "Vitamin D3 supports bone health, immunity, and calcium regulation.",
    uses: ["Vitamin D deficiency", "Bone health support", "Low sunlight exposure support"],
    doseGuide: [
      "Usually taken weekly or as prescribed.",
      "Take after food for better absorption.",
      "Long-term dose should be medically monitored.",
    ],
    cautions: ["Avoid excessive self-dosing", "Monitor in kidney or calcium disorders"],
  },
  {
    id: "cetirizine",
    name: "Cetirizine",
    dose: "10mg",
    kind: "Tablet",
    inStock: true,
    image: "https://images.unsplash.com/photo-1550572017-edd951b55104?auto=format&fit=crop&w=900&q=80",
    overview: "Cetirizine is an antihistamine used for allergy symptoms.",
    uses: ["Sneezing and runny nose", "Allergic itching", "Seasonal allergies"],
    doseGuide: [
      "Generally taken once daily or as advised.",
      "Prefer evening dose if drowsiness occurs.",
      "Do not mix with sedative medicines without medical advice.",
    ],
    cautions: ["May cause mild drowsiness in some users", "Adjust guidance in severe kidney disease"],
  },
  {
    id: "metformin",
    name: "Metformin",
    dose: "500mg",
    kind: "Tablet",
    inStock: false,
    image: "https://images.unsplash.com/photo-1576602975754-22f003188452?auto=format&fit=crop&w=900&q=80",
    overview: "Metformin is used for blood glucose control in type 2 diabetes management.",
    uses: ["Type 2 diabetes support", "Insulin resistance management"],
    doseGuide: [
      "Usually taken with meals to reduce stomach upset.",
      "Dose is individualized based on response and tolerance.",
      "Do not stop abruptly without doctor advice.",
    ],
    cautions: ["Needs regular monitoring in long-term use", "Use carefully with kidney impairment"],
  },
]
