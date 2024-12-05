import {DefaultReturn} from "../../../types";
import {getForcePatents} from "../repository";
import {PatentData} from "@portalseguranca/api-types/util/schema";

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