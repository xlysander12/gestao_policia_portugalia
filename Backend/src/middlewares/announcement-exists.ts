import {AnnouncementInfoAPIResponse} from "../types/response-types";
import {getAnnouncement} from "../api/announcements/repository";
import {FORCE_HEADER} from "../utils/constants";
import express from "express";
import {DefaultReturn, InnerOfficerData} from "../types";
import {userHasIntents} from "../api/accounts/repository";

export async function announcementExistsMiddle(req: express.Request, res: AnnouncementInfoAPIResponse, next: express.NextFunction) {
    const {id} = req.params;

    const result = await getAnnouncement(req.header(FORCE_HEADER)!, id);

    if (result === null) {
        res.status(404).json({
            message: "Anúncio não encontrado"
        });
        return;
    }

    // Store the announcement in the locals
    res.locals.announcement = result;

    next();
}

export async function canHaveForce(loggedUser: InnerOfficerData, forces: string[]): Promise<{result: boolean, return?: DefaultReturn<void>}> {
    // If the forces array isn't empty, ensure the logged user has the "announcements" intent in all the forces
    if (forces.length > 0) {
        for (const force of forces) {
            if (!(await userHasIntents(loggedUser.nif, force, "announcements"))) {
                return {
                    result: false,
                    return: {
                        result: false,
                        status: 403,
                        message: `Não podes criar um anúncio para a força "${force}"`
                    }
                }
            }
        }
    }

    return {result: true}
}

export async function announcementEditableMiddle(_req: express.Request, res: AnnouncementInfoAPIResponse, next: express.NextFunction) {
    // Check if the logged user can edit this announcement
    const forceCheck = await canHaveForce(res.locals.loggedOfficer, res.locals.announcement.forces);
    if (!forceCheck.result) {
        res.status(forceCheck.return!.status).json({
            message: forceCheck.return!.message
        });
        return;
    }

    next();
}