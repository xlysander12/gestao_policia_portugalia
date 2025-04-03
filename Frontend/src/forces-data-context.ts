import {createContext} from "react";
import {
    EvaluationField,
    EvaluationGrade,
    InactivityTypeData,
    IntentData,
    PatentData, PatrolTypeData,
    SpecialUnitData, SpecialUnitRoleData,
    StatusData
} from "@portalseguranca/api-types/util/output";

export type ForceData = {
    patents: PatentData[]
    statuses: StatusData[]
    intents: IntentData[]
    inactivity_types: InactivityTypeData[]
    patrol_types: PatrolTypeData[]
    evaluation_grades: EvaluationGrade[]
    evaluation_fields: EvaluationField[]
    special_units: SpecialUnitData[]
    special_unit_roles: SpecialUnitRoleData[]
}

export type ForcesDataContext = {
    [force: string]: ForceData
}
export const ForcesDataContext = createContext<ForcesDataContext>({});

export function getObjectFromId<T extends {id: number}>(id: number, array: T[]): T | null {
    for (const object of array) {
        if (object.id === id) {
            return object;
        }
    }

    return null;
}