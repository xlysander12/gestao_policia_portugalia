import {RouteFilterType} from "../../routes";
import buildFiltersQuery, {ReceivedQueryParams} from "../../../utils/filters";
import {queryDB} from "../../../utils/db-connector";
import {MinifiedPatrolData} from "@portalseguranca/api-types/patrols/output";

export async function listPatrols(force: string, routeFilters: RouteFilterType, filters: ReceivedQueryParams, page: number = 1, entriesPerPage: number = 10): Promise<MinifiedPatrolData[]> {
    // Build the filters from the route
    const filtersResult = buildFiltersQuery(routeFilters, filters);

    // Get the patrols from the database
    const result = await queryDB(force, `SELECT * FROM patrolsV ${filtersResult.query} LIMIT ${entriesPerPage} OFFSET ${(page - 1) * entriesPerPage}`, filtersResult.values);

    // Build the result from the database
    const patrols: MinifiedPatrolData[] = [];
    for (const patrol of result) {
        patrols.push({
            id: patrol.id,
            type: patrol.type,
            unit: patrol.unit,
            start: patrol.start,
            end: patrol.end,
            canceled: patrol.canceled === 1
        });
    }

    // Return the result
    return patrols;
}