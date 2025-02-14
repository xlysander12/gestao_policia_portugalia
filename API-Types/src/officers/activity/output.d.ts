import {RequestSuccess, SocketResponse} from "../../index";

export interface OfficerLastShiftResponse extends RequestSuccess {
    meta: {
        passed_max_days: boolean
    }
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

export interface OfficerActivitySocket extends SocketResponse {
    type: "hours" | "justification" | "last_shift"
    nif: number
}

export interface OfficerLastShiftSocket extends OfficerActivitySocket {
    type: "last_shift"
    action: "update"
}

export interface OfficerAddHoursSocket extends OfficerActivitySocket {
    type: "hours"
    action: "add"
}

export interface OfficerDeleteHoursSocket extends OfficerActivitySocket {
    type: "hours"
    action: "delete"
    id: number
}

export interface OfficerAddJustificationSocket extends OfficerActivitySocket {
    type: "justification"
    action: "add"
    nif: number
}

export interface OfficerManageJustificationSocket extends OfficerActivitySocket {
    type: "justification"
    action: "manage"
    id: number
}

export interface OfficerUpdateJustificationSocket extends OfficerActivitySocket {
    type: "justification"
    action: "update"
    id: number
}

export interface OfficerDeleteJustificationSocket extends OfficerActivitySocket {
    type: "justification"
    action: "delete",
    id: number
}