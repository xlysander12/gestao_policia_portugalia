import {RouteFilterType} from "../../routes";
import buildFiltersQuery, {ReceivedQueryParams} from "../../../utils/filters";
import {queryDB} from "../../../utils/db-connector";
import {MinifiedAnnouncement} from "@portalseguranca/api-types/announcements/output";

export async function getAnnouncements(force: string, routeFilters: RouteFilterType, filters: ReceivedQueryParams, page = 1, entriesPerPage = 10): Promise<{announcements: MinifiedAnnouncement[], pages: number}> {
    // Build the filters
    const filtersResult = buildFiltersQuery(routeFilters, filters);

    // Get the announcements from the Database
    const result = await queryDB(force, `SELECT * FROM announcementsV ${filtersResult.query} LIMIT ${entriesPerPage} OFFSET ${(page - 1) * entriesPerPage}`, filtersResult.values);

    // Build the announcements array
    const announcements: MinifiedAnnouncement[] = [];
    for (const announcement of result) {
        announcements.push({
            id: announcement.id as string,
            author: announcement.author as number,
            tags: JSON.parse(announcement.tags as string),
            expiration: announcement.expiration as number | null,
            title: announcement.title as string,
        });
    }

    // Get the number of total entries in the view
    const totalEntries = await queryDB(force, `SELECT COUNT(*) FROM announcementsV ${filtersResult.query}`, filtersResult.values);

    return {
        announcements,
        pages: Math.ceil(totalEntries[0]["COUNT(*)"] / entriesPerPage)
    };
}