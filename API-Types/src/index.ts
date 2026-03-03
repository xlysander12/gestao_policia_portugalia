export interface BaseResponse {
    message: string
}

export interface CreationResponse extends BaseResponse {
    id: number | null
}

export interface RequestError extends BaseResponse{
    code?: string
    details?: string
}

export interface SocketResponse {
    action: "add" | "delete" | "update" | "restore" | "manage"
    by: number
}

export enum MODULE {
    ACCOUNTS = "accounts",
    OFFICERS = "officers",
    ACTIVITY = "activity",
    PATROLS = "patrols",
    EVALUATIONS = "evaluations",
    CEREMONY_DECISIONS = "ceremony_decisions",
    EVENTS = "events",
    ANNOUNCEMENTS = "announcements"
}