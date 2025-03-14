import {OfficerData} from "@portalseguranca/api-types/officers/output";
import {PatrolData} from "@portalseguranca/api-types/patrols/output";

export interface InnerOfficerData extends Omit<OfficerData, "entry_date" | "promotion_date" | "fire_reason"> {
    entry_date: Date,
    promotion_date: Date | null
    isFormer: boolean
    force: string
    fire_reason: string | null
}

export interface InnerAccountData {
    nif: number,
    password: string,
    suspended: boolean,
    last_interaction: Date | null,
    intents: {
        [key: string]: boolean
    }
}

export interface InnerOfficerJustificationData {
    id: number
    officer: number
    type: number
    start: Date
    end: Date | null
    description: string
    status: "pending" | "approved" | "denied"
    comment: string | null
    managed_by: number | null
    timestamp: Date
}

export interface InnerPatrolData extends Omit<PatrolData, "id" | "start" | "end"> {
    id: number
    start: Date
    end: Date | null
    force: string,
    editable?: boolean
}