import {createContext} from "react";
import {IntentData} from "@portalseguranca/api-types/api/util/schema";

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

export type ForceDataContextType = {
    patents: Patent[],
    statuses: Status[],
    intents: IntentData[],
    special_units: SpecialUnit[],
    special_unit_roles: SpecialUnitRole[]
};
export const ForceDataContext = createContext<ForceDataContextType>({patents: [], statuses: [], intents: [], special_units: [], special_unit_roles: []});

export function getPatentFromId(patentId: number, forcePatents: Patent[]): Patent | null {
    for (const patent of forcePatents) {
        if (patent.id === patentId) {
            return patent;
        }
    }

    return null;
}

export function getStatusFromId(statusId: number, forceStatuses: Status[]): Status | null {
    for (const status of forceStatuses) {
        if (status.id === statusId) {
            return status;
        }
    }

    return null;
}

export function getSpecialUnitFromId(specialUnitId: number, forceSpecialUnits: SpecialUnit[]): SpecialUnit | null {
    for (const specialUnit of forceSpecialUnits) {
        if (specialUnit.id === specialUnitId) {
            return specialUnit;
        }
    }

    return null;
}

export function getSpecialUnitRoleFromId(specialUnitRoleId: number, forceSpecialUnitRoles: SpecialUnitRole[]): SpecialUnitRole | null {
    for (const specialUnitRole of forceSpecialUnitRoles) {
        if (specialUnitRole.id === specialUnitRoleId) {
            return specialUnitRole;
        }
    }

    return null;
}