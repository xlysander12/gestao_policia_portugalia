import {RequestSuccess} from "../../index";

export interface OfficerLastShiftResponse extends RequestSuccess {
    data: {
        last_shift: string
    }
}

interface OfficerSpecificHoursType {
    id: number,
    week_start: string,
    week_end: string,
    minutes: number,
    submitted_by: number
}

export interface OfficerSpecificHoursResponse extends RequestSuccess {
    meta: {
        min_hours: boolean
    }
    data: OfficerSpecificHoursType
}

export interface OfficerHoursResponse extends RequestSuccess {
    data: OfficerSpecificHoursType[]
}

export type OfficerMinifiedJustification = {
    id: number,
    type: number,
    start: string,
    end: string | null,
    status: "pending" | "approved" | "denied",
    managed_by: number | null,
    timestamp: number
}
export interface OfficerJustificationsHistoryResponse extends RequestSuccess {
    data: OfficerMinifiedJustification[]
}

export type OfficerActiveJustification = {
    id: number,
    type: number
}
export interface OfficerActiveJustificationsResponse extends RequestSuccess {
    data: OfficerActiveJustification[]
}

export type OfficerJustification = OfficerMinifiedJustification & {
    description: string
}
export interface OfficerJustificationDetailsResponse extends RequestSuccess {
    data: OfficerJustification
}