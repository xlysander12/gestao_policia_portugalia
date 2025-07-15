import {DefaultReturn, InnerOfficerData} from "../../../types";
import {MinifiedAnnouncement} from "@portalseguranca/api-types/announcements/output";
import {createAnnouncement, getAnnouncements} from "../repository";
import {RouteFilterType} from "../../routes";
import {ReceivedQueryParams} from "../../../utils/filters";
import {CreateAnnouncementBody} from "@portalseguranca/api-types/announcements/input";
import {InnerAccountData} from "../../../types/inner-types";
import {userHasIntents} from "../../accounts/repository";
import {unixToDate} from "../../../utils/date-handler";

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

export async function announcementCreate(force: string, loggedUser: InnerOfficerData, data: CreateAnnouncementBody): Promise<DefaultReturn<void>> {
    // If the forces array contains the current force, remove it from the array
    if (data.forces.includes(force)) {
        data.forces = data.forces.filter(e => e !== force);
    }

    // If the forces array isn't empty, ensure the logged user has the "announcements" intent in all the forces
    if (data.forces.length > 0) {
        for (const force of data.forces) {
            if (!(await userHasIntents(loggedUser.nif, force, "announcements"))) {
                return {
                    result: false,
                    status: 403,
                    message: `Não podes criar um anúncio para a força "${force}"`
                }
            }
        }
    }

    // Call the repostitory to update the database
    await createAnnouncement(force, loggedUser.nif, data.forces, data.tags, data.expiration ? unixToDate(data.expiration) : null, data.title, data.body);

    return {
        result: true,
        status: 200,
        message: "Operação bem sucedida"
    }
}