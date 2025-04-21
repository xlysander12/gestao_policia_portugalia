import {InnerForceEvent, InnerMinifiedEvent} from "../../../types/inner-types";
import {queryDB} from "../../../utils/db-connector";
import {CreateEventBody} from "@portalseguranca/api-types/events/input";

export async function getEvents(force: string, month: number): Promise<InnerMinifiedEvent[]> {
    // Query the DB to fetch the Events
    const result = await queryDB(
        force,
        `
            SELECT id, \`force\`, title, start, end
            FROM
                eventsV
            WHERE
                MONTH(start) = ? OR MONTH(end) = ?
        `,
        [month, month]
    );

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
            SELECT * 
            FROM 
                eventsV
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