import {InnerForceEvent, InnerMinifiedEvent} from "../../../types/inner-types";
import {paramsTypes, queryDB} from "../../../utils/db-connector";
import {CreateEventBody, EditEventBody} from "@portalseguranca/api-types/events/input";
import {RouteFilterType} from "../../routes";
import buildFiltersQuery, {ReceivedQueryParams} from "../../../utils/filters";
import {getForceDatabase, getForcePatrolForces} from "../../../utils/config-handler";

function getBaseQuery(force: string) {
    // Get all forces that can patrol with this force
    const compatibleForces = getForcePatrolForces(force);

    // Build the base query
    return compatibleForces.reduce((acc, compatibleForce, index) => {
        const forceDB = getForceDatabase(compatibleForce);

        if (index !== 0) { // If this is not the first force, start with parenthesis
            acc += " UNION ALL ";
        }

        acc += `
            SELECT 
                events.id AS id,
                events.type AS type,
                events.special_unit AS special_unit,
                events.author AS author,
                CASE
                    WHEN event_types.variant = 'ceremony' THEN event_types.name
                    WHEN event_types.variant = 'special_unit' THEN 
                        CONCAT(event_types.name, ' - ', special_units.name)
                    ELSE events.title
                END AS title,
                events.description AS description,
                events.assignees AS assignees,
                events.start AS start,
                events.end AS end,
                '${compatibleForce}' AS \`force\`
            FROM
                (
                    (
                        ${forceDB}.events JOIN ${forceDB}.event_types ON events.type = event_types.id
                    )
                    LEFT JOIN ${forceDB}.special_units ON events.special_unit = special_units.id
                )
        `

        // If this is the last force, close the parenthesis and add an alias
        if (index === compatibleForces.length - 1) {
            acc += `
            ) AS combined
        `;
        }

        return acc;
    }, `SELECT * FROM (`);
}

export async function getEvents(force: string, start: number, end?: number, routeValidFilters?: RouteFilterType, filters?: ReceivedQueryParams): Promise<InnerMinifiedEvent[]> {
    // Get the base query
    const base_query = getBaseQuery(force);

    // Build filters
    const useFilters = routeValidFilters !== undefined && filters !== undefined;
    const filtersResult = useFilters ? buildFiltersQuery(force, routeValidFilters, filters, {
        subquery: end !== undefined ? "start <= FROM_UNIXTIME(?) AND end >= FROM_UNIXTIME(?)" : "start >= FROM_UNIXTIME(?)",
        value: end !== undefined ? [end, start] : [start]
    }) : null;

    // Query the DB to fetch the Events
    let result;
    if (useFilters) {
        result = await queryDB(
            force,
            `
                ${base_query}
                ${filtersResult!.query}
            `,
            filtersResult!.values
        );
    } else {
        result = end ?
            await queryDB(
                force,
                `
            ${base_query}
            WHERE
                start <= FROM_UNIXTIME(?)
            AND
                end >= FROM_UNIXTIME(?)
        `,
                [end, start]
            ) :
            await queryDB(
                force,
                `
                ${base_query}
                WHERE
                    start >= FROM_UNIXTIME(?)
        `,
                [start]);
    }

    // Get all values into an array
    const events: InnerMinifiedEvent[] = [];
    for (const row of result) {
        events.push({
            id: row.id as number,
            force: row.force as string,
            title: row.title as string,
            start: row.start as Date,
            end: row.end as Date
        });
    }

    return events;
}

export async function getEvent(force: string, id: number, event_force: string): Promise<InnerForceEvent | null> {
    // Query the DB
    const result = await queryDB(
        force,
        `
            ${getBaseQuery(force)}
            WHERE
                id = ? AND
                \`force\` = ?
            LIMIT 1
        `,
        [id, event_force]
    );

    // If no results were found, return null
    if (result.length === 0) {
        return null;
    }

    return {
        id: result[0].id as number,
        force: result[0].force as string,
        type: result[0].type as number,
        special_unit: result[0].special_unit as number | null,
        author: result[0].author as number,
        title: result[0].title as string,
        description: result[0].description as string | null,
        assignees: JSON.parse(result[0].assignees as string) as number[],
        start: result[0].start as Date,
        end: result[0].end as Date
    }
}

export async function createEvent(force: string, author_nif: number, data: CreateEventBody) {
    // Query the DB to insert the Event data
    await queryDB(
        force,
        `
                INSERT INTO
                    events (type, special_unit, author, title, description, assignees, start, end)
                VALUES 
                    (?, ?, ?, ?, ?, ?, FROM_UNIXTIME(?), FROM_UNIXTIME(?))
            `,
        [data.type, data.special_unit ?? null, author_nif, data.title ?? null, data.description ?? null, JSON.stringify(data.assignees ?? []), data.start, data.end]
    );
}

export async function editEvent(force: string, id: number, data: EditEventBody) {
    // Build the query
    const values: paramsTypes[] = [];
    const query = `UPDATE events SET ${Object.keys(data).reduce((acc, field) => {
        // Add the value to the values array
        if (field === "assignees") {
            values.push(JSON.stringify(data.assignees ?? []))
        } else {
            values.push(data[field as keyof EditEventBody] as paramsTypes); // This type assertion is required since the array has been explicitly separated
        }
        
        // Add the field to the query
        if (field === "start" || field === "end") {
            return acc + `${field} = FROM_UNIXTIME(?), `;
        }
        
        return acc + `${field} = ?, `;
    }, "").slice(0, -2)} WHERE id = ?`;

    // Execute the query
    await queryDB(force, query, [...values, id]);
}

export async function deleteEvent(force: string, id: number) {
    await queryDB(force, 'DELETE FROM events WHERE id = ?', id);
}