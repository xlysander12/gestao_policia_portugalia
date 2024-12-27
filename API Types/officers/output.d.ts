import {RequestSuccess} from "../index";
export interface MinifiedOfficerData {
    name: string,
    patent: string,
    callsign: string,
    status: string,
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
    discord: string,
    steam: string,
    entry_date: string,
    promotion_date: string | null,
    special_units: OfficerUnit[]
}

export interface OfficerDataRaw extends Omit<OfficerData, "patent" | "status"> {
    patent: number,
    status: number
}

export interface OfficerListResponse extends RequestSuccess {
    data: MinifiedOfficerData[]
}

export interface OfficerInfoGetResponse extends RequestSuccess {
    data: OfficerData | OfficerDataRaw
}