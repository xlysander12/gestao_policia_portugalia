import {RequestSuccess} from "../index";

export interface PatentData {
    id: number,
    name: string,
    max_evaluation: number
}

export interface StatusData {
    id: number,
    name: string
}

export interface IntentData {
    name: string,
    description: string
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

export interface UtilIntentsResponse extends RequestSuccess {
    data: IntentData[]
}

export interface UtilSpecialUnitsResponse extends RequestSuccess {
    data: {
        units: SpecialUnitData[],
        roles: SpecialUnitRoleData[]
    }
}