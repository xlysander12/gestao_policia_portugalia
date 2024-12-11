import {DefaultReturn} from "../../../types";
import {getForcePatents, getForceStatuses} from "../repository";
import {PatentData, StatusData} from "@portalseguranca/api-types/util/schema";

export async function forcePatents(force: string): Promise<DefaultReturn<PatentData[]>> {
    // Get the list from the repository
    const patents = await getForcePatents(force);

    // Return 200
    return {
        result: true,
        status: 200,
        data: patents
    }
}

export async function forceStatuses(force: string): Promise<DefaultReturn<StatusData[]>> {
    // Get the list from the repository
    const statuses = await getForceStatuses(force);

    // Return 200
    return {
        result: true,
        status: 200,
        data: statuses
    }
}