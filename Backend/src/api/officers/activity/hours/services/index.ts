import {Filters} from "../../../../../utils/filters";
import {DefaultReturn} from "../../../../../types";
import {fetchHoursEntry, fetchHoursHistory, OfficerHoursEntryType} from "../repository";

export async function officerHoursHistory(force: string, officer: number, filters: Filters): Promise<DefaultReturn<OfficerHoursEntryType[]>> {
    // Get the hours of the Officer from the repository
    const hours = await fetchHoursHistory(force, officer, filters);

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