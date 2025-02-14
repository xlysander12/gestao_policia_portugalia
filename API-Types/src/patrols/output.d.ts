import {RequestSuccess, SocketResponse} from "../index";

export interface MinifiedPatrolData {
    id: string
    type: number
    unit: number | null
    officers: number[]
    start: string
    end: string | null
    canceled: boolean
}

export interface PatrolHistoryResponse extends RequestSuccess {
    meta: {
        pages: number
    }
    data: MinifiedPatrolData[]
}

export interface PatrolData extends MinifiedPatrolData {
    notes: string
}

export interface PatrolInfoResponse extends RequestSuccess {
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