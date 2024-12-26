import {Filters} from "../../../../../utils/filters";
import {DefaultReturn, InnerOfficerData} from "../../../../../types";
import {fetchHoursEntry, fetchHoursHistory, insertHoursEntry, OfficerHoursEntryType} from "../repository";

export async function officerHoursHistory(force: string, filters: Filters): Promise<DefaultReturn<OfficerHoursEntryType[]>> {
    // Get the hours of the Officer from the repository
    const hours = await fetchHoursHistory(force, filters);

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

export async function addOfficerHoursEntry(force: string, nif: number, week_start: Date, week_end: Date, minutes: number, submitted_by: InnerOfficerData): Promise<DefaultReturn<null>> {
    // Make sure there already aren't hours for this week and officer
    const hours = await fetchHoursHistory(force, {query: "WHERE week_end > ? AND officer = ?", values: [week_start, nif]});
    if (hours.length > 0) {
        return {result: false, status: 400, message: "Este efetivo já tem as horas registadas para esta semana registadas"};
    }

    // If there aren't, insert the new hours
    await insertHoursEntry(force, nif, week_start, week_end, minutes, submitted_by.nif);

    return {result: true, status: 200, message: "Operação bem sucedida"}
}