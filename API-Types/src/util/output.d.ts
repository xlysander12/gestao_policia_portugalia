import {BaseResponse} from "../index";
import {MinifiedOfficerData} from "../officers/output";

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
    status: number | null
}

export interface PatrolTypeData {
    id: number
    name: string
    isSpecial: boolean
}

export interface BaseNotification {
    type: "activity"
    timestamp: number
    url: string
}

export interface ActivityNotification extends BaseNotification {
    type: "activity"
    justificationType: number
    officer: number
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

export interface UtilSpecialUnitsActiveResponse extends BaseResponse {
    data: MinifiedOfficerData[]
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

export interface EvaluationGrade {
    id: number
    name: string
    color: string
}

export interface UtilEvaluationGradesResponse extends BaseResponse {
    data: EvaluationGrade[]
}

export interface EvaluationField {
    id: number
    name: string
    starting_patent: number
}

export interface UtilEvaluationFieldsResponse extends BaseResponse {
    data: EvaluationField[]
}

export interface EvaluationDecision {
    id: number
    name: string
    color: string
}

export interface UtilEvaluationDecisionsResponse extends BaseResponse {
    data: EvaluationDecision[]
}

export interface EventType {
    id: number
    name: string
    variant: "custom" | "ceremony" | "special_unit"
}

export interface UtilEventTypesResponse extends BaseResponse {
    data: EventType[]
}

export interface UtilLastCeremonyResponse extends BaseResponse {
    data: number
}

export interface UtilNotificationsResponse extends BaseResponse {
    data: BaseNotification[]
}

export interface UserError {
    code: string
    timestamp: number
}

export interface UtilUserErrorsResponse extends BaseResponse {
    data: UserError[]
}