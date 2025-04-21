import express from "express";
import {EventInfoAPIResponse} from "../types/response-types";
import {getEvent} from "../api/events/repository";
import {FORCE_HEADER} from "../utils/constants";
import {userHasIntents} from "../api/accounts/repository";

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

/**
 * For an Event to be editable, one of 2 things must be true:*
 * 1 - The Logged User is the author of the Event
 * 2 - The Logged User has the "events" intent AND belongs to the force of the Event
**/
export async function isEventEditableMiddleware(req: express.Request, res: EventInfoAPIResponse, next: express.NextFunction) {
    // First, check if the Logged Officer is the author of the Event
    if (res.locals.loggedOfficer.nif === res.locals.event.author) {
        next();
        return;
    }
    
    // Since the Logged Officer isn't the author, check if the request was made using the same force as the Event and their intents
    if (req.header(FORCE_HEADER) === res.locals.event.force && await userHasIntents(res.locals.loggedOfficer.nif, req.header(FORCE_HEADER)!, "events")) {
        next();
        return;
    }

    // Since none of the conditions were met, send an Forbidden Response
    res.status(403).json({
        message: "Não tens permissão para editar este Evento"
    });
}