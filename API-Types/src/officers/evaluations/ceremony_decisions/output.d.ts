export interface MinifiedDecision {
    id: number
    target: number
    category: number
    ceremony: number
    decision: number | null
}

export interface CeremonyDecision extends MinifiedDecision {
    details: string
}

export interface CeremonyDecisionsListResponse {
    meta: {
        pages: number
    }
    data: MinifiedDecision[]
}

export interface  CeremonyDecisionInfoResponse {
    data: CeremonyDecision
}