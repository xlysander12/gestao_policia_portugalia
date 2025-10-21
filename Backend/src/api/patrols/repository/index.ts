import {RouteFilterType} from "../../routes";
import buildFiltersQuery, {ReceivedQueryParams} from "../../../utils/filters";
import {queryDB} from "../../../utils/db-connector";
import {MinifiedPatrolData} from "@portalseguranca/api-types/patrols/output";
import {dateToUnix} from "../../../utils/date-handler";
import {InnerPatrolData, InnerPatrolTimelineEntry} from "../../../types/inner-types";
import { EditPatrolBody } from "@portalseguranca/api-types/patrols/input";
import {ResultSetHeader, RowDataPacket} from "mysql2/promise";

function splitPatrolId(id: string): [string, number] {
    const idMatch = /([a-z]+)(\d+)$/.exec(id);

    return [idMatch![1], parseInt(idMatch![2])];
}

export async function listPatrols(force: string, routeFilters: RouteFilterType, filters: ReceivedQueryParams, page = 1, entriesPerPage = 10): Promise<{
    patrols: MinifiedPatrolData[],
    pages: number
}> {
    // Build the filters from the route
    const filtersResult = buildFiltersQuery(force, routeFilters, filters);

    // Get the patrols from the database
    const result = await queryDB(force, `SELECT * FROM patrolsV ${filtersResult.query} LIMIT ${entriesPerPage} OFFSET ${(page - 1) * entriesPerPage}`, filtersResult.values);

    // Build the result from the database
    const patrols: MinifiedPatrolData[] = [];
    for (const patrol of result) {
        // For every patrol, get the officers present in it and remove duplicates
        const officersResult = await queryDB(force, `SELECT DISTINCT officer FROM patrolOfficersV WHERE patrol = ?`, [patrol.id]);

        patrols.push({
            id: patrol.id as string,
            type: patrol.type as number,
            unit: patrol.special_unit as number | null,
            officers: officersResult.map(officerRow => officerRow.officer as number),
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

    // Get officers of the patrol
    const officersResult = await queryDB(force, `SELECT DISTINCT officer FROM patrolOfficersV WHERE patrol = ?`, [patrol.id]);

    return {
        id: splitPatrolId(patrol.id as string)[1],
        type: patrol.type as number,
        unit: patrol.special_unit as number | null,
        officers: officersResult.map(officer => officer.officer as number),
        registrar: patrol.registrar as number,
        start: patrol.start as Date,
        end: patrol.end as Date | null,
        canceled: patrol.canceled === 1,
        notes: patrol.notes as string | null,
        force: splitPatrolId(patrol.id as string)[0]
    };
}

export async function getPatrolTimeline(force: string, id: string): Promise<InnerPatrolTimelineEntry[]> {
    const result = await queryDB(force, 'SELECT * FROM patrolOfficersV WHERE patrol = ?', id);

    return result.map(entry => ({
        patrol: entry.patrol as string,
        officer: entry.officer as number,
        start: entry.start as Date,
        end: entry.end as Date | null
    }))
}


export async function isOfficerInPatrol(force: string, officerNif: number, start: Date, end?: Date | null, patrolId?: string): Promise<boolean> {
    let result: RowDataPacket[];

    // Alter the query depending if the end is provided
    if (!end) {
        result = await queryDB(force, `SELECT *
                                         FROM patrolOfficersV
                                         WHERE officer = ?
                                           AND (
                                                   end IS NULL 
                                                       OR 
                                                   end > ?
                                               )`, [officerNif, start]);
    } else {
        /**
         * Cases to check
         * 1. The start of the new patrol is between the start and end of an existing patrol
         * 2. The end of the new patrol is between the start and end of an existing patrol
         * 3. The new patrol starts before an existing patrol and ends after it
         * 4. The new patrol starts after an existing patrol but the existing patrol has no end date (Ongoing)
         */
        result = await queryDB(force, `SELECT *
                                           FROM patrolOfficersV
                                           WHERE officer = ?
                                             AND (
                                                    (? BETWEEN start and end)
                                                 OR 
                                                    (? BETWEEN start and end)
                                                 OR 
                                                    (
                                                        (
                                                                (start BETWEEN ? AND ?)
                                                            AND
                                                                (end BETWEEN ? AND ?)
                                                        )
                                                    )
                                                 OR 
                                                    (
                                                        (? > start AND end IS NULL)    
                                                    )
                                                 )`, [officerNif, start, end, start, end, start, end, end]);
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
    const result = await queryDB(force, `SELECT patrol
                                         FROM patrolOfficersV
                                         WHERE officer = ?
                                           AND end IS NULL`, [officerNif]);

    if (result.length === 0) {
        return null;
    }
    
    return await getPatrol(force, result[0].id as string);
}

export async function createPatrol(force: string, registrar: number, type: number, specialUnit: number | null, officers: number[], start: Date, end: Date | null, notes: string | null): Promise<void> {
    // Insert the patrol into the database
    const result = await queryDB(force, `INSERT INTO patrols (type, special_unit, registrar, start, end, notes) VALUES (?, ?, ?, ?, ?, ?)`, [type, specialUnit, registrar, start, end, notes]);

    // Fetch the inserted patrol ID
    const patrolId = (result as unknown as ResultSetHeader).insertId;

    // Insert the officers into the database
    for (const officer of officers) {
        await queryDB(force, 'INSERT INTO patrol_officers (patrol, officer) VALUES (?, ?)', [patrolId, officer]);
    }
}

export async function editPatrol(force: string, id: number, changes: EditPatrolBody, canceled?: boolean) {
    // Build the query string and params depending on the fields that were provided
    const params: string[] = [];
    const updateQuery = `UPDATE patrols SET ${Object.keys(changes).reduce((acc, field) => {
        if (field === "officers") return acc;
        
        if (field === "start" || field === "end") {
            acc += `${field} = FROM_UNIXTIME(?), `;
        } else {
            acc += `${field} = ?, `;
        }
        
        params.push(changes[field as keyof EditPatrolBody] as string);
        
        return acc;
    }, "").slice(0, -2)} WHERE id = ?`;

    await queryDB(force, updateQuery, [...params, id]);

    if (canceled) {
        await queryDB(force, `UPDATE patrols SET canceled = 1 WHERE id = ?`, [id]);
    }

    // If officers were provided, update them
    if (changes.officers) {
        // Get the current patrol data up-to-date
        const patrolData = (await getPatrol(force, `${force}${id}`))!;

        // Get the patrol's timeline
        const patrolTimeline = await getPatrolTimeline(force, `${force}${id}`);
    }
}

export async function deletePatrol(force: string, id: number) {
    await queryDB(force, `DELETE FROM patrols WHERE id = ?`, [id]);
}