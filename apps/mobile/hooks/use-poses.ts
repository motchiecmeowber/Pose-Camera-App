import { useState, useRef, useEffect, useCallback } from "react"
import {fetchPoses, fetchPosesByCategory, PoseCategoryResponse, PoseResponse} from "@/services/poseApi"

// ------------- Types -----------------------------------
export interface UsePosesResult {
    poses: PoseResponse[]
    categories: PoseCategoryResponse[]
    activeCategory: string | null
    setActiveCategory: (category: string | null) => void
    isLoading: boolean
    isRefreshing: boolean
    error: string | null
    refresh: () => Promise<void>
}

// ------------- In-memory cache -------------------------
interface CacheEntry {
    poses: PoseResponse[]
    categories: PoseCategoryResponse[]
    fetchedAt: number
}

const CACHE_TTL_MS = 5 * 60 * 1000
let _cache: CacheEntry | null = null

function isCacheValid(): boolean {
    if (!_cache) return false
    return Date.now() - _cache.fetchedAt < CACHE_TTL_MS
}

// ------------- Retry helper ------------------------------
async function fetchWithRetry(retries = 3, delayMs = 800): Promise<{
    poses: PoseResponse[],
    categories: PoseCategoryResponse[]
}> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= retries; attempt++) {
        try{
            const data = await fetchPoses()
            return data
        } catch (err) {
            lastError = err instanceof Error ? err : new Error(String(err))
            if (attempt < retries)
                await new Promise((r) => setTimeout(r, delayMs * attempt))
        }
    }

    throw lastError ?? new Error("Fetch failed after many attempts")
}

// ------------- Hook ----------------------------------
export function usePoses(): UsePosesResult {
    const [allPoses, setAllPoses] = useState<PoseResponse[]>(_cache?.poses ?? [])
    const [displayPoses, setDisplayPoses] = useState<PoseResponse[]>(_cache?.poses ?? [])
    const [categories, SetCategories] = useState<PoseCategoryResponse[]>(_cache?.categories ?? [])
    const [activeCategory, setActiveCategory] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(!isCacheValid())
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const isMounted = useRef(true)
    useEffect(() => {
        return () => {isMounted.current = false}
    }, [])

    // ------ core ------
    const load = useCallback(async (isRefresh = false) => {
        if (!isRefresh && isCacheValid() && _cache) {
            setAllPoses(_cache.poses)
            SetCategories(_cache.categories)
            if (!activeCategory) {
                setDisplayPoses([..._cache.poses].sort((a, b) => a.name.localeCompare(b.name)))
            }
            setIsLoading(false)
            return
        }

        try {
            isRefresh ? setIsRefreshing(true) : setIsLoading(true)
            setError(null)

            const {poses, categories: cats} = await fetchWithRetry()
            _cache = {poses, categories: cats, fetchedAt: Date.now()}

            if (isMounted.current) {
                setAllPoses(poses)
                SetCategories(cats)
                if (!activeCategory) {
                    setDisplayPoses([..._cache.poses].sort((a, b) => a.name.localeCompare(b.name)))
                }
            }
        } catch (err) {
            if (isMounted.current) {
                const msg = err instanceof Error ? err.message : "Unable to load pose list"
                setError(msg)
            }
        } finally {
            if (isMounted.current) {
                setIsLoading(false)
                setIsRefreshing(false)
            }
        }
    }, [activeCategory])

    useEffect(() => {
        if (activeCategory === null) {
            setDisplayPoses([...allPoses].sort((a, b) => a.name.localeCompare(b.name)))
            return
        }

        const fetchCategory = async () => {
            setIsLoading(true)
            try {
                const response = await fetchPosesByCategory(activeCategory)
                
                let catPoses: PoseResponse[] = []
                if (Array.isArray(response)) {
                    catPoses = response
                } else if (response && Array.isArray((response as any).poses)) {
                    catPoses = (response as any).poses
                } else if (response && Array.isArray((response as any).data)) {
                    catPoses = (response as any).data
                }

                if (isMounted.current) {
                    const sortedPoses = [...catPoses].sort((a, b) => a.name.localeCompare(b.name))
                    setDisplayPoses(sortedPoses)
                }
            } catch (err) {
                if (isMounted.current) {
                    console.error("Error fetch category:", err)
                    const fallbackPoses = allPoses.filter((p) => p.category === activeCategory)
                    setDisplayPoses([...fallbackPoses].sort((a, b) => a.name.localeCompare(b.name)))
                }
            } finally {
                if (isMounted.current) setIsLoading(false)
            }
        }

        fetchCategory()
    }, [activeCategory, allPoses])

    useEffect(() => { load(false) }, [load])
    const refresh = useCallback(() => load(true), [load])

    return {
        poses: displayPoses,
        categories,
        activeCategory,
        setActiveCategory,
        isLoading,
        isRefreshing,
        error,
        refresh
    }
}