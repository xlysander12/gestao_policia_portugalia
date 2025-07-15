import {APIResponse, DefaultReturn} from "../../../types";
import express from "express";
import {announcementCreate, announcementDelete, announcementEdit, announcementsHistory} from "../services";
import {FORCE_HEADER} from "../../../utils/constants";
import {isQueryParamPresent} from "../../../utils/filters";
import {
    AnnouncementInfoResponse,
    AnnouncementsListResponse,
    MinifiedAnnouncement
} from "@portalseguranca/api-types/announcements/output";
import {AnnouncementInfoAPIResponse} from "../../../types/response-types";
import {dateToUnix} from "../../../utils/date-handler";
import {CreateAnnouncementBody, EditAnnouncementBody} from "@portalseguranca/api-types/announcements/input";

export async function getAnnouncementsController(req: express.Request, res: APIResponse<AnnouncementsListResponse>) {
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
    const {id, force, ...announcementData} = res.locals.announcement;

    res.status(200).json({
        message: "Operação bem sucedida",
        data: {
            ...announcementData,
            id: `${force}${id}`,
            expiration: res.locals.announcement.expiration ? dateToUnix(res.locals.announcement.expiration) : null
        }
    });
}

export async function createAnnouncementController(req: express.Request, res: APIResponse) {
    const body = req.body as CreateAnnouncementBody;

    // Call the service to create the announcement
    const result = await announcementCreate(req.header(FORCE_HEADER)!, res.locals.loggedOfficer, body);

    // Return the result
    res.status(result.status).json({
        message: result.message
    });
}

export async function editAnnouncementController(req: express.Request, res: AnnouncementInfoAPIResponse) {
    // Get the body
    const body = req.body as EditAnnouncementBody;

    // Call the service
    const result = await announcementEdit(res.locals.loggedOfficer, res.locals.announcement, body);

    // Return result
    res.status(result.status).json({
        message: result.message
    });
}

export async function deleteAnnouncementController(req: express.Request, res: AnnouncementInfoAPIResponse) {
    // Call the service
    const result = await announcementDelete(res.locals.announcement);

    // Return the result
    res.status(result.status).json({
        message: result.message
    });
}