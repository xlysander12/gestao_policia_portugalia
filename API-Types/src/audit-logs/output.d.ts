import {BaseResponse} from "../index";

export interface MinifiedAuditLogData {
    id: number
    nif: number
    timestamp: number
    module: string
    action: string
    type: string | null
    target: number | null
    status_code: number
}

export interface AuditLogHistoryResponse extends BaseResponse {
    meta: {
        pages: number
    }
    data: MinifiedAuditLogData[]
}