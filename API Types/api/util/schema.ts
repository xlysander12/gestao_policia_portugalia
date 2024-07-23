import {RequestSuccess} from "../schema";

export interface PatentData {
    id: number,
    name: string,
    max_evaluation: number
}

export interface StatusData {
    id: number,
    name: string
}

export interface SpecialUnitData {
    id: number,
    name: string
    acronym: string,
    description: string | null
}

export interface SpecialUnitRoleData {
    id: number,
    name: string
}

export interface UtilPatentsResponse extends RequestSuccess {
    data: PatentData[]
}

export interface UtilStatusesResponse extends RequestSuccess {
    data: StatusData[]
}

export interface UtilSpecialUnitsResponse extends RequestSuccess {
    data: {
        units: SpecialUnitData[],
        roles: SpecialUnitRoleData[]
    }
}