import {RouteFilterType} from "../../routes";
import buildFiltersQuery, {ReceivedQueryParams} from "../../../utils/filters";
import {queryDB} from "../../../utils/db-connector";
import {MinifiedAnnouncement} from "@portalseguranca/api-types/announcements/output";
import {InnerAnnouncement} from "../../../types/inner-types";
import {dateToUnix} from "../../../utils/date-handler";

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
            expiration: announcement.expiration ? dateToUnix(announcement.expiration as Date) : null,
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

export async function getAnnouncement(force: string, id: string): Promise<InnerAnnouncement | null> {
    // Fetch the data from the Database
    const result = await queryDB(force, `SELECT * FROM announcementsV WHERE id = ? LIMIT 1`, id);

    // If no announcement is found, return 404
    if (result.length === 0) return null;

    // Build the return object
    return {
        id: result[0].id as string,
        author: result[0].author as number,
        forces: JSON.parse(result[0].forces as string) as string[],
        tags: JSON.parse(result[0].tags as string) as string[],
        expiration: result[0].expiration as Date | null,
        title: result[0].title as string,
        body: result[0].body as string,
    };
}

export async function createAnnouncement(force: string, author: number, forces: string[], tags: string[], expiration: Date | null, title: string, body: string) {
    await queryDB(force, `INSERT INTO announcements(author, forces, tags, expiration, title, body) VALUES (?, ?, ?, ?, ?, ?)`, [author, JSON.stringify(forces), JSON.stringify(tags), expiration, title, body]);
}