import express from "express";
import {getOfficerJustificationDetails} from "../api/officers/subroutes/activity/justifications/repository";
import {FORCE_HEADER} from "../utils/constants";
import {OfficerJustificationAPIResponse} from "../types/response-types";
import {unixToDate} from "../utils/date-handler";
import {userHasIntents} from "../api/accounts/repository";

async function justificationExistsMiddleware(req: express.Request, res: OfficerJustificationAPIResponse, next: express.NextFunction) {
    // * Make sure the provided justification id is valid
    let justification = await getOfficerJustificationDetails(req.header(FORCE_HEADER)!, res.locals.targetOfficer!.nif, parseInt(req.params["id"]));

    // If the justification doesn't exist, return an error
    if (justification === null) {
        res.status(404).json({
            message: "Justificação não encontrada"
        });
        return;
    }

    // Store the justification in the response locals
    res.locals.justification = {
        id: justification.id,
        officer: res.locals.targetOfficer!.nif,
        type: justification.type,
        start: unixToDate(justification.start),
        end: justification.end ? unixToDate(justification.end): null,
        description: justification.description,
        status: justification.status,
        comment: justification.comment || null,
        managed_by: justification.managed_by,
        timestamp: justification.timestamp
    };

    next();
}

export async function isJustificationEditable(req: express.Request, res: OfficerJustificationAPIResponse, next: express.NextFunction) {
    // If the requesting officer is not the target officer, then the requesting officer must have the "activity" intent
    if (res.locals.loggedOfficer.nif !== res.locals.targetOfficer!.nif) {
        if (!(await userHasIntents(res.locals.loggedOfficer.nif, req.header(FORCE_HEADER)!, "activity"))) {
            res.status(403).json({
                message: "Não tens permissão para realizar esta ação"
            });
            return;
        }
    }

    // If the status of the justification is not pending and the requesting officer doesn't have the activity intent, return an error
    if (res.locals.justification.status !== "pending" && !(await userHasIntents(res.locals.loggedOfficer.nif, req.header(FORCE_HEADER)!, "activity"))) {
        res.status(403).json({
            message: "Esta justificação já foi processada e não pode ser alterada"
        });
        return;
    }

    next();
}

export default justificationExistsMiddleware;