import {BaseResponse, SocketResponse} from "../index";

export interface MinifiedPatrolData {
    id: string
    type: number
    unit: number | null
    officers: number[]
    start: number
    end: number | null
    canceled: boolean
}

export interface PatrolHistoryResponse extends BaseResponse {
    meta: {
        pages: number
    }
    data: MinifiedPatrolData[]
}

export interface PatrolData extends MinifiedPatrolData {
    registrar: number
    notes: string | null
}

export interface PatrolInfoResponse extends BaseResponse {
    meta: {
        editable: boolean
    }
    data: PatrolData
}

export interface ExistingPatrolSocket extends SocketResponse {
    id: number,
    force: string
}

export interface PatrolAddSocket extends SocketResponse {
    action: "add"
    force: string
}

export interface PatrolUpdateSocket extends ExistingPatrolSocket {
    action: "update",
}

export interface PatrolDeleteSocket extends ExistingPatrolSocket {
    action: "delete"
}