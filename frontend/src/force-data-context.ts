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

export function getPatentFromId(patentId: number, forcePatents: Patent[]) {
    return forcePatents?.find(patent => patent.id === patentId);
}

export function getStatusFromId(statusId: number, forceStatuses: Status[]) {
    return forceStatuses?.find(status => status.id === statusId);
}

export function getSpecialUnitFromId(specialUnitId: number, forceSpecialUnits: SpecialUnit[]) {
    return forceSpecialUnits?.find(specialUnit => specialUnit.id === specialUnitId);
}

export function getSpecialUnitRoleFromId(specialUnitRoleId: number, forceSpecialUnitRoles: SpecialUnitRole[]) {
    return forceSpecialUnitRoles?.find(specialUnitRole => specialUnitRole.id === specialUnitRoleId);
}