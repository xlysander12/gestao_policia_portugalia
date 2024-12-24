import {Filters} from "../../../../../utils/filters";
import {DefaultReturn} from "../../../../../types";
import {fetchHoursHistory, OfficerHoursHistoryType} from "../repository";

export async function officerHoursHistory(force: string, officer: number, filters: Filters): Promise<DefaultReturn<OfficerHoursHistoryType[]>> {
    // Get the hours of the Officer from the repository
    const hours = await fetchHoursHistory(force, officer, filters);

    return {
        result: true,
        status: 200,
        message: "Operação bem sucedida",
        data: hours
    }
}