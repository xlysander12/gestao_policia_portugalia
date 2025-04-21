import {APIResponse} from "../../../types";
import express from "express";
import {createEventService, deleteEventService, editEventService, getEventsService} from "../services";
import {FORCE_HEADER} from "../../../utils/constants";
import {EventDetailsResponse, EventsListResponse} from "@portalseguranca/api-types/events/output";
import {EventInfoAPIResponse} from "../../../types/response-types";
import {dateToUnix} from "../../../utils/date-handler";
import {CreateEventBody, EditEventBody} from "@portalseguranca/api-types/events/input";

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
            author: res.locals.event.author,
            title: res.locals.event.title,
            description: res.locals.event.description,
            assignees: res.locals.event.assignees,
            start: dateToUnix(res.locals.event.start),
            end: dateToUnix(res.locals.event.end)
        }
    });
}

export async function createEventController(req: express.Request, res: APIResponse) {
    const event_data = req.body as CreateEventBody;

    // Call the service
    const result = await createEventService(req.header(FORCE_HEADER)!, res.locals.loggedOfficer, event_data);

    res.status(result.status).json({message: result.message});
}

export async function editEventController(req: express.Request, res: EventInfoAPIResponse) {
    const changes = req.body as EditEventBody;

    // Call the service
    const result = await editEventService(req.header(FORCE_HEADER)!, res.locals.event, changes);

    res.status(result.status).json({message: result.message});
}

export async function deleteEventController(req: express.Request, res: EventInfoAPIResponse) {
    // Call the service
    const result = await deleteEventService(req.header(FORCE_HEADER)!, res.locals.event);

    res.status(result.status).json({message: result.message});
}