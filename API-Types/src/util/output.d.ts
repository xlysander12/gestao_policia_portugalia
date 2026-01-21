import {BaseResponse} from "../index";
import {MinifiedOfficerData} from "../officers/output";

export interface ForceColors {
    base: string
    text: string | null
}

export interface PatentData {
    id: number
    name: string
    category: number
    max_evaluation: number
    leading_char: string
}

export interface PatentCategoryData {
    id: number
    name: string
}

export interface StatusData {
    id: number
    name: string
    color: string
    canPatrol: boolean
}

export interface IntentData {
    name: string
    description: string
}

export interface SpecialUnitData {
    id: number
    name: string
    acronym: string
    description: string | null
}

export interface SpecialUnitRoleData {
    id: number
    name: string
}

export interface LastDatesField {
    id: string
    display: string
    max_days: number | null
}

export interface InactivityTypeData {
    id: number
    name: string
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
    type: "activity" | "event" | "password"
    timestamp: number
    url: string
}

export interface ActivityNotification extends BaseNotification {
    type: "activity"
    justificationType: number
    officer: number
}

export interface EventNotification extends BaseNotification {
    type: "event"
    title: string
}

export interface UtilColorsResponse extends BaseResponse {
    data: ForceColors
}

export interface UtilPatentsResponse extends BaseResponse {
    data: PatentData[]
}

export interface UtilPatentCategoriesResponse extends BaseResponse {
    data: PatentCategoryData[]
}

export interface UtilStatusesResponse extends BaseResponse {
    data: StatusData[]
}

export interface UtilIntentsResponse extends BaseResponse {
    data: IntentData[]
}

export interface UtilSpecialUnitsResponse extends BaseResponse {
    data: {
        units: SpecialUnitData[]
        roles: SpecialUnitRoleData[]
    }
}

export interface UtilSpecialUnitsActiveResponse extends BaseResponse {
    data: MinifiedOfficerData[]
}

export interface UtilLastDatesFieldsResponse extends BaseResponse {
    data: LastDatesField[]
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
    intent: string | null
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

export interface ForceTopHoursInWeekResponse extends BaseResponse {
    data: {
        rank: number
        nif: number
        minutes: number
    }[]
}