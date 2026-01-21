import {createContext} from "react";
import {
    EvaluationDecision,
    EvaluationField,
    EvaluationGrade, EventType, ForceColors,
    InactivityTypeData,
    IntentData, LastDatesField, PatentCategoryData,
    PatentData, PatrolTypeData,
    SpecialUnitData, SpecialUnitRoleData,
    StatusData
} from "@portalseguranca/api-types/util/output";
import {Moment} from "moment";

export type ForceData = {
    last_ceremony: Moment
    colors: ForceColors
    patents: PatentData[]
    patentCategories: PatentCategoryData[]
    statuses: StatusData[]
    intents: IntentData[]
    last_dates_fields: LastDatesField[]
    inactivity_types: InactivityTypeData[]
    patrol_types: PatrolTypeData[]
    evaluation_grades: EvaluationGrade[]
    evaluation_fields: EvaluationField[]
    evaluation_decisions: EvaluationDecision[]
    event_types: EventType[]
    special_units: SpecialUnitData[]
    special_unit_roles: SpecialUnitRoleData[]
}

export type ForcesDataContext = {
    [force: string]: ForceData
}
export const ForcesDataContext = createContext<ForcesDataContext>({});

export function getObjectFromId<T extends {id: number | string}>(id: number | string, array: T[]): T | null {
    for (const object of array) {
        if (object.id === id) {
            return object;
        }
    }

    return null;
}