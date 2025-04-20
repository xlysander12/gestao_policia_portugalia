import express from "express";
import {EventInfoAPIResponse} from "../types/response-types";
import {getEvent} from "../api/events/repository";
import {FORCE_HEADER} from "../utils/constants";

export async function eventExistsMiddleware(req: express.Request, res: EventInfoAPIResponse, next: express.NextFunction) {
    const {id} = req.params;

    // Make sure the provided ID matches the regex
    if (!(/^\D+\d+$/.exec(id))) {
        res.status(400).json({
            message: "ID de Evento inválido"
        });
        return;
    }

    // Split the force and the ID of the event
    const [event_force, event_id] = id.split(/(?<=\D)(?=\d)/);

    // Call the repository to get the event
    const result = await getEvent(req.header(FORCE_HEADER)!, parseInt(event_id), event_force.toLowerCase());

    // If the result is null, no event has been found
    if (!result) {
        res.status(404).json({
            message: "Evento não encontrado"
        });
        return;
    }

    // Save the Event details to locals
    res.locals.event = result;

    // Proceed to the next middleware
    next();
}