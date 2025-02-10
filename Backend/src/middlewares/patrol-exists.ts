import express from "express";
import {PatrolInfoAPIResponse} from "../types/response-types";
import {getPatrol} from "../api/patrols/repository";
import {FORCE_HEADER} from "../utils/constants";
import {userHasIntents} from "../api/accounts/repository";

async function patrolExistsMiddle(req: express.Request, res: PatrolInfoAPIResponse, next: express.NextFunction) {
    // Fetch the patrol from the database
    const patrol = await getPatrol(req.header(FORCE_HEADER)!, req.params.id);

    // If the patrol doesn't exist, return a 404 status code
    if (patrol === null) {
        res.status(404).json({
            message: "Não foi encontrada nenhuma patrulha com o ID fornecido."
        });
        return;
    }

    // * Check if the patrol is editable by the logged officer
    // First, check if the logged user has the "patrols" intent
    if (await userHasIntents(res.locals.loggedOfficer.nif, req.header(FORCE_HEADER)!, "patrols")) {
        patrol.editable = true;
    } else {
        // Now, check if the officer is appart of the patrol
        if (patrol.officers.some((officer) => officer === res.locals.loggedOfficer.nif)) {
            // Check if the patrol has ended for more than 30 minutes. If so, set the patrol as not editable
            patrol.editable = !(patrol.end !== null && Date.now() - patrol.end.getTime() > (30 * 60 * 1000));
        } else { // If not, set the patrol as not editable
            patrol.editable = false;
        }
    }

    // Set the patrol data and continue
    res.locals.patrol = patrol;
    next();

}

export default patrolExistsMiddle;