import {createContext} from "react";
import {
    InactivityTypeData,
    IntentData,
    PatentData,
    SpecialUnitData, SpecialUnitRoleData,
    StatusData
} from "@portalseguranca/api-types/util/output";

export type ForceDataContextType = {
    patents: PatentData[],
    statuses: StatusData[],
    intents: IntentData[],
    inactivity_types: InactivityTypeData[],
    special_units: SpecialUnitData[],
    special_unit_roles: SpecialUnitRoleData[]
}
export const ForceDataContext = createContext<ForceDataContextType>({patents: [], statuses: [], intents: [], inactivity_types: [], special_units: [], special_unit_roles: []});

type HasId = {
    id: number
}
export function getObjectFromId<T extends HasId>(id: number, array: T[]): T | null {
    for (const object of array) {
        if (object.id === id) {
            return object;
        }
    }

    return null;
}