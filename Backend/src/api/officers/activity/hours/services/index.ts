import {DefaultReturn, InnerOfficerData} from "../../../../../types";
import {
    deleteHoursEntry, ensureNoHoursThisWeek,
    fetchHoursEntry,
    fetchHoursHistory, fetchLastHoursEntry,
    insertHoursEntry,
    OfficerHoursEntryType
} from "../repository";
import {RouteFilterType} from "../../../../routes";

export async function officerHoursHistory(force: string, nif: number, routeValidFilters: RouteFilterType, filters: {name: string, value: any}[]): Promise<DefaultReturn<OfficerHoursEntryType[]>> {
    // Get the hours of the Officer from the repository
    const hours = await fetchHoursHistory(force, nif, routeValidFilters, filters);

    return {
        result: true,
        status: 200,
        message: "Operação bem sucedida",
        data: hours
    }
}

export async function officerHoursEntry(force: string, nif: number, id: number): Promise<DefaultReturn<OfficerHoursEntryType>> {
    // Get the information about this specific hours entry from the repository
    const result = await fetchHoursEntry(force, nif, id);

    // If not results are found, either the entry doesn't exist, or it's not from the requested officer
    if (result === null) {
        return {result: false, status: 404, message: "Não foi encontrado o registo de horas pretendido"};
    }

    // Return the object
    return {
        result: true,
        status: 200,
        message: "Operação bem sucedida",
        data: result
    }
}

export async function lastOfficerHours(force: string, nif: number): Promise<DefaultReturn<OfficerHoursEntryType>> {
    // Get the information about the last hours entry from the repository
    const result = await fetchLastHoursEntry(force, nif);

    // If no results are found, this officer doesn't have any entries
    if (result === null) {
        return {result: false, status: 404, message: "Não foram encontrados registos de horas"};
    }

    // Return the object
    return {
        result: true,
        status: 200,
        message: "Operação bem sucedida",
        data: result
    }
}

export async function addOfficerHoursEntry(force: string, nif: number, week_start: Date, week_end: Date, minutes: number, submitted_by: InnerOfficerData): Promise<DefaultReturn<void>> {
    // Make sure there already aren't hours for this week and officer
    const isWeekUnique = await ensureNoHoursThisWeek(force, nif, week_start);
    if (!isWeekUnique) {
        return {result: false, status: 400, message: "Este efetivo já tem as horas registadas para esta semana registadas"};
    }

    // If there aren't, insert the new hours
    await insertHoursEntry(force, nif, week_start, week_end, minutes, submitted_by.nif);

    return {result: true, status: 200, message: "Operação bem sucedida"}
}

export async function deleteOfficerHoursEntry(force: string, nif: number, id: number): Promise<DefaultReturn<void>> {
    // Make sure the hours entry exists
    const hours = await fetchHoursEntry(force, nif, id);
    if (hours === null) {
        return {
            result: false,
            status: 404,
            message: "Não foi encontrado o registo de horas pretendido"
        }
    }

    // If it does, delete it
    await deleteHoursEntry(force, nif, id);

    return {result: true, status: 200, message: "Operação bem sucedida"};
}