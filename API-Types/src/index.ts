export interface RequestSuccess {
    message: string
}

export interface RequestError extends RequestSuccess{
    code?: string
    details?: string
}

export interface SocketResponse {
    action: "add" | "delete" | "update" | "restore" | "manage"
}