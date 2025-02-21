export interface BaseResponse {
    message: string
}

export interface RequestError extends BaseResponse{
    code?: string
    details?: string
}

export interface SocketResponse {
    action: "add" | "delete" | "update" | "restore" | "manage"
}