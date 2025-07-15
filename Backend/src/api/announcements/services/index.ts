import {DefaultReturn, InnerOfficerData} from "../../../types";
import {MinifiedAnnouncement} from "@portalseguranca/api-types/announcements/output";
import {createAnnouncement, editAnnouncement, getAnnouncements} from "../repository";
import {RouteFilterType} from "../../routes";
import {ReceivedQueryParams} from "../../../utils/filters";
import {CreateAnnouncementBody, EditAnnouncementBody} from "@portalseguranca/api-types/announcements/input";
import {InnerAnnouncement} from "../../../types/inner-types";
import {unixToDate} from "../../../utils/date-handler";
import {canHaveForce} from "../../../middlewares/announcement-exists";

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

    const forceCheck = await canHaveForce(loggedUser, data.forces);
    if (!forceCheck.result) return forceCheck.return!;

    // Call the repostitory to update the database
    await createAnnouncement(force, loggedUser.nif, data.forces, data.tags, data.expiration ? unixToDate(data.expiration) : null, data.title, data.body);

    return {
        result: true,
        status: 200,
        message: "Operação bem sucedida"
    }
}

export async function announcementEdit(loggedUser: InnerOfficerData, announcementData: InnerAnnouncement, changes: EditAnnouncementBody): Promise<DefaultReturn<void>> {
    // Check if the forces were changed
    if (changes.forces) {
        // If the forces array contains the force of the announcement, remove it
        changes.forces = changes.forces.filter(e => e !== announcementData.force);

        // Check if the user can announce to the new forces
        const forceCheck = await canHaveForce(loggedUser, changes.forces);
        if (!forceCheck.result) return forceCheck.return!;
    }

    // Apply the changes
    await editAnnouncement(announcementData.force, announcementData.id, changes);

    return {
        result: true,
        status: 200,
        message: "Operação bem sucedida"
    }
}