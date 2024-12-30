import {createContext} from "react";
import {IntentData} from "@portalseguranca/api-types/util/output";

export type Patent = {
    id: number,
    name: string,
    max_evaluation: number
}

export type Status = {
    id: number,
    name: string
}

export type SpecialUnit = {
    id: number,
    name: string
}

export type SpecialUnitRole = {
    id: number,
    name: string
}

export type InactivityType = {
    id: number,
    name: string
}

export type ForceDataContextType = {
    patents: Patent[],
    statuses: Status[],
    intents: IntentData[],
    inactivity_types: InactivityType[],
    special_units: SpecialUnit[],
    special_unit_roles: SpecialUnitRole[]
};
export const ForceDataContext = createContext<ForceDataContextType>({patents: [], statuses: [], intents: [], inactivity_types: [], special_units: [], special_unit_roles: []});

export function getObjectFromId(id: number, array: any[]): any {
    for (const object of array) {
        if (object.id === id) {
            return object;
        }
    }

    return null;
}