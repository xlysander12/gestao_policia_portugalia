import {BaseResponse, SocketResponse} from "../index";
export interface MinifiedOfficerData {
    name: string
    patent: number
    callsign: string
    status: number
    nif: number
    force?: string
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
    special_units: OfficerUnit[],
    fire_reason?: string
}

export interface OfficerListResponse extends BaseResponse {
    data: MinifiedOfficerData[]
}

export interface OfficerInfoGetResponse extends BaseResponse {
    meta: {
        former: boolean
        force: string
    }
    data: OfficerData | MinifiedOfficerData
}

export interface OfficerImportReturn {
    import_errors: number[],
    non_present: number[]
}

export interface OfficerImportResponse extends BaseResponse {
    data: OfficerImportReturn
}

export interface OfficerSocket extends SocketResponse {
    nif: number
}

export interface OfficerAddSocket extends OfficerSocket {
    action: "add"
}

export interface OfficerUpdateSocket extends OfficerSocket {
    action: "update"
}

export interface OfficerRestoreSocket extends OfficerSocket {
    action: "restore"
}

export interface OfficerDeleteSocket extends OfficerSocket {
    action: "delete"
}

export interface OfficerImportSocket extends OfficerSocket {
    action: "update"
}