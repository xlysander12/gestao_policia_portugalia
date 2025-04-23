import {RouteFilterType} from "../../routes";
import buildFiltersQuery, {ReceivedQueryParams} from "../../../utils/filters";
import {queryDB} from "../../../utils/db-connector";
import {MinifiedPatrolData} from "@portalseguranca/api-types/patrols/output";
import {dateToUnix} from "../../../utils/date-handler";
import {InnerPatrolData} from "../../../types/inner-types";
import { EditPatrolBody } from "@portalseguranca/api-types/patrols/input";
import {RowDataPacket} from "mysql2/promise";

function splitPatrolId(id: string): [string, number] {
    const idMatch = /([a-z]+)(\d+)$/.exec(id);

    return [idMatch![1], parseInt(idMatch![2])];
}

export async function listPatrols(force: string, routeFilters: RouteFilterType, filters: ReceivedQueryParams, page = 1, entriesPerPage = 10): Promise<{
    patrols: MinifiedPatrolData[],
    pages: number
}> {
    // Build the filters from the route
    const filtersResult = buildFiltersQuery(routeFilters, filters);

    // Get the patrols from the database
    const result = await queryDB(force, `SELECT * FROM patrolsV ${filtersResult.query} LIMIT ${entriesPerPage} OFFSET ${(page - 1) * entriesPerPage}`, filtersResult.values);

    // Build the result from the database
    const patrols: MinifiedPatrolData[] = [];
    for (const patrol of result) {
        patrols.push({
            id: patrol.id as string,
            type: patrol.type as number,
            unit: patrol.special_unit as number | null,
            officers: JSON.parse(patrol.officers as string) as number[],
            start: dateToUnix(patrol.start as Date),
            end: patrol.end !== null ? dateToUnix(patrol.end as Date) : null,
            canceled: patrol.canceled === 1
        });
    }

    // Get the number of total pages regarding the entries per page
    const totalEntries = await queryDB(force, `SELECT COUNT(*) FROM patrolsV ${filtersResult.query}`, filtersResult.values);

    // Return the result
    return {
        patrols: patrols,
        pages: Math.ceil(totalEntries[0]["COUNT(*)"] / entriesPerPage)
    };
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
        id: splitPatrolId(patrol.id as string)[1],
        type: patrol.type as number,
        unit: patrol.special_unit as number | null,
        officers: JSON.parse(patrol.officers as string) as number[],
        start: patrol.start as Date,
        end: patrol.end as Date | null,
        canceled: patrol.canceled === 1,
        notes: patrol.notes as string | null,
        force: splitPatrolId(patrol.id as string)[0]
    };
}

export async function isOfficerInPatrol(force: string, officerNif: number, start?: Date, end?: Date | null, patrolId?: string): Promise<boolean> {
    if ((start && end === undefined) || (start === undefined && end)) {
        throw new Error("Both start and end must be provided");
    }

    let result: RowDataPacket[];

    // Alter the query depending if the start and end are provided
    if (!start && !end) {
        result = await queryDB(force, `SELECT *
                                         FROM patrolsV
                                         WHERE officers LIKE ?
                                           AND end IS NULL`, [`%${officerNif}%`]);
    } else {
        if (end === null) {
            result = await queryDB(force, `SELECT *
                                           FROM patrolsV
                                           WHERE officers LIKE ?
                                             AND ((? BETWEEN patrolsV.start AND patrolsV.end) OR
                                                  patrolsV.end IS NULL)`, [`%${officerNif}%`, start]);
        } else {
            result = await queryDB(force, `SELECT *
                                         FROM patrolsV
                                         WHERE officers LIKE ?
                                           AND start <= ?
                                           AND end >= ?`, [`%${officerNif}%`, end, start]);
        }
    }

    // If no patrols were found, the officer is not in a patrol
    if (result.length === 0) {
        return false;
    }

    // If the length is 1, check if the patrol is the same as the one being edited
    if (result.length === 1 && patrolId) {
        return !(result[0].id === patrolId);
    }


    // Since the officer is in a patrol, return true
    return true;

}

export async function getOfficerPatrol(force: string, officerNif: number): Promise<InnerPatrolData | null> {
    const result = await queryDB(force, `SELECT id
                                         FROM patrolsV
                                         WHERE officers LIKE ?
                                           AND end IS NULL`, [`%${officerNif}%`]);

    if (result.length === 0) {
        return null;
    }
    
    return await getPatrol(force, result[0].id as string);
}

export async function createPatrol(force: string, type: number, specialUnit: number | null, officers: number[], start: Date, end: Date | null, notes: string | null): Promise<void> {
    // Insert the patrol into the database
    await queryDB(force, `INSERT INTO patrols (type, special_unit, officers, start, end, notes) VALUES (?, ?, ?, ?, ?, ?)`, [type, specialUnit, JSON.stringify(officers), start, end, notes]);
}

export async function editPatrol(force: string, id: number, changes: EditPatrolBody, canceled?: boolean) {
    // Build the query string and params depending on the fields that were provided
    const params: string[] = [];
    const updateQuery = `UPDATE patrols SET ${Object.keys(changes).reduce((acc, field) => {
        if (field === "start" || field === "end") {
            acc += `${field} = FROM_UNIXTIME(?), `;
        } else {
            acc += `${field} = ?, `;
        }
        
        if (field === "officers") {
            params.push(JSON.stringify(changes[field as keyof EditPatrolBody]));
        } else {
            params.push(changes[field as keyof EditPatrolBody] as string);
        }
        return acc;
    }, "").slice(0, -2)} WHERE id = ?`;

    await queryDB(force, updateQuery, [...params, id]);

    if (canceled) {
        await queryDB(force, `UPDATE patrols SET canceled = 1 WHERE id = ?`, [id]);
    }
}

export async function deletePatrol(force: string, id: number) {
    await queryDB(force, `DELETE FROM patrols WHERE id = ?`, [id]);
}