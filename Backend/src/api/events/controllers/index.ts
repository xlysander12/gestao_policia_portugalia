import {APIResponse} from "../../../types";
import express from "express";
import {getEventsService} from "../services";
import {FORCE_HEADER} from "../../../utils/constants";
import {EventDetailsResponse, EventsListResponse} from "@portalseguranca/api-types/events/output";
import {EventInfoAPIResponse} from "../../../types/response-types";
import {dateToUnix} from "../../../utils/date-handler";

export async function getEventsController(req: express.Request, res: APIResponse<EventsListResponse>) {
    // Call the serivce to get the Events list
    const result = await getEventsService(req.header(FORCE_HEADER)!, res.locals.queryParams.month ? parseInt(res.locals.queryParams.month): undefined);

    if (!result.result) {
        res.status(result.status).json({message: result.message});
        return;
    }

    res.status(result.status).json({
        message: result.message,
        data: result.data!
    });
}

export function getEventController(_req: express.Request, res: EventInfoAPIResponse<EventDetailsResponse>) {
    res.status(200).json({
        message: "Operação concluída com sucesso",
        data: {
            id: res.locals.event.id,
            force: res.locals.event.force,
            type: res.locals.event.type,
            special_unit: res.locals.event.special_unit,
            title: res.locals.event.title,
            description: res.locals.event.description,
            assignees: res.locals.event.assignees,
            start: dateToUnix(res.locals.event.start),
            end: dateToUnix(res.locals.event.end)
        }
    });
}