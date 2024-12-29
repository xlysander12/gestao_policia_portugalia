import {OfficerJustification, OfficerMinifiedJustification} from "@portalseguranca/api-types/officers/activity/output";
import {queryDB} from "../../../../../utils/db-connector";

type MinifiedOfficerJustification = Omit<OfficerMinifiedJustification, "start | end"> &  {
    start: Date,
    end: Date
}
export async function getOfficerJustificationsHistory(force: string, nif: number): Promise<MinifiedOfficerJustification[]> {
    // Fetch from the database
    const results = await queryDB(force, "SELECT id, start_date, end_date, status, managed_by FROM officer_justifications WHERE officer = ?", [nif]);

    // Order the result in an proper array
    let arr: MinifiedOfficerJustification[] = [];
    for (const result of results) {
        arr.push({
            id: result.id,
            type: result.type,
            start: result.start_date,
            end: result.end_date,
            status: result.status,
            managed_by: result.managed_by
        });
    }

    // Return the array
    return arr;
}

type OfficerJustificationDetails = Omit<OfficerJustification, "start | end"> & {
    start: Date,
    end: Date
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
        managed_by: result[0].managed_by
    }
}

export async function createOfficerJustification(force: string, nif: number, type: number, description: string, start: Date, end?: Date): Promise<void> {
    // Insert into the database
    await queryDB(force, "INSERT INTO officer_justifications (officer, type, start_date, end_date, description) VALUES (?, ?, ?, ?, ?)", [nif, type, start, end, description]);
}

export async function updateOfficerJustificationStatus(force: string, nif: number, id: number, approved: boolean, managed_by: number): Promise<void> {
    // Update the database
    await queryDB(force, "UPDATE officer_justifications SET status = ?, managed_by = ? WHERE officer = ? AND id = ?", [approved ? "approved": "denied", managed_by, nif, id]);
}