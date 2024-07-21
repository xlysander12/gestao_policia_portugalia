import {createContext} from "react";

export type ForcePatentsContextType = [{id: number, name: string, max_evaluation: number}] | null;
export const ForcePatentsContext = createContext<ForcePatentsContextType>(null);

export function getPatentFromId(patentId: number, forcePatents: ForcePatentsContextType) {
    return forcePatents?.find(patent => patent.id === patentId);
}