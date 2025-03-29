import {BaseResponse, SocketResponse} from "../../index";

export interface OfficerLastShiftResponse extends BaseResponse {
    meta: {
        passed_max_days: boolean
    }
    data: {
        last_shift: number
    }
}

interface OfficerSpecificHoursType {
    id: number,
    week_start: string,
    week_end: string,
    minutes: number,
    submitted_by: number
}

export interface OfficerSpecificHoursResponse extends BaseResponse {
    meta: {
        min_hours: boolean
    }
    data: OfficerSpecificHoursType
}

export interface OfficerHoursResponse extends BaseResponse {
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
export interface OfficerJustificationsHistoryResponse extends BaseResponse {
    data: OfficerMinifiedJustification[]
}

export type OfficerActiveJustification = {
    id: number,
    type: number
}
export interface OfficerActiveJustificationsResponse extends BaseResponse {
    data: OfficerActiveJustification[]
}

export type OfficerJustification = OfficerMinifiedJustification & {
    description: string
    comment?: string
}
export interface OfficerJustificationDetailsResponse extends BaseResponse {
    data: OfficerJustification
}

export interface OfficerActivitySocket extends SocketResponse {
    type: "hours" | "justification" | "last_shift"
    nif: number
    id?: number
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
}

export interface OfficerAddJustificationSocket extends OfficerActivitySocket {
    type: "justification"
    action: "add"
}

export interface OfficerManageJustificationSocket extends OfficerActivitySocket {
    type: "justification"
    action: "manage"
}

export interface OfficerUpdateJustificationSocket extends OfficerActivitySocket {
    type: "justification"
    action: "update"
}

export interface OfficerDeleteJustificationSocket extends OfficerActivitySocket {
    type: "justification"
    action: "delete"
}