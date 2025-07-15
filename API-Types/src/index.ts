export interface BaseResponse {
    message: string
}

export interface RequestError extends BaseResponse{
    code?: string
    details?: string
}

export interface SocketResponse {
    action: "add" | "delete" | "update" | "restore" | "manage"
    by: number
}

export enum SOCKET_EVENT {
    ACCOUNTS = "accounts",
    OFFICERS = "officers",
    ACTIVITY = "activity",
    PATROLS = "patrols",
    EVALUATIONS = "evaluations",
    EVENTS = "events",
    ANNOUNCEMENTS = "announcements"
}