import {
    OfficerActiveJustification,
    OfficerJustification,
    OfficerMinifiedJustification
} from "@portalseguranca/api-types/officers/activity/output";
import { ChangeOfficerJustificationBodyType } from "@portalseguranca/api-types/officers/activity/input";
import {paramsTypes, queryDB} from "../../../../../../utils/db-connector";
import {dateToUnix} from "../../../../../../utils/date-handler";

type InnerOfficerMinifiedJustification = Omit<OfficerMinifiedJustification, "start | end | timestamp"> &  {
    start: Date,
    end: Date | null,
    timestamp: Date
}
export async function getOfficerJustificationsHistory(force: string, nif: number): Promise<InnerOfficerMinifiedJustification[]> {
    // Fetch from the database
    const results = await queryDB(force, "SELECT id, type, start_date, end_date, status, managed_by, timestamp FROM officer_justifications WHERE officer = ?", [nif]);

    // Order the result in an proper array
    const arr: InnerOfficerMinifiedJustification[] = [];
    for (const result of results) {
        arr.push({
            id: result.id as number,
            type: result.type as number,
            start: result.start_date as number & Date,
            end: result.end_date as number & Date | null,
            status: result.status as "pending" | "approved" | "denied",
            managed_by: result.managed_by as number | null,
            timestamp: result.timestamp as number & Date
        });
    }

    // Return the array
    return arr;
}

type InnerOfficerJustification = Omit<OfficerJustification, "start | end | timestamp | comment"> & {
    start: Date
    end: Date | null
    comment: string | null
    timestamp: Date
}
export async function getOfficerJustificationDetails(force: string, nif: number, id: number): Promise<InnerOfficerJustification | null> {
    // Fetch from the database
    const result = await queryDB(force, "SELECT * FROM officer_justifications WHERE officer = ? AND id = ?", [nif, id]);

    // If the result is empty, return null
    if (result.length === 0) return null;

    // Return the result
    return {
        id: id,
        type: result[0].type as number,
        start: result[0].start_date as number & Date,
        end: result[0].end_date as number & Date | null,
        description: result[0].description as string,
        status: result[0].status as "pending" | "approved" | "denied",
        comment: (result[0].comment as string | null) ?? "",
        managed_by: result[0].managed_by as number | null,
        timestamp: result[0].timestamp as number & Date
    }
}

export async function getOfficerActiveJustifications(force: string, nif: number): Promise<OfficerActiveJustification[]> {
    // Fetch from the database
    const results = await queryDB(force, "SELECT id, type FROM officer_justifications WHERE officer = ? AND ((CURRENT_TIMESTAMP() BETWEEN start_date AND end_date) OR CURRENT_TIMESTAMP() >= start_date AND end_date IS NULL) AND status = 'approved'", [nif]);

    // Order the result in an proper array
    const arr: OfficerActiveJustification[] = [];
    for (const result of results) {
        arr.push({
            id: result.id as number,
            type: result.type as number,
        });
    }

    // Return the array
    return arr;
}

export async function couldOfficerPatrolDueToJustificationInDate(force: string, nif: number, date: Date) {
    // Fetch from the database
    const result = await queryDB(force,
        `
                SELECT officer_justifications.*
                FROM officer_justifications
                JOIN inactivity_types ON officer_justifications.type = inactivity_types.id
                JOIN status ON inactivity_types.status = status.id
                WHERE status.can_patrol = 0
                    AND officer_justifications.officer = ?
                    AND ((FROM_UNIXTIME(?) BETWEEN officer_justifications.start_date AND officer_justifications.end_date)
                        OR (FROM_UNIXTIME(?) > officer_justifications.start_date AND officer_justifications.end_date IS NULL))
                    AND officer_justifications.status = 'approved'
        `, [nif, dateToUnix(date), dateToUnix(date)]);

    // If the result is empty, return null
    if (result.length === 0) return false;

    // Return the result
    return true;
}

export async function createOfficerJustification(force: string, nif: number, type: number, description: string, start: Date, end?: Date): Promise<void> {
    // Insert into the database
    await queryDB(force, "INSERT INTO officer_justifications (officer, type, start_date, end_date, description) VALUES (?, ?, FROM_UNIXTIME(?), FROM_UNIXTIME(?), ?)", [nif, type, dateToUnix(start), end ? dateToUnix(end) : null, description]);
}

export async function updateOfficerJustificationStatus(force: string, nif: number, id: number, approved: boolean, comment: string | undefined, managed_by: number): Promise<void> {
    // * Update the database
    // If no comment was passed, don't try to update it in the database
    if (!comment) {
        await queryDB(force, "UPDATE officer_justifications SET status = ?, managed_by = ? WHERE officer = ? AND id = ?", [approved ? "approved": "denied", managed_by, nif, id]);
    } else { // Otherwise, update the comment as well
        await queryDB(force, "UPDATE officer_justifications SET status = ?, comment = ?, managed_by = ? WHERE officer = ? AND id = ?", [approved ? "approved": "denied", comment, managed_by, nif, id]);
    }
}

export async function updateOfficerJustificationDetails(force: string, nif: number, id: number, changes: ChangeOfficerJustificationBodyType): Promise<void> {
    // * Variable that holds the possible changes and their columns in the database
    const validFields = [{name: "type", db: "type"}, {name: "start", db: "start_date"}, {name: "end", db: "end_date"}, {name: "description", db: "description"}, {name: "comment", db: "comment"}];

    // * Build the query and params
    // Initialize the params array and the query string
    const params: paramsTypes[] = [];
    let updateQuery = `UPDATE officer_justifications SET`;
    updateQuery += " ";

    // Loop through all valid fields and check if they are present in the changes list
    for (const field of validFields) {
        // If the field is present in the changes list, add it to the query
        if (Object.keys(changes).includes(field.name)) {
            if (field.name === "start" || field.name === "end") {
                updateQuery += `${field.db} = FROM_UNIXTIME(?), `;
            } else {
                updateQuery += `${field.db} = ?, `;
            }

            params.push(changes[field.name as keyof ChangeOfficerJustificationBodyType]);
        }
    }

    // Remove the last comma and space from the query
    updateQuery = updateQuery.slice(0, -2);

    // Add the officer nif to the query
    updateQuery += ` WHERE officer = ? AND id = ?`;

    // Query the database to update the justification
    await queryDB(force, updateQuery, [...params, nif, id]);
}

export async function deleteOfficerJustification(force: string, nif: number, id: number): Promise<void> {
    // Delete the justification from the database
    await queryDB(force, "DELETE FROM officer_justifications WHERE officer = ? AND id = ?", [nif, id]);
}