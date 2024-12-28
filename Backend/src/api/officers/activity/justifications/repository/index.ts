import {OfficerMinifiedJustification} from "@portalseguranca/api-types/officers/activity/output";
import {queryDB} from "../../../../../utils/db-connector";
import {dateToString} from "../../../../../utils/date-handler";

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
            start: result.start_date,
            end: result.end_date,
            status: result.status,
            managed_by: result.managed_by
        });
    }

    // Return the array
    return arr;
}