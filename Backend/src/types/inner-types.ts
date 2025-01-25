import {OfficerData} from "@portalseguranca/api-types/officers/output";

export interface InnerOfficerData extends Omit<OfficerData, "entry_date" | "promotion_date"> {
    entry_date: Date,
    promotion_date: Date | null
    isFormer: boolean
}

export interface InnerAccountData {
    nif: number,
    password: string,
    suspended: boolean,
    last_interaction: Date,
    intents: {
        [key: string]: boolean
    }
}

export interface InnerOfficerJustificationData {
    id: number,
    officer: number,
    type: number,
    start: Date,
    end: Date | null,
    description: string,
    status: "pending" | "approved" | "denied",
    managed_by: number | null
    timestamp: Date
}