import {RequestSuccess} from "../index";

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
    data: PatrolData
}