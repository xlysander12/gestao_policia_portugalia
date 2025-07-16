import {DefaultReturn, InnerOfficerData} from "../../../types";
import {MinifiedAnnouncement} from "@portalseguranca/api-types/announcements/output";
import {createAnnouncement, deleteAnnouncement, editAnnouncement, getAnnouncements} from "../repository";
import {RouteFilterType} from "../../routes";
import {ReceivedQueryParams} from "../../../utils/filters";
import {CreateAnnouncementBody, EditAnnouncementBody} from "@portalseguranca/api-types/announcements/input";
import {InnerAnnouncement} from "../../../types/inner-types";
import {dateToUnix, unixToDate} from "../../../utils/date-handler";
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

    // Ensure the expiration date is after the current date
    if (data.expiration !== null && dateToUnix(new Date()) > data.expiration) {
        return {
            result: false,
            status: 400,
            message: "A data do fim do Anúncio não pode ser mais antiga do que a data atual"
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

export async function announcementEdit(loggedUser: InnerOfficerData, announcementData: InnerAnnouncement, changes: EditAnnouncementBody): Promise<DefaultReturn<void>> {
    // If there were no changes, return
    if (Object.keys(changes).length === 0) {
        return {
            result: false,
            status: 400,
            message: "Nenhuma alteração solicitada"
        }
    }

    // Check if the forces were changed
    if (changes.forces) {
        // If the forces array contains the force of the announcement, remove it
        changes.forces = changes.forces.filter(e => e !== announcementData.force);

        // Check if the user can announce to the new forces
        const forceCheck = await canHaveForce(loggedUser, changes.forces);
        if (!forceCheck.result) return forceCheck.return!;
    }

    // Ensure the expiration date is after the current date
    if (changes.expiration !== undefined && changes.expiration !== null && dateToUnix(new Date()) > changes.expiration) {
        return {
            result: false,
            status: 400,
            message: "A data do fim do Anúncio não pode ser mais antiga do que a data atual"
        }
    }

    // Apply the changes
    await editAnnouncement(announcementData.force, announcementData.id, changes);

    return {
        result: true,
        status: 200,
        message: "Operação bem sucedida"
    }
}

export async function announcementDelete(announcementData: InnerAnnouncement) {
    //  Call the repository
    await deleteAnnouncement(announcementData.force, announcementData.id);

    return {
        result: true,
        status: 200,
        message: "Anúncio eliminado com sucesso"
    }
}