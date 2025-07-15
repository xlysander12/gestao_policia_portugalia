import {DefaultReturn} from "../../../types";
import {MinifiedAnnouncement} from "@portalseguranca/api-types/announcements/output";
import {getAnnouncements} from "../repository";
import {RouteFilterType} from "../../routes";
import {ReceivedQueryParams} from "../../../utils/filters";

export async function announcementsHistory(force: string, validFilters: RouteFilterType, receivedFilters: ReceivedQueryParams, page = 1, entriesPerPage = 10): Promise<DefaultReturn<{announcements: MinifiedAnnouncement[], pages: number}>> {
    // Fetch the announcements from the repository
    const result = await getAnnouncements(force, validFilters, receivedFilters, page, entriesPerPage);

    // Return the list
    return {
        result: true,
        status: 200,
        message: "Operação efetuada com sucesso",
        data: result
    }
}