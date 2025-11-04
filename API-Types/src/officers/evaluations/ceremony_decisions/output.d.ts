export interface MinifiedDecision {
    id: number
    target: number
    category: number
    ceremony: number
    decision: number | null
}

export interface CeremonyDecisionsListResponse {
    data: MinifiedDecision[]
}