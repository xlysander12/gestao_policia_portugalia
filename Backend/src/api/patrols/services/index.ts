import {DefaultReturn} from "../../../types";
import {MinifiedPatrolData} from "@portalseguranca/api-types/patrols/output";
import {RouteFilterType} from "../../routes";
import {ReceivedQueryParams} from "../../../utils/filters";
import {listPatrols} from "../repository";

export async function patrolsHistory(force: string, validFilters: RouteFilterType, receivedFilters: ReceivedQueryParams, page: number = 1, entriesPerPage: number = 10): Promise<DefaultReturn<MinifiedPatrolData[]>> {
    // Fetch the patrols from the repository
    const result = await listPatrols(force, validFilters, receivedFilters, page, entriesPerPage);

    // Return the list
    return {
        result: true,
        status: 200,
        message: "Operação efetuada com sucesso",
        data: result
    }
}