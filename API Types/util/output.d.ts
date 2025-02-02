import {RequestSuccess} from "../index";

export interface PatentData {
    id: number,
    name: string,
    max_evaluation: number,
    leading_char: string
}

export interface StatusData {
    id: number,
    name: string
    color: string
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

export interface InactivityTypeData {
    id: number,
    name: string,
    description: string
    color: string
}

export interface PatrolTypeData {
    id: number
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

export interface UtilInactivityTypesResponse extends RequestSuccess {
    data: InactivityTypeData[]
}

export interface UtilPatrolTypesResponse extends RequestSuccess {
    data: PatrolTypeData[]
}