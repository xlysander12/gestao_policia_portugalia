export interface MinifiedDecision {
    id: number
    target: number
    category: number
    ceremony_event: number
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

export interface CeremonyDecisionSocket {
    by: number
    target: number
}

export interface AddCeremonyDecisionSocket extends CeremonyDecisionSocket {
    action: "add"
}

export interface UpdateCeremonyDecisionSocket extends CeremonyDecisionSocket {
    action: "update"
    id: number
}

export interface DeleteCeremonyDecisionSocket extends CeremonyDecisionSocket {
    action: "delete"
    id: number
}