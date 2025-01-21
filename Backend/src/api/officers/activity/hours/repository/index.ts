import buildFiltersQuery, {ReceivedFilter} from "../../../../../utils/filters";
import {queryDB} from "../../../../../utils/db-connector";
import {OfficerSpecificHoursType} from "@portalseguranca/api-types/officers/activity/output";
import {RouteFilterType} from "../../../../routes";
import {dateToString} from "../../../../../utils/date-handler";

export type OfficerHoursEntryType = Omit<OfficerSpecificHoursType, "week_start" | "week_end"> & {
    week_start: Date,
    week_end: Date
}
export async function fetchHoursHistory(force: string, nif: number, routeValidFilters: RouteFilterType, filters: ReceivedFilter[]): Promise<OfficerHoursEntryType[]> {
    // Build the filters from the route
    const filtersResult = buildFiltersQuery(routeValidFilters, filters, {subquery: "officer = ?", value: nif});

    // Get the hours of the Officer from the database
    const result = await queryDB(force, `SELECT * FROM officer_hours ${filtersResult.query}`, filtersResult.values);

    // Build a proper object to hold all information
    let hours: OfficerHoursEntryType[] = [];
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

export async function fetchHoursEntry(force: string, nif: number, id: number): Promise<OfficerHoursEntryType | null> {
    const result = await queryDB(force, `SELECT * FROM officer_hours WHERE id = ? AND officer = ?`, [id, nif]);

    // Make sure to return null if no results are found, aka the entry doesn't exist or it's not from the requested officer
    if (result.length === 0) {
        return null;
    }

    // Return the object with the information
    return {
        id: result[0].id,
        week_start: result[0].week_start,
        week_end: result[0].week_end,
        minutes: result[0].minutes,
        submitted_by: result[0].submitted_by
    };
}

export async function fetchLastHoursEntry(force: string, nif: number): Promise<OfficerHoursEntryType | null> {
    const result = await queryDB(force, `SELECT * FROM officer_hours WHERE officer = ? ORDER BY week_end DESC LIMIT 1`, [nif]);

    // Make sure to return null if no results are found, aka this officer doens't have any entries
    if (result.length === 0) {
        return null;
    }

    // Return the object with the information
    return {
        id: result[0].id,
        week_start: result[0].week_start,
        week_end: result[0].week_end,
        minutes: result[0].minutes,
        submitted_by: result[0].submitted_by
    };
}

export async function ensureNoHoursThisWeek(force: string, nif: number, week_start: Date): Promise<boolean> {
    const result = await queryDB(force, `SELECT * FROM officer_hours WHERE officer = ? AND week_end > ?`, [nif, dateToString(week_start, false)]);

    return result.length === 0;
}

export async function insertHoursEntry(force: string, nif: number, week_start: Date, week_end: Date, minutes: number, submitted_by: number) {
    await queryDB(force, `INSERT INTO officer_hours (officer, week_start, week_end, minutes, submitted_by) VALUES (?, ?, ?, ?, ?)`, [nif, week_start, week_end, minutes, submitted_by]);
}

export async function deleteHoursEntry(force: string, nif: number, id: number): Promise<void> {
    await queryDB(force, `DELETE FROM officer_hours WHERE id = ? AND officer = ?`, [id, nif]);
}