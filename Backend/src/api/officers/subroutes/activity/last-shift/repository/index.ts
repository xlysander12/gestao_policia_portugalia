import {queryDB} from "../../../../../../utils/db-connector";

export async function fetchLastShift(force: string, nif: number): Promise<Date | null> {
    const result = await queryDB(force, `SELECT last_shift FROM officer_last_shift WHERE officer = ?`, nif);

    if (result.length === 0) {
        return null;
    }

    return result[0].last_shift as Date;
}

export async function updateLastShift(force: string, nif: number, last_shift: Date | null) {
    return await queryDB(force, `INSERT INTO officer_last_shift (officer, last_shift) VALUES (?, ?) ON DUPLICATE KEY UPDATE last_shift = ?`, [nif, last_shift, last_shift]);
}