import {AnnouncementInfoAPIResponse} from "../types/response-types";
import {getAnnouncement} from "../api/announcements/repository";
import {FORCE_HEADER} from "../utils/constants";
import express from "express";

async function announcementExistsMiddle(req: express.Request, res: AnnouncementInfoAPIResponse, next: express.NextFunction) {
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

export default announcementExistsMiddle;