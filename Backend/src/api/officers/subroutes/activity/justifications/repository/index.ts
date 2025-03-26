import {
    OfficerActiveJustification,
    OfficerJustification,
    OfficerMinifiedJustification
} from "@portalseguranca/api-types/officers/activity/output";
import { ChangeOfficerJustificationBodyType } from "@portalseguranca/api-types/officers/activity/input";
import {queryDB} from "../../../../../../utils/db-connector";

type MinifiedOfficerJustification = Omit<OfficerMinifiedJustification, "start | end | timestamp"> &  {
    start: Date,
    end: Date,
    timestamp: Date
}
export async function getOfficerJustificationsHistory(force: string, nif: number): Promise<MinifiedOfficerJustification[]> {
    // Fetch from the database
    const results = await queryDB(force, "SELECT id, type, start_date, end_date, status, managed_by, timestamp FROM officer_justifications WHERE officer = ?", [nif]);

    // Order the result in an proper array
    let arr: MinifiedOfficerJustification[] = [];
    for (const result of results) {
        arr.push({
            id: result.id,
            type: result.type,
            start: result.start_date,
            end: result.end_date,
            status: result.status,
            managed_by: result.managed_by,
            timestamp: result.timestamp
        });
    }

    // Return the array
    return arr;
}

type OfficerJustificationDetails = Omit<OfficerJustification, "start | end | timestamp"> & {
    start: Date
    end: Date
    timestamp: Date
}
export async function getOfficerJustificationDetails(force: string, nif: number, id: number): Promise<OfficerJustificationDetails | null> {
    // Fetch from the database
    const result = await queryDB(force, "SELECT * FROM officer_justifications WHERE officer = ? AND id = ?", [nif, id]);

    // If the result is empty, return null
    if (result.length === 0) return null;

    // Return the result
    return {
        id: id,
        type: result[0].type,
        start: result[0].start_date,
        end: result[0].end_date,
        description: result[0].description,
        status: result[0].status,
        comment: result[0].comment,
        managed_by: result[0].managed_by,
        timestamp: result[0].timestamp
    }
}

export async function getOfficerActiveJustifications(force: string, nif: number): Promise<OfficerActiveJustification[]> {
    // Fetch from the database
    const results = await queryDB(force, "SELECT id, type FROM officer_justifications WHERE officer = ? AND ((current_date() BETWEEN start_date AND end_date) OR current_date() > start_date AND end_date IS NULL) AND status = 'approved'", [nif]);

    // Order the result in an proper array
    let arr: OfficerActiveJustification[] = [];
    for (const result of results) {
        arr.push({
            id: result.id,
            type: result.type,
        });
    }

    // Return the array
    return arr;
}

export async function createOfficerJustification(force: string, nif: number, type: number, description: string, start: Date, end?: Date): Promise<void> {
    // Insert into the database
    await queryDB(force, "INSERT INTO officer_justifications (officer, type, start_date, end_date, description) VALUES (?, ?, ?, ?, ?)", [nif, type, start, end, description]);
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
    let params: any[] = [];
    let updateQuery = `UPDATE officer_justifications SET`;
    updateQuery += " ";

    // Loop through all valid fields and check if they are present in the changes list
    for (const field of validFields) {
        // If the field is present in the changes list, add it to the query
        if (Object.keys(changes).includes(field.name)) {
            updateQuery += `${field.db} = ?, `;
            // @ts-expect-error
            params.push(changes[field.name]);
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