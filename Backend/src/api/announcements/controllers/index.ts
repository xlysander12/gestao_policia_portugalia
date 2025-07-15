import {APIResponse, DefaultReturn} from "../../../types";
import express from "express";
import {announcementsHistory} from "../services";
import {FORCE_HEADER} from "../../../utils/constants";
import {isQueryParamPresent} from "../../../utils/filters";
import {AnnouncementInfoResponse, MinifiedAnnouncement} from "@portalseguranca/api-types/announcements/output";
import {AnnouncementInfoAPIResponse} from "../../../types/response-types";
import {dateToUnix} from "../../../utils/date-handler";

export async function getAnnouncementsController(req: express.Request, res: APIResponse) {
    // * Call the service and get the data from it
    let result : DefaultReturn<{
        announcements: MinifiedAnnouncement[]
        pages: number
    }>;
    if (isQueryParamPresent("page", res.locals.queryParams)) {
        result = await announcementsHistory(req.header(FORCE_HEADER)!, res.locals.routeDetails.filters!, res.locals.queryParams, parseInt(res.locals.queryParams.page));
    } else {
        result = await announcementsHistory(req.header(FORCE_HEADER)!, res.locals.routeDetails.filters!, res.locals.queryParams);
    }


    if (!result.result) {
        res.status(result.status).json({
            message: result.message
        });
        return;
    }

    res.status(result.status).json({
        meta: {
            pages: result.data!.pages
        },
        message: result.message,
        data: result.data!.announcements
    });
}

export function getAnnouncementController(_req: express.Request, res: AnnouncementInfoAPIResponse<AnnouncementInfoResponse>) {
    res.status(200).json({
        message: "Operação bem sucedida",
        data: {
            ...res.locals.announcement,
            expiration: res.locals.announcement.expiration ? dateToUnix(res.locals.announcement.expiration) : null
        }
    });
}