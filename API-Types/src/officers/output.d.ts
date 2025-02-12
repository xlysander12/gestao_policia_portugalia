import {RequestSuccess, SocketResponse} from "../index";
export interface MinifiedOfficerData {
    name: string,
    patent: number,
    callsign: string,
    status: number,
    nif: number
}

export interface OfficerUnit {
    id: number,
    role: number
}

export interface OfficerData extends MinifiedOfficerData {
    phone: number,
    iban: string
    kms: number,
    discord: number,
    steam: string,
    entry_date: string,
    promotion_date: string | null,
    special_units: OfficerUnit[]
}

export interface OfficerListResponse extends RequestSuccess {
    data: MinifiedOfficerData[]
}

export interface OfficerInfoGetResponse extends RequestSuccess {
    meta: {
        former: boolean
        force: string
    }
    data: OfficerData | MinifiedOfficerData
}

export interface OfficerAddSocket extends SocketResponse {
    type: "addition"
    nif: number
}

export interface OfficerUpdateSocket extends SocketResponse {
    type: "update"
    nif: number
}

export interface OfficerRestoreSocket extends SocketResponse {
    type: "restore"
    nif: number
}

export interface OfficerDeleteSocket extends SocketResponse {
    type: "delete"
    nif: number
}