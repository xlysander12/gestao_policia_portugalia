import {RequestSuccess, SocketResponse} from "../../index";

export interface OfficerLastShiftResponse extends RequestSuccess {
    meta: {
        passed_max_days: boolean
    }
    data: {
        last_shift: string
    }
}

export interface OfficerLastShiftSocket extends SocketResponse {
    type: "last_shift"
    nif: number
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

export interface OfficerAddHoursSocket extends SocketResponse {
    type: "add_hours"
    nif: number
}

export interface OfficerDeleteHoursSocket extends SocketResponse {
    type: "delete_hours"
    nif: number
    id: number
}

export interface OfficerAddJustificationSocket extends SocketResponse {
    type: "add_justification"
    nif: number
}

export interface OfficerManageJustificationSocket extends SocketResponse {
    type: "manage_justification"
    nif: number
    id: number
}

export interface OfficerUpdateJustificationSocket extends SocketResponse {
    type: "update_justification",
    nif: number,
    id: number
}

export interface OfficerDeleteJustificationSocket extends SocketResponse {
    type: "delete_justification",
    nif: number,
    id: number
}