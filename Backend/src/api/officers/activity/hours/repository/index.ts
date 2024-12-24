import {Filters} from "../../../../../utils/filters";
import {queryDB} from "../../../../../utils/db-connector";
import {OfficerSpecificHoursType} from "@portalseguranca/api-types/officers/activity/output";

export type OfficerHoursHistoryType = Omit<OfficerSpecificHoursType, "week_start" | "week_end"> & {
    week_start: Date,
    week_end: Date
}
export async function fetchHoursHistory(force: string, officer: number, filters: Filters): Promise<OfficerHoursHistoryType[]> {
    // Get the hours of the Officer from the repository
    const result = await queryDB(force, `SELECT * FROM officer_hours ${filters.query}`, filters.values);

    // Build a proper object to hold all information
    let hours: OfficerHoursHistoryType[] = [];
    for (const entry of result) {
        hours.push({
            id: entry.id,
            week_start: entry.week_start,
            week_end: entry.week_end,
            minutes: entry.minutes,
            submitted_by: entry.submitted_by
        });
    }

    return hours;
}