// ------------- Config -------------------------
const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL

const API_TIMEOUT_MS = 10_000

// ------------- Types -----------------------------
export interface PoseResponse {
    id: string
    name: string
    category: string
    description: string
    color: string
    lineWidth: number
    opacity: number
    thumbnailUrl: string | null
}

export interface PoseCategoryResponse {
    id: string
    label: string
    color: string
}

export interface PoseListResponse {
    poses: PoseResponse[]
    categories: PoseCategoryResponse[]
}

// ------------- Fecth helper timeout ----------------------
async function fetchWithTimeout (
    url: string,
    options?: RequestInit
): Promise<Response> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS)

    try {
        const res = await fetch(url, { ...options, signal: controller.signal})
        return res
    } finally {
        clearTimeout(timer)
    }
}

// ------------- API calls -------------------------------
// GET /api/poses
export async function fetchPoses(): Promise<PoseListResponse> {
    const res = await fetchWithTimeout(`${BASE_URL}/api/poses`)
    if (!res.ok)
        throw new Error(`API error ${res.status}: ${res.statusText}`)
    
    const responseData = await res.json()
    const data: PoseListResponse = responseData.data ? responseData.data : responseData

    return data
}

// GET /api/poses/{id}
export async function fetchPoseById(id: string): Promise<PoseResponse> {
    const res = await fetchWithTimeout(`${BASE_URL}/api/poses/${encodeURIComponent(id)}`)
    if (res.status === 404)
        throw new Error(`No pose found: ${id}`)

    if (!res.ok)
        throw new Error(`API errpr ${res.status}: ${res.statusText}`)

    const responseJson = await res.json()
    const data: PoseResponse = responseJson.data ? responseJson.data : responseJson

    return data
}

// GET /api/poses/category/{category}
export async function fetchPosesByCategory(category: string): Promise<PoseResponse[]> {
    const res = await fetchWithTimeout(`${BASE_URL}/api/poses/category/${encodeURIComponent(category)}`)
    if (!res.ok)
        throw new Error(`API error ${res.status}: ${res.statusText}`)

    const responseJson = await res.json()
    const data: PoseResponse[] = responseJson.data ? responseJson.data : responseJson

    return data
}