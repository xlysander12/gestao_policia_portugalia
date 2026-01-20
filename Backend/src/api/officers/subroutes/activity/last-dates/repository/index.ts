import {queryDB} from "../../../../../../utils/db-connector";

export async function fetchLastDate(force: string, nif: number, field: string): Promise<Date | null> {
    const result = await queryDB(force, `SELECT last_date FROM officer_last_dates_values WHERE officer = ? AND field = ?`, [nif, field]);

    if (result.length === 0) {
        return null;
    }

    return result[0].last_date as Date | null;
}

export async function updateLastShift(force: string, nif: number, field: string, date: number | null) {
    await queryDB(force, `INSERT INTO officer_last_dates_values (officer, field, last_date) VALUES (?, ?, FROM_UNIXTIME(?)) ON DUPLICATE KEY UPDATE last_date = FROM_UNIXTIME(?)`, [nif, field, date, date]);
}