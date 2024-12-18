import {queryDB} from "../../../../../utils/db-connector";

export async function fetchLastShift(force: string, nif: number): Promise<Date | null> {
    const result = await queryDB(force, `SELECT last_shift FROM officer_last_shift WHERE officer = ?`, nif);

    if (result.length === 0) {
        return null;
    }

    return result[0].last_shift;
}