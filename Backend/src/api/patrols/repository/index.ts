import {RouteFilterType} from "../../routes";
import buildFiltersQuery, {ReceivedQueryParams} from "../../../utils/filters";
import {queryDB} from "../../../utils/db-connector";
import {MinifiedPatrolData} from "@portalseguranca/api-types/patrols/output";
import {dateToString} from "../../../utils/date-handler";
import {InnerPatrolData} from "../../../types/inner-types";

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
            start: dateToString(patrol.start),
            end: dateToString(patrol.end) || null,
            canceled: patrol.canceled === 1
        });
    }

    // Return the result
    return patrols;
}

export async function getPatrol(force: string, id: string): Promise<InnerPatrolData | null> {
    // Get the patrol from the database
    const result = await queryDB(force, `SELECT * FROM patrolsV WHERE id = ?`, [id]);

    if (result.length === 0) {
        return null;
    }

    // Build the result from the database
    const patrol = result[0];
    return {
        id: patrol.id,
        type: patrol.type,
        unit: patrol.unit,
        start: patrol.start,
        end: patrol.end,
        canceled: patrol.canceled === 1,
        notes: patrol.notes
    };
}