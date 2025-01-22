import {RequestSuccess} from "../index";

export interface MinifiedPatrolData {
    id: string
    type: number
    unit: number | null
    start: Date
    end: Date | null
    canceled: boolean
}

export interface PatrolHistoryResponse extends RequestSuccess {
    data: MinifiedPatrolData[]
}