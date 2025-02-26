import {BaseResponse} from "../index";

export interface PatentData {
    id: number,
    name: string,
    max_evaluation: number,
    leading_char: string
}

export interface StatusData {
    id: number
    name: string
    color: string
    canPatrol: boolean
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
    isSpecial: boolean
}

export interface UtilPatentsResponse extends BaseResponse {
    data: PatentData[]
}

export interface UtilStatusesResponse extends BaseResponse {
    data: StatusData[]
}

export interface UtilIntentsResponse extends BaseResponse {
    data: IntentData[]
}

export interface UtilSpecialUnitsResponse extends BaseResponse {
    data: {
        units: SpecialUnitData[],
        roles: SpecialUnitRoleData[]
    }
}

export interface UtilInactivityTypesResponse extends BaseResponse {
    data: InactivityTypeData[]
}

export interface UtilPatrolTypesResponse extends BaseResponse {
    data: PatrolTypeData[]
}

export interface UtilForcePatrolForcesResponse extends BaseResponse {
    data: string[]
}